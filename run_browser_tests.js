const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: [
      '--no-sandbox',
      '--host-rules=MAP www.welcometoneworleanstours.com 127.0.0.1'
    ] 
  });
  
  const testUrl = async (path, isMobile = false) => {
    const page = await browser.newPage();
    if (isMobile) {
      await page.setViewport({ width: 390, height: 844 });
    } else {
      await page.setViewport({ width: 1440, height: 1000 });
    }
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    try {
      const response = await page.goto(`http://www.welcometoneworleanstours.com:3000${path}`, { waitUntil: 'networkidle2' });
      
      const title = await page.title();
      
      const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : null;
        
        const operatorLabels = Array.from(document.querySelectorAll('*'))
          .filter(el => el.children.length === 0 && (
              el.innerText.includes('Southern Style Tours') || 
              el.innerText.includes('Ragin Cajun') ||
              el.innerText.toLowerCase().includes('operator')
          )).length;
          
        const ctaButtons = Array.from(document.querySelectorAll('a, button'))
          .filter(el => el.innerText.toUpperCase().includes('CHECK DATES') || el.innerText.toUpperCase().includes('VIEW DETAILS'))
          .map(el => el.innerText);
          
        const hasDisclosure = document.body.innerText.includes('We may earn a commission') || 
                              document.body.innerText.includes('independent marketplace') ||
                              document.body.innerText.includes('Secure Booking With Operator');
                              
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
        
        const images = Array.from(document.querySelectorAll('img'));
        const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0).length;
        
        const links = Array.from(document.querySelectorAll('a'));
        const brokenLinks = links.filter(a => !a.href || a.getAttribute('href') === '').length;
        
        let faqClicked = false;
        const firstFaq = document.querySelector('summary');
        if (firstFaq) {
          firstFaq.click();
          faqClicked = true;
        }

        let fhButtonFound = false;
        let fhTarget = null;
        const fhButton = document.querySelector('a[href*="fareharbor.com"]');
        if (fhButton) {
          fhButtonFound = true;
          fhTarget = fhButton.href;
        }
        
        return {
          h1,
          operatorLabels,
          ctaText: ctaButtons.length > 0 ? ctaButtons[0] : 'None',
          hasDisclosure,
          hasOverflow,
          brokenImages,
          brokenLinks,
          faqClicked,
          fhButtonFound,
          fhTarget
        };
      });
      
      console.log(`\n--- Test for ${path} (${isMobile ? 'Mobile' : 'Desktop'}) ---`);
      console.log(`Title: ${title}`);
      console.log(`H1: ${data.h1}`);
      console.log(`Operator Labels Present: ${data.operatorLabels > 0}`);
      console.log(`CTA Text: ${data.ctaText}`);
      console.log(`Disclosure Present: ${data.hasDisclosure}`);
      console.log(`Horizontal Overflow: ${data.hasOverflow}`);
      console.log(`Broken Images: ${data.brokenImages}`);
      console.log(`Broken Links: ${data.brokenLinks}`);
      console.log(`FAQ Interaction: ${data.faqClicked}`);
      console.log(`FareHarbor Target: ${data.fhTarget || 'None'}`);
      console.log(`Console Errors: ${errors.length > 0 ? errors.join(', ') : 'None'}`);
      
    } catch (e) {
      console.log(`\n--- Test for ${path} (${isMobile ? 'Mobile' : 'Desktop'}) ---`);
      console.log(`Error: ${e.message}`);
    } finally {
      await page.close();
    }
  };

  const routes = [
    '/',
    '/tours',
    '/swamp-tours',
    '/tours/city-tour-of-new-orleans'
  ];

  for (const r of routes) {
    await testUrl(r, false); // Desktop
    await testUrl(r, true);  // Mobile
  }

  await browser.close();
})();
