const puppeteer = require('puppeteer');

async function capture() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  async function testRoute(viewUrl, stateName, isCategory) {
      console.log(`\n\n--- STATE: ${stateName} ---`);
      const page = await browser.newPage();
      await page.goto(`http://localhost:3000${viewUrl}`, { waitUntil: 'networkidle2' });
      
      async function analyze(width, height) {
        await page.setViewport({ width, height });
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
              board: board ? { left: board.getBoundingClientRect().left, right: board.getBoundingClientRect().right } : null,
              banner: banner ? { left: banner.getBoundingClientRect().left, right: banner.getBoundingClientRect().right } : null
            }
          };
        }, width);
      }
      
      const res1440 = await analyze(1440, 900);
      const res768 = await analyze(768, 1024);
      const res390 = await analyze(390, 844);
      
      console.log('1440px:', JSON.stringify(res1440, null, 2));
      console.log('768px:', JSON.stringify(res768, null, 2));
      console.log('390px:', JSON.stringify(res390, null, 2));
      
      await page.close();
  }

  await testRoute('/new-orleans', 'initial');
  
  // Swamp second view (category 1)
  await testRoute('/new-orleans?chooserState=guided-preferences&chooserCategory=swamp-airboat', 'guided-preferences: swamp-airboat');
  
  // Guided categories (6 cards)
  await testRoute('/new-orleans?chooserState=guided-categories', 'guided-categories');
  
  // Guided preferences: haunted
  await testRoute('/new-orleans?chooserState=guided-preferences&chooserCategory=haunted-after-dark', 'guided-preferences: haunted-after-dark');
  
  // Guided preferences: food
  await testRoute('/new-orleans?chooserState=guided-preferences&chooserCategory=food-cooking', 'guided-preferences: food-cooking');
  
  await browser.close();
}

capture().catch(console.error);
