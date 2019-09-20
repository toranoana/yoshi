const puppeteer = require('puppeteer');
const util = require('util');

(async () => {
    const targetUrl = process.argv[2];

    const browser = await puppeteer.launch({args: ['--lang=ja']});
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1000});

    const requests = [];

    await page.setRequestInterception(true);
    page.on("request", async request => {
        requests.push(request);
        request.continue();
    });

    // waitUntil: 'networkidle0' でコネクションが500ミリ秒ないとページロード終了と判定する
    await page.goto(targetUrl, { waitUntil: 'networkidle0'});

    // 結果のダンプ
    console.log(util.inspect(requests, { maxArrayLength: null }));

    const report = `${requests.length} requests`;
    console.log(report);

    await browser.close();
})();