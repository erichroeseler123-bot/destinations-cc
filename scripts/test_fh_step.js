const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\erich\\.gemini\\antigravity\\brain\\144bb525-dc87-46bd-9386-48d7f52254a4';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const bookUrl = 'https://fareharbor.com/embeds/book/ragincajuntours/items/228524/availability/1774329113/book/?asn=aktourcenter&full_items=yes';
  console.log('Navigating to Shuttle Service availability booking URL:', bookUrl);
  await page.goto(bookUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 4000));

  const pageDetails = await page.evaluate(() => {
    return {
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText.trim()).filter(Boolean),
      bodySnippet: document.body.innerText.slice(0, 500)
    };
  });

  console.log('Page details:', pageDetails);

  // Take screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, 'wts_fh_direct_booking_step.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved screenshot to:', screenshotPath);

  // If there are input fields or passenger increment buttons, click them
  console.log('Selecting 2 people in the dropdown...');
  // Look for select or dropdown button
  const dropdown = await page.$('select, .customer-type button, .btn-select, select[ng-model*="count"]');
  if (dropdown) {
    const tagName = await page.evaluate(el => el.tagName, dropdown);
    if (tagName === 'SELECT') {
      await page.select('select', '2');
    } else {
      await dropdown.click();
      await new Promise(r => setTimeout(r, 500));
      // Click '2'
      const option2 = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a, button, li, option, div'))
          .filter(el => el.innerText.trim() === '2');
        if (items.length > 0) {
          items[0].click();
          return true;
        }
        return false;
      });
      console.log('Selected option 2:', option2);
    }
  } else {
    // Check if there is an input or custom dropdown
    console.log('Dropdown selector not directly found, checking custom dropdowns...');
    await page.click('[class*="select"], [class*="dropdown"], [class*="party"]');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText.trim() === '2');
      if (el) el.click();
    });
  }

  await new Promise(r => setTimeout(r, 3000));

  // Capture the updated form
  const formScreenshotPath = path.join(ARTIFACT_DIR, 'wts_fh_shuttle_pickup_step.png');
  await page.screenshot({ path: formScreenshotPath, fullPage: false });
  console.log('Saved shuttle pickup screenshot to:', formScreenshotPath);

  // Extract all labels, sections, and fields
  const formDetails = await page.evaluate(() => {
    return {
      text: document.body.innerText,
      fields: Array.from(document.querySelectorAll('label, legend, .form-group, [class*="custom-field"], [class*="pickup"]'))
        .map(el => el.innerText.trim())
        .filter(Boolean)
    };
  });
  console.log('Form details after selecting 2 passengers:');
  console.log('Fields:', formDetails.fields);
  console.log('Contains Pickup/Hotel:', /pickup|hotel/i.test(formDetails.text));
  console.log('Contains Total:', /total/i.test(formDetails.text));

  await browser.close();
}

main().catch(console.error);
