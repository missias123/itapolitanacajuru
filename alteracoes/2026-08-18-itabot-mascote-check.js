const puppeteer = require('puppeteer');

const baseUrl = process.env.ITAPOLITANA_URL || 'http://127.0.0.1:4173/carrossel.html?whatsappBadge=1';

async function checkMascot(browser, name, viewport) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#itabot-launcher');
  const data = await page.evaluate(() => {
    const launcher = document.querySelector('#itabot-launcher');
    const question = launcher.querySelector('.itabot-launcher-question');
    const r = launcher.getBoundingClientRect();
    const cs = window.getComputedStyle(launcher);
    return {
      text: question ? question.innerText : '',
      rect: { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
      background: cs.backgroundColor,
      visibility: cs.visibility,
      display: cs.display
    };
  });
  await page.screenshot({ path: `/home/ubuntu/itapolitanacajuru/alteracoes/2026-08-18-itabot-mascote-${name}.png`, fullPage: false });
  await page.close();
  return data;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const report = {
    desktop: await checkMascot(browser, 'desktop', { width: 1280, height: 800 }),
    mobile: await checkMascot(browser, 'mobile', { width: 390, height: 844 })
  };
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
