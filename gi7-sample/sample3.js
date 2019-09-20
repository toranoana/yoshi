const puppeteer = require('puppeteer');
const util = require('util');

(async () => {
    const targetUrl = process.argv[2];

    const browser = await puppeteer.launch({args: ['--lang=ja']});
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1000});

    // CDPクライアントを作成
    const pageClient = page["_client"];

    const dataReceivedList = [];
    pageClient.on("Network.dataReceived", event => {
        dataReceivedList.push(event);
    });

    await page.setRequestInterception(true);
    page.on("request", async request => {
        request.continue();
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle0'});

    let drTotalDataLength = 0;
    let drTotalEncodedDataLength = 0;
    dataReceivedList.forEach(dr => {
        drTotalDataLength+=dr.dataLength;
        drTotalEncodedDataLength+=dr.encodedDataLength;
    });

    // byte -> MB
    const resources  = drTotalDataLength / 1048576;
    const transferred = drTotalEncodedDataLength / 1048576;

    // 結果のダンプ
    console.log(util.inspect(dataReceivedList, { maxArrayLength: null }));

    const report = `${transferred.toFixed(2)} MB transferred
${resources.toFixed(2)} MB resources`;

    console.log(report);
    await browser.close();
})();