const puppeteer = require('puppeteer');
const util = require('util');

(async () => {
    const targetUrl = process.argv[2];

    const browser = await puppeteer.launch({args: ['--lang=ja']});
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1000});

    const consoleErrors = [];
    const consoleMessages = [];

    // CDPクライアントを作成
    const pageClient = page["_client"];
    await pageClient.send('Console.enable');
    pageClient.on('Console.messageAdded', msg => {
        consoleMessages.push(msg);
    });

    page.on("pageerror", function (err) {
        consoleErrors.push(err);
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle0'});

    const report = `consoleMessages: ${util.inspect(consoleMessages)}
consoleErrors: ${util.inspect(consoleErrors)}`;
    console.log(report);

    await browser.close();
})();