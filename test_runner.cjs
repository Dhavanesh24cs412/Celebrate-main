const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    const fileUrl = 'file:///' + path.resolve('d:/Celebrate/test_strict_mode.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    // Wait a bit to ensure image loading finishes
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
