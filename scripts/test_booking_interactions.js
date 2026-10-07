const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\erich\\.gemini\\antigravity\\brain\\144bb525-dc87-46bd-9386-48d7f52254a4';

async function testWtsBooking() {
  console.log('=== TEST 1: Welcome to the Swamp (Ragin Cajun Airboat) ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  // 1. Open FareHarbor item 228524 direct embed
  const fhUrl = 'https://fareharbor.com/embeds/book/ragincajuntours/items/228524/?asn=aktourcenter&full_items=yes';
  console.log('Navigating to:', fhUrl);
  await page.goto(fhUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for FareHarbor item title
  await page.waitForSelector('.item-title, .rebooking-item-title, h1, h2, [ng-bind="item.name"]', { timeout: 15000 });
  const title = await page.evaluate(() => {
    return document.querySelector('.item-title, .rebooking-item-title, h1, h2, [ng-bind="item.name"]')?.innerText || document.title;
  });
  console.log('FareHarbor Item Title Rendered:', title);

  // Take screenshot of calendar view
  const calScreenshot = path.join(ARTIFACT_DIR, 'wts_fh_calendar.png');
  await page.screenshot({ path: calScreenshot, fullPage: false });
  console.log('Saved calendar screenshot to:', calScreenshot);

  // Look for open dates in the calendar
  console.log('Looking for bookable dates in calendar...');
  // Click on the specific item button for today or first available
  const dateCard = await page.waitForSelector('.calendar-ava-item-name, [class*="calendar-ava-item"]', { timeout: 10000 });
  if (dateCard) {
    console.log('Found calendar item card, clicking...');
    await dateCard.click();
    await new Promise(r => setTimeout(r, 2500));
  }

  // Check what appeared (timeslot list or modal)
  const timeslots = await page.$$('button[class*="timeslot"], a[class*="timeslot"], [class*="headline-time"], [data-timeslot]');
  console.log('Found timeslots count:', timeslots.length);
  if (timeslots.length > 0) {
    console.log('Clicking first available timeslot...');
    await timeslots[0].click();
    await new Promise(r => setTimeout(r, 3000));
  } else {
    // Check if there are buttons with times like "10:00", "12:00", "2:00", "4:00"
    const clickedTime = await page.evaluate(() => {
      const timeButtons = Array.from(document.querySelectorAll('button, a, div[role="button"]'))
        .filter(b => /\b(10|12|1|2|4|9):\d{2}\s*(am|pm)?/i.test(b.innerText || ''));
      if (timeButtons.length > 0) {
        timeButtons[0].click();
        return timeButtons[0].innerText.trim();
      }
      return null;
    });
    console.log('Clicked time button:', clickedTime);
    await new Promise(r => setTimeout(r, 3000));
  }

  // Look for customer count / pickup options
  const checkoutSelectors = await page.evaluate(() => {
    return {
      inputs: Array.from(document.querySelectorAll('input, select')).map(i => ({ type: i.type, name: i.name, value: i.value, id: i.id })),
      labels: Array.from(document.querySelectorAll('label, .customer-type, [class*="custom-field"]')).map(l => l.innerText.trim()).filter(Boolean),
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5')).map(h => h.innerText.trim()).filter(Boolean)
    };
  });
  console.log('Headings on screen:', checkoutSelectors.headings);
  console.log('Labels on screen:', checkoutSelectors.labels.slice(0, 15));

  // If there are quantity inputs or "+" buttons, let's select party of 2
  const plusButtons = await page.$$('button[aria-label*="increase"], button[class*="plus"], button[class*="increment"]');
  if (plusButtons.length > 0) {
    console.log('Clicking plus button twice for 2 passengers...');
    await plusButtons[0].click();
    await new Promise(r => setTimeout(r, 500));
    await plusButtons[0].click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Capture the checkout / customer configuration screen
  const stepScreenshot = path.join(ARTIFACT_DIR, 'wts_fh_checkout_step.png');
  await page.screenshot({ path: stepScreenshot, fullPage: false });
  console.log('Saved checkout step screenshot to:', stepScreenshot);

  // Extract visible page text to confirm options (Hotel Pickup vs Self Drive, Price)
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Has Hotel Pick Up:', pageText.includes('Hotel Pick Up') || pageText.includes('Pickup') || pageText.includes('Hotel'));
  console.log('Has Self Drive:', pageText.includes('Self Drive'));
  console.log('Has 10 Passengers:', pageText.includes('10 Passengers'));

  await browser.close();
}

async function testJfdBooking() {
  console.log('\n=== TEST 2: Juneau Flight Deck (TEMSCO Mendenhall Glacier Walk) ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const fhUrl = 'https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes';
  console.log('Navigating to:', fhUrl);
  await page.goto(fhUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('.item-title, .rebooking-item-title, h1, h2, [ng-bind="item.name"]', { timeout: 15000 });
  const title = await page.evaluate(() => {
    return document.querySelector('.item-title, .rebooking-item-title, h1, h2, [ng-bind="item.name"]')?.innerText || document.title;
  });
  console.log('TEMSCO FareHarbor Title:', title);

  const jfdScreenshot = path.join(ARTIFACT_DIR, 'jfd_fh_calendar.png');
  await page.screenshot({ path: jfdScreenshot, fullPage: false });
  console.log('Saved JFD calendar screenshot to:', jfdScreenshot);

  await browser.close();
}

async function main() {
  try {
    await testWtsBooking();
  } catch (e) {
    console.error('WTS Test Error:', e);
  }
  try {
    await testJfdBooking();
  } catch (e) {
    console.error('JFD Test Error:', e);
  }
}

main();
