import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to the local dev server
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Get console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const content = await page.content();
  
  if (content.includes('Today’s Focus')) {
    console.log('SUCCESS: Today\'s Focus rendered!');
  } else if (content.includes('Upper Body Strength')) {
    console.log('WARNING: Still showing static data.');
  }

  await browser.close();
})();
