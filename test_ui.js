const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // We need to trigger the extraction flow.
    // Wait, the app might require login!
    // If it requires login, we need to bypass it or type credentials.
    // Let's just check if we can bypass login or see what's on the page.
    console.log("Page title:", await page.title());
    const content = await page.content();
    if (content.includes('Sign In') || content.includes('Login')) {
      console.log('Login page detected. This script might not be able to easily reach PlannerOverlays without auth.');
    } else {
      console.log('No login detected or bypassed.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
