const { chromium, devices } = require('/home/ubuntu/itapolitanacajuru_repo/tests/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const cases = [
    { name: 'desktop', context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'android', context: { ...devices['Pixel 5'] } },
    { name: 'iphone', context: { ...devices['iPhone 13'] } },
  ];
  const results = [];
  for (const testCase of cases) {
    const context = await browser.newContext(testCase.context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('http://localhost:4174/index.html?led-height-check=' + testCase.name, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const launcher = document.querySelector('#itabot-launcher');
      const panel = document.querySelector('.itabot-launcher-led-panel');
      const track = document.querySelector('.itabot-launcher-led-track');
      const image = document.querySelector('.itabot-launcher-image');
      const lr = launcher && launcher.getBoundingClientRect();
      const pr = panel && panel.getBoundingClientRect();
      const tr = track && track.getBoundingClientRect();
      const ir = image && image.getBoundingClientRect();
      const panelStyle = panel ? getComputedStyle(panel) : null;
      const trackStyle = track ? getComputedStyle(track) : null;
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        launcher: lr && { x: lr.x, y: lr.y, width: lr.width, height: lr.height, bottom: window.innerHeight - lr.bottom },
        panel: pr && { x: pr.x, y: pr.y, width: pr.width, height: pr.height, bottom: window.innerHeight - pr.bottom, visible: pr.width > 0 && pr.height > 0 },
        track: tr && { width: tr.width, height: tr.height, y: tr.y, visible: tr.width > 0 && tr.height > 0, text: track.textContent },
        image: ir && { width: ir.width, height: ir.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight },
        styles: panelStyle && trackStyle && { panelHeight: panelStyle.height, panelPadding: panelStyle.padding, trackFontSize: trackStyle.fontSize, trackLineHeight: trackStyle.lineHeight, trackColor: trackStyle.color },
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        bodyOverflowX: getComputedStyle(document.body).overflowX,
      };
    });
    results.push({ name: testCase.name, errors, result });
    await context.close();
  }
  await browser.close();
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
