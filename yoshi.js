require('dotenv').config();
const puppeteer = require('puppeteer');
const command = require('commander');
const request = require('request');
const util = require('util');
const fs = require('fs');
const dateFormat = require('dateformat');
const delay = require('delay');

command
    .option('-u, --url <target-url>', 'url')
    .option('-f, --full-screen-capture', 'capture image full-screen (default=first view) [optional]')
    .option('-m, --mobile', 'device mode = smart phone [optional]')
    .option('-s, --slack', 'send slack message and image [optional]');

const argParse = command.parse(process.argv);

if (!argParse.url) {
    console.log("argument missing. param -u [url]");
    return;
}

const targetUrl = argParse.url;
const isMobile = !!argParse.mobile;
const isFullScreenCapture = !!argParse.fullScreenCapture;
const isSlack = !!argParse.slack;
const delayTimeSec = 10;
const applicationDate = new Date();

(async () => {
    await run();
})();

async function run() {
    const browser = await puppeteer.launch({
        // sandboxの無効化はlinuxで動作させるため
        // https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md
        args: ['--lang=ja', '--no-sandbox', '--disable-setuid-sandbox'], //'--incognito'
        //'slowMo': 100,
    });
    const page = await browser.newPage();
    //const context = await browser.createIncognitoBrowserContext();
    //const page = await context.newPage();

    // CDPクライアントを作成
    const pageClient = page["_client"];

    if (isMobile) {
        // デバイスリスト
        // https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js
        // TODO デバイスは引数で指定できるようにする
        const device = puppeteer.devices['iPhone X'];
        await page.emulate(device);
    } else {
        await page.setViewport({width: 1920, height: 1000});
    }

    const requests = [];
    const responses = [];
    const consoleErrors = [];
    const consoleMessages = [];

    //https://github.com/GoogleChrome/puppeteer/issues/2971
    pageClient.on("Network.responseReceived", event => {
        responses.push(event)
    });

    const dataReceivedList = [];
    pageClient.on("Network.dataReceived", event => {
        dataReceivedList.push(event);
    });

    await pageClient.send('Console.enable');
    pageClient.on('Console.messageAdded', msg => {
        console.log(msg);
        consoleMessages.push(msg);
    });

    page.on("pageerror", function (err) {
        console.log("Error: " + err.toString());
        consoleErrors.push(err);
    });

    await page.setRequestInterception(true);
    page.on("request", async request => {
        requests.push(request);
        request.continue();
    });

    // 対象サイトをブラウザで開く前にメトリクスを取得
    const start_metrics = await page.metrics();

    await page.setCacheEnabled(false);
    await page.goto(targetUrl, { waitUntil: 'networkidle0'});

    // waitUntilだけだと厳密にページロード終了が検知できないので強制的に10秒待機
    for(let i=0; i<=delayTimeSec; i++) {
        console.log(requests.length);
        console.log(responses.length);
        // 1秒待機
        await delay(1000);
    }
    const end_time = responses[responses.length - 1].timestamp;

    const imageFileName = './image/' + dateFormat(applicationDate, "yyyymmdd-HHMMss") + '.jpg';
    await page.screenshot({path: imageFileName, type: 'jpeg', quality: 50, fullPage: isFullScreenCapture});

    let drTotalDataLength = 0;
    let drTotalEncodedDataLength = 0;
    dataReceivedList.forEach(dr => {
        drTotalDataLength+=dr.dataLength;
        drTotalEncodedDataLength+=dr.encodedDataLength;
    });

    const resources  = drTotalDataLength / 1048576;
    const transferred = drTotalEncodedDataLength / 1048576;
    const work_time = (end_time - start_metrics.Timestamp).toFixed(2);

    const report = `${requests.length} requests
${transferred.toFixed(2)} MB transferred
${resources.toFixed(2)} MB resources
Finish: ${work_time} sec
consoleMessages: ${util.inspect(consoleMessages)}
consoleErrors: ${util.inspect(consoleErrors)}`;

    console.log(report);

    if(isSlack) {
        postSlack(report);
        postImageSlack(imageFileName);
    }

    //TODO トレースするためにログファイルには大量にデータを格納しておく できればJSONで

    await browser.close();
}

function postSlack(message) {

    const options = {
        url: process.env.NP_SLACK_URL,
        method: 'POST',
        form: `payload={"text": "${message}", "username": "net_perf_by_puppeteer"}`,
        json: true
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log('success: post slack');
        } else {
            console.log('error: '+ response.statusCode + body);
        }
    })
}

function postImageSlack(imageFileName) {

    const options = {
        token: process.env.NP_SLACK_TOKEN,
        channels: process.env.NP_CHANNEL,
        file: fs.createReadStream(imageFileName),
        filename: 'puppeteer.jpg'
    };

    request.post({url:'https://slack.com/api/files.upload', formData: options}, function(error, response) {
        if (!error && response.statusCode === 200) {
            console.log('success: post image slack');
        } else {
            console.log('status code: ' + response.statusCode);
        }
    });
}