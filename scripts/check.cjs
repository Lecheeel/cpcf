const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto('http://localhost:5173');
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
    for (const [width, height] of [[1440,900],[1366,768],[1920,1080],[390,844],[375,667],[320,568],[844,390]]) {
      await page.setViewportSize({ width, height });
      const layout = await page.evaluate(() => {
        const button = document.getElementById('fly').getBoundingClientRect();
        const h1 = document.querySelector('h1').getBoundingClientRect();
        const slot = document.getElementById('slot-machine').getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth,
          buttonVisible: button.top >= 0 && button.bottom <= innerHeight && button.left >= 0 && button.right <= innerWidth,
          titleVisible: h1.left >= 0 && h1.right <= innerWidth,
          slotClickable: slot.top >= 0 && slot.bottom <= innerHeight && document.elementFromPoint(slot.x + slot.width / 2, slot.y + slot.height / 2).closest('button')?.id === 'slot-machine',
          buttonClickable: document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2).closest('button')?.id === 'fly'
        };
      });
      assert.equal(layout.overflow, false, `${width}x${height}: overflow`);
      assert.ok(layout.buttonVisible && layout.buttonClickable, `${width}x${height}: button not accessible`);
      assert.ok(layout.titleVisible, `${width}x${height}: title clipped`);
      assert.ok(layout.slotClickable, `${width}x${height}: slot not accessible`);
      console.log(`Layout OK: ${width} × ${height}`);
    }
    await page.setViewportSize({width:1440,height:900});
    await page.locator('#slot-machine').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#slot-machine').isDisabled(), true);
    await page.waitForFunction(() => !document.getElementById('slot-machine').disabled);
    assert.match(await page.locator('#slot-result').textContent(), /財源廣進/);
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
    await page.locator('#fly').click();
    assert.equal(await page.locator('#fly').isDisabled(), true);
    assert.match(await page.locator('#flight-status').textContent(), /001/);
    await page.waitForFunction(() => !document.getElementById('fly').disabled);
    assert.equal(await page.locator('#fly-label').textContent(), '再次起飛');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    await page.locator('#slot-machine').click();
    await page.waitForFunction(() => !document.getElementById('slot-machine').disabled);
    assert.match(await page.locator('#slot-result').textContent(), /八方來財/);
    await page.locator('#fly').click();
    await page.waitForFunction(() => !document.getElementById('fly').disabled);
    assert.match(await page.locator('#flight-status').textContent(), /002/);
    await page.reload();
    await page.locator('#motion').click();
    await page.screenshot({path:'preview-desktop.png'});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'preview-mobile.png'});
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    await page.locator('#slot-machine').click();
    await page.waitForFunction(() => !document.getElementById('slot-machine').disabled);
    assert.match(await page.locator('#slot-result').textContent(), /財源廣進/);
    await page.locator('#fly').click();
    await page.waitForFunction(() => !document.getElementById('fly').disabled);
    assert.match(await page.locator('#flight-status').textContent(), /001/);
    assert.deepEqual(errors, []);
    console.log('Flight, sound, pause, reduced motion, assets and browser errors: OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
