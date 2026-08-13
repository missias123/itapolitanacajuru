import fs from 'node:fs';
import process from 'node:process';

let browserModule;
try {
  browserModule = await import('playwright');
} catch (error) {
  console.error('PLAYWRIGHT_UNAVAILABLE');
  process.exit(2);
}

const { chromium } = browserModule;
const widths = [320, 360, 375, 390, 414, 768, 1024, 1366, 1920];
const url = 'http://127.0.0.1:4173/index.html?preview=carousel-order-v1';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const header = document.querySelector('.itap-header');
    const carousel = document.querySelector('#itp-crs-wrap');
    const strip = document.querySelector('#strip-sensorial');
    const iframe = document.querySelector('#itp-crs-iframe');
    const rect = (node) => node ? node.getBoundingClientRect() : null;
    const h = rect(header), c = rect(carousel), s = rect(strip);
    return {
      headerBottom: h?.bottom ?? null,
      carouselTop: c?.top ?? null,
      carouselBottom: c?.bottom ?? null,
      stripTop: s?.top ?? null,
      carouselHeight: c?.height ?? null,
      iframeSrc: iframe?.getAttribute('src') ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      navLinks: document.querySelectorAll('.itap-header-nav .itap-nav-btn').length,
      hasDuvidas: Boolean(document.querySelector('.ita-bot-duvidas-btn')),
      hasCarousel: Boolean(carousel),
      iframeLoaded: Boolean(iframe?.contentDocument?.body),
    };
  });
  results.push({ width, ...data, ok: data.carouselTop === data.headerBottom && data.carouselTop < data.stripTop && data.scrollWidth <= data.clientWidth && data.navLinks === 5 && data.hasDuvidas && data.iframeSrc === 'carrossel.html' && consoleErrors.length === 0, consoleErrors });
  await page.close();
}
await browser.close();
fs.writeFileSync('/home/ubuntu/itapolitanacajuru/alteracoes/2026-08-13-carrossel-preciso/responsividade-results.json', JSON.stringify(results, null, 2));
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} width=${result.width} header=${result.headerBottom} carousel=${result.carouselTop} strip=${result.stripTop} scroll=${result.scrollWidth}/${result.clientWidth} errors=${result.consoleErrors.length}`);
if (results.some((result) => !result.ok)) process.exit(1);
