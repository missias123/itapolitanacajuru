const puppeteer = require('puppeteer');

const baseUrl = process.env.ITAPOLITANA_URL || 'http://127.0.0.1:4173/carrossel.html?whatsappBadge=1';

function overlaps(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function rect(node) {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

async function checkViewport(browser, name, viewport) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
  const errors = [];
  const missing = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) missing.push({ status: response.status(), url: response.url() }); });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.itp-whatsapp-badge');
  const data = await page.evaluate(() => {
    const badge = document.querySelector('.itp-whatsapp-badge');
    const pagination = document.querySelector('.swiper-pagination');
    const launcher = document.querySelector('#itabot-launcher');
    const b = badge.getBoundingClientRect();
    const toRect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const imageCount = document.querySelectorAll('.swiper-slide img').length;
    return {
      badgeText: badge.innerText.trim(),
      href: badge.href,
      badge: { left: Math.round(b.left), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      imageCount,
      badgeVsPagination: (() => { const p = toRect(pagination); return p ? !(b.right <= p.left || b.left >= p.right || b.bottom <= p.top || b.top >= p.bottom) : false; })(),
      badgeVsLauncher: (() => { const p = toRect(launcher); return p ? !(b.right <= p.left || b.left >= p.right || b.bottom <= p.top || b.top >= p.bottom) : false; })(),
      zIndex: getComputedStyle(badge).zIndex
    };
  });
  await page.screenshot({ path: `/home/ubuntu/itapolitanacajuru/alteracoes/2026-08-18-whatsapp-carrossel-${name}.png`, fullPage: false });
  await page.close();
  return { ...data, errors, missing };
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const report = {
    desktop: await checkViewport(browser, 'desktop', { width: 1280, height: 800 }),
    mobile: await checkViewport(browser, 'mobile', { width: 390, height: 844 })
  };
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
