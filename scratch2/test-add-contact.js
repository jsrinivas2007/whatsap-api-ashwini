const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('BROWSER REQ FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000/dashboard/contacts', { waitUntil: 'networkidle2' });
  
  // Click Add Contact
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Contact'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Fill form using page.type
  await page.type('input[placeholder*="Name" i]', 'Puppeteer User');
  await page.type('input[placeholder*="WhatsApp" i]', '8888888888');
  await new Promise(r => setTimeout(r, 500));

  // Submit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent.includes('Add Contact') && !b.disabled);
    if (submitBtn) {
      submitBtn.click();
    } else {
      console.log('Submit button not found or is disabled');
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
