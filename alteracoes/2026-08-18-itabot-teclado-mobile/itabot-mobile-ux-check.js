const puppeteer = require('puppeteer');

const baseUrl = process.env.ITAPOLITANA_URL || 'http://127.0.0.1:4173/index.html';

async function loadPage(browser, viewport, fakeKeyboard) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, isMobile: fakeKeyboard, hasTouch: fakeKeyboard });
  const errors = [];
  const missingResources = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) missingResources.push({ status: response.status(), url: response.url() });
  });

  if (fakeKeyboard) {
    await page.evaluateOnNewDocument(() => {
      const listeners = { resize: [], scroll: [] };
      const fakeViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetTop: 0,
        offsetLeft: 0,
        scale: 1,
        addEventListener(type, listener) {
          if (listeners[type]) listeners[type].push(listener);
        },
        removeEventListener(type, listener) {
          if (!listeners[type]) return;
          listeners[type] = listeners[type].filter((item) => item !== listener);
        },
        dispatch(type) {
          (listeners[type] || []).slice().forEach((listener) => listener());
        }
      };
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        get: () => fakeViewport
      });
      window.__itabotFakeViewport = fakeViewport;
    });
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#itabot-launcher');
  await page.evaluate(() => document.querySelector('#itabot-launcher').click());
  await page.waitForSelector('#chat-dialog.aberto');
  return { page, errors, missingResources };
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const report = { desktop: {}, mobile: {} };

  const desktop = await loadPage(browser, { width: 1280, height: 800 }, false);
  report.desktop = await desktop.page.evaluate(() => ({
    dialogOpen: document.querySelector('#chat-dialog')?.classList.contains('aberto'),
    launcherPulse: getComputedStyle(document.querySelector('.itabot-launcher-question')).animationName,
    fieldsPresent: Boolean(document.querySelector('#itabot-nome') && document.querySelector('#itabot-msg')),
    boxRect: (() => { const r = document.querySelector('#chat-dialog .chat-box').getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; })()
  }));
  report.desktop.errors = desktop.errors;
  report.desktop.missingResources = desktop.missingResources;
  await desktop.page.close();

  const mobile = await loadPage(browser, { width: 390, height: 844 }, true);
  report.mobile.beforeKeyboard = await mobile.page.evaluate(() => {
    const box = document.querySelector('#chat-dialog .chat-box').getBoundingClientRect();
    return { dialogOpen: document.querySelector('#chat-dialog')?.classList.contains('aberto'), boxHeight: Math.round(box.height), footerDisplay: getComputedStyle(document.querySelector('.itabot-fullscreen-footer')).display };
  });
  await mobile.page.evaluate(() => {
    const field = document.querySelector('#itabot-msg');
    field.focus();
    window.__itabotFakeViewport.height = 420;
    window.__itabotFakeViewport.dispatch('resize');
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
  report.mobile.afterKeyboard = await mobile.page.evaluate(() => {
    const dialog = document.querySelector('#chat-dialog');
    const field = document.querySelector('#itabot-msg');
    const area = document.querySelector('.itabot-fullscreen-scroll');
    const box = dialog.querySelector('.chat-box').getBoundingClientRect();
    const rect = field.getBoundingClientRect();
    const visibleBottom = 420;
    return {
      keyboardClass: dialog.classList.contains('itabot-keyboard-open'),
      boxHeight: Math.round(box.height),
      boxTop: Math.round(box.top),
      footerDisplay: getComputedStyle(document.querySelector('.itabot-fullscreen-footer')).display,
      fieldBottom: Math.round(rect.bottom),
      fieldVisibleAboveKeyboard: rect.top >= 0 && rect.bottom <= visibleBottom + 24,
      scrollAreaScrollTop: Math.round(area.scrollTop)
    };
  });
  report.mobile.errors = mobile.errors;
  report.mobile.missingResources = mobile.missingResources;
  await mobile.page.screenshot({ path: '/home/ubuntu/itapolitanacajuru/alteracoes/2026-08-18-itabot-teclado-mobile/itabot-mobile-keyboard-simulation.png', fullPage: false });
  await mobile.page.close();
  await browser.close();

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
