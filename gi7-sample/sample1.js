const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({args: ['--lang=ja']});
    const page = await browser.newPage();
    await page.goto(process.argv[2]);
    await page.setViewport({width: 1920, height: 1000});
    await page.screenshot({path: "sample1.jpg", type: 'jpeg', quality: 50, fullPage: false});

    await browser.close();
})();