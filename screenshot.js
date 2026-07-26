const puppeteer = require('puppeteer');
async function capture() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/new-orleans', { waitUntil: 'networkidle2' });
  await page.setViewport({ width: 768, height: 1024 });
  const layout = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div')).filter(el => el.textContent === 'OR').map(m => {
        const r = m.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right };
    });
  });
  console.log('TABLET OR:', JSON.stringify(layout));
  await browser.close();
}
capture();
