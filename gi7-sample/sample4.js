const puppeteer = require('puppeteer');
const delay = require('delay'); // ①

(async () => {
    // 強制的に待機する秒数
    const delayTimeSec = 10;
    const targetUrl = process.argv[2];
    const browser = await puppeteer.launch({args: ['--lang=ja']});

    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1000});

    const requests = [];
    const responses = [];

    // requests[]はログ出力のためだけに使用
    await page.setRequestInterception(true);
    page.on("request", async request => {
        requests.push(request);
        request.continue();
    });

    // CDPクライアントを作成
    const pageClient = page["_client"];
    pageClient.on("Network.responseReceived", event => {
        responses.push(event);
    });

    // 対象サイトをブラウザで開く前にメトリクスを取得 ②
    const start_metrics = await page.metrics();

    await page.setCacheEnabled(false);
    // waitUntil: 'networkidle0' でコネクションが500ミリ秒ないとページロード終了と判定する ③
    await page.goto(targetUrl, { waitUntil: 'networkidle0'});

    // waitUntilだけだと厳密にページロード終了が検知できないので強制的に10秒待機 ④
    for(let i=0; i<=delayTimeSec; i++) {
        console.log(requests.length);
        console.log(responses.length);
        let lastRes = responses[responses.length - 1];

        // 現在の最後のレスポンスURLを出力する
        console.log(`${lastRes.timestamp} ${lastRes.response.url}`);

        // 1秒待機
        await delay(1000);
    }

    console.log(start_metrics);
    console.log(`requests: ${requests.length}`);
    console.log(`responses: ${responses.length}`);

    // 終了時間・・10秒sleepしているため、メトリクスを再度とるのではなくレスポンスの最後のURLの取得時間とする
    const end_time = responses[responses.length - 1].timestamp;

    console.log(`${end_time} - ${start_metrics.Timestamp}`);

    const work_time = (end_time - start_metrics.Timestamp).toFixed(2);

    const report = `Finish: ${work_time} sec`;

    console.log(report);
    await browser.close();
})();