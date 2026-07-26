const puppeteer = require('puppeteer');

async function capture() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/new-orleans', { waitUntil: 'networkidle2' });

  async function analyze(width, height, isDesktop) {
    await page.setViewport({ width, height });
    // Wait a tick for reflow
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let path = `/home/erichroeseler123/.gemini/antigravity/brain/75a487db-4d75-4957-a75d-adf130151923/screenshot-${width}-viewport.png`;
    await page.screenshot({ path });
    
    if (isDesktop) {
        await page.screenshot({ path: `/home/erichroeseler123/.gemini/antigravity/brain/75a487db-4d75-4957-a75d-adf130151923/screenshot-${width}-full.png`, fullPage: true });
    }

    return await page.evaluate((w) => {
      const markers = Array.from(document.querySelectorAll('div')).filter(el => el.textContent === 'OR');
      const orMarkers = markers.map((m, i) => {
        const r = m.getBoundingClientRect();
        // find closest wrapper
        let cardWrap = m.closest('div[class*="choiceCardWrapper"]');
        let index = -1;
        if (cardWrap) {
          const allWrappers = Array.from(document.querySelectorAll('div[class*="choiceCardWrapper"]'));
          index = allWrappers.indexOf(cardWrap) + 1; // 1-indexed
        }
        return { index: i, x: r.x, y: r.y, right: r.right, bottom: r.bottom, containingCard: index };
      });

      const board = document.querySelector('div[class*="boardContainer"]');
      const banner = Array.from(document.querySelectorAll('div')).find(el => el.textContent && el.textContent.includes('WHAT KIND OF ADVENTURE'));

      const h2s = Array.from(document.querySelectorAll('h2'));
      const getColor = (text) => {
         const h2 = h2s.find(h => h.textContent.includes(text));
         return h2 ? { color: window.getComputedStyle(h2).color, font: window.getComputedStyle(h2).fontFamily } : null;
      };

      return {
        width: w,
        orMarkers,
        overflow: {
          innerWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          board: board ? { left: board.getBoundingClientRect().left, right: board.getBoundingClientRect().right } : null,
          banner: banner ? { left: banner.getBoundingClientRect().left, right: banner.getBoundingClientRect().right } : null
        },
        colors: {
           city: getColor('CITY'),
           swamp: getColor('SWAMP'),
           plantation: getColor('PLANTATION'),
           notsure: getColor('SURE')
        }
      };
    }, width);
  }

  const res1440 = await analyze(1440, 900, true);
  const res768 = await analyze(768, 1024, false);
  const res390 = await analyze(390, 844, false);

  console.log('---1440---');
  console.log(JSON.stringify(res1440, null, 2));
  console.log('---768---');
  console.log(JSON.stringify(res768, null, 2));
  console.log('---390---');
  console.log(JSON.stringify(res390, null, 2));

  await browser.close();
}

capture().catch(console.error);
