const puppeteer = require('puppeteer');

async function capture() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  async function analyze(page, width, height) {
    await page.setViewport({ width, height });
    await new Promise(resolve => setTimeout(resolve, 500)); // let transitions settle
    
    return await page.evaluate((w) => {
      const markers = Array.from(document.querySelectorAll('div[class*="orMarker"]')).filter(el => el.textContent === 'OR');
      const orMarkers = markers.map((m, i) => {
        const r = m.getBoundingClientRect();
        let cardWrap = m.closest('div[class*="choiceCardWrapper"]');
        let index = -1;
        if (cardWrap) {
          const allWrappers = Array.from(document.querySelectorAll('div[class*="choiceCardWrapper"]'));
          index = allWrappers.indexOf(cardWrap) + 1; // 1-indexed
        }
        return { index: i, x: r.x, y: r.y, right: r.right, bottom: r.bottom, className: m.className, containingCard: index };
      });

      const board = document.querySelector('div[class*="boardContainer"]');
      const banner = document.querySelector('div[class*="promptBanner"]');
      
      let cards = document.querySelectorAll('div[class*="choiceCardWrapper"]').length;

      return {
        width: w,
        cards,
        orMarkers,
        overflow: {
          innerWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }
      };
    }, width);
  }

  const page = await browser.newPage();
  
  // 1. Initial State
  console.log(`\n\n--- STATE: initial ---`);
  await page.goto(`http://localhost:3000/new-orleans`, { waitUntil: 'networkidle2' });
  console.log('1440px:', JSON.stringify(await analyze(page, 1440, 900), null, 2));
  console.log('768px:', JSON.stringify(await analyze(page, 768, 1024), null, 2));
  console.log('390px:', JSON.stringify(await analyze(page, 390, 844), null, 2));

  // 2. Swamp Second State (Click "THE SWAMP")
  console.log(`\n\n--- STATE: swamp-second ---`);
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h2[class*="cardTitle"]'));
    const swamp = cards.find(c => c.textContent.includes('THE SWAMP'));
    if (swamp) swamp.closest('button, a, div[class*="choiceCard"]').click();
  });
  console.log('1440px:', JSON.stringify(await analyze(page, 1440, 900), null, 2));
  console.log('768px:', JSON.stringify(await analyze(page, 768, 1024), null, 2));
  console.log('390px:', JSON.stringify(await analyze(page, 390, 844), null, 2));
  
  // 3. Go Back to Initial
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Guided Categories (Click "NOT SURE?")
  console.log(`\n\n--- STATE: guided-categories ---`);
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h2[class*="cardTitle"]'));
    const notSure = cards.find(c => c.textContent.includes('NOT SURE?'));
    if (notSure) notSure.closest('button, a, div[class*="choiceCard"]').click();
  });
  console.log('1440px:', JSON.stringify(await analyze(page, 1440, 900), null, 2));
  console.log('768px:', JSON.stringify(await analyze(page, 768, 1024), null, 2));
  console.log('390px:', JSON.stringify(await analyze(page, 390, 844), null, 2));

  // 5. Guided Preferences (Click "FOOD & COOKING")
  console.log(`\n\n--- STATE: guided-preferences: food-cooking ---`);
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h2[class*="cardTitle"]'));
    const food = cards.find(c => c.textContent.includes('FOOD & COOKING'));
    if (food) food.closest('button, a, div[class*="choiceCard"]').click();
  });
  console.log('1440px:', JSON.stringify(await analyze(page, 1440, 900), null, 2));
  console.log('768px:', JSON.stringify(await analyze(page, 768, 1024), null, 2));
  console.log('390px:', JSON.stringify(await analyze(page, 390, 844), null, 2));

  await browser.close();
}

capture().catch(console.error);
