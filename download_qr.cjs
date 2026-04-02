const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Go to the local page
  await page.goto('http://localhost:4001/qr', { waitUntil: 'networkidle0' });
  
  // Wait for the canvas or svg to render
  await page.waitForSelector('canvas');
  
  // Extract data url from canvas
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/png', 1.0);
  });
  
  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync('public/Dropsiders_QR_Arrondi.png', base64Data, 'base64');
    console.log('Saved round QR code from local renderer!');
  } else {
    console.log('Canvas not found or failed to generate');
  }

  await browser.close();
})();
