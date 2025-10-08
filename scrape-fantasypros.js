const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto('https://www.fantasypros.com/nfl/rankings/ppr-superflex.php', { waitUntil: 'networkidle2' });

    const ecrData = await page.evaluate(() => window.ecrData);
    const players = ecrData.players ?? ecrData;

    fs.writeFileSync('data/ecrData.json', JSON.stringify(players, null, 2));
    await browser.close();
})();