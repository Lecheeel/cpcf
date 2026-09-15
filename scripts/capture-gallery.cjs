const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'docs', 'images');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth));
    await page.evaluate(() => document.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 1400; }));
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mobile.png') });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: path.join(output, 'wallpaper.jpg'), type: 'jpeg', quality: 93 });
    console.log('Saved desktop, mobile and 1920 × 1080 wallpaper.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
