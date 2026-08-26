import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const base = (process.env.AUDIT_BASE || 'http://127.0.0.1:8140').replace(/\/$/, '');
const out = process.env.AUDIT_OUT || '/tmp/itapolitana-promotion-infant-guide-audit.json';
const fixtureInactive = process.env.PROMO_STATUS_FIXTURE !== 'live';
const viewports = [
  { name: 'iphone-se', width: 320, height: 800, isMobile: true },
  { name: 'iphone', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false }
];
const scenarios = viewports.flatMap(viewport => [
  { ...viewport, motion: 'no-preference' },
  { ...viewport, motion: 'reduce' }
]);
const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const results = [];

for (const scenario of scenarios) {
  const page = await browser.newPage();
  await page.setViewport({ width: scenario.width, height: scenario.height, deviceScaleFactor: 1, isMobile: scenario.isMobile, hasTouch: scenario.isMobile });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: scenario.motion }]);
  const pageErrors = [];
  const promoRequests = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
  if (fixtureInactive) {
    await page.setRequestInterception(true);
    page.on('request', async request => {
      if (request.url().includes('/api/promocao/picole/status')) {
        promoRequests.push({ method: request.method(), url: request.url() });
        await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'inativo', safeToAnnounce: false, campaign_active: false, activation_explicit: false, paused: true }) });
      } else {
        await request.continue();
      }
    });
  }
  let navigationError = null;
  try {
    await page.goto(`${base}/promocao.html?promotion-infant-audit=20260826`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (error) {
    navigationError = String(error?.message || error);
  }
  await new Promise(resolve => setTimeout(resolve, 1400));
  const data = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    const stepNodes = [...document.querySelectorAll('.picole-kids-step')];
    const launcher = document.querySelector('#itabot-launcher');
    const launcherRect = launcher?.getBoundingClientRect();
    const picoleWinnerForm = document.querySelector('#pm-form-vencedor, #pm-btn-reservar');
    const rulesButton = document.querySelector('[onclick="toggleRegrasPicole(this)"]');
    const rulesBox = document.querySelector('#picole-rules-box');
    return {
      title: document.title,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      duplicateIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
      bodyServerCopy: /servidor|server/i.test(document.body.innerText || ''),
      guideVisible: Boolean(document.querySelector('.picole-kids-guide')),
      guideSteps: stepNodes.length,
      stepTexts: stepNodes.map(node => (node.innerText || '').replace(/\s+/g, ' ').trim()),
      stepAnimationName: getComputedStyle(stepNodes[0] || document.body).animationName,
      stepOpacity: stepNodes.map(node => getComputedStyle(node).opacity),
      launcher: launcher ? { text: (launcher.innerText || '').replace(/\s+/g, ' ').trim(), visible: launcherRect.width > 0 && launcherRect.height > 0, position: getComputedStyle(launcher).position } : null,
      picoleWinnerFormPresent: Boolean(picoleWinnerForm),
      rulesButton: rulesButton ? { ariaExpanded: rulesButton.getAttribute('aria-expanded'), minHeight: parseFloat(getComputedStyle(rulesButton).minHeight || '0') || rulesButton.getBoundingClientRect().height } : null,
      rulesBoxPresent: Boolean(rulesBox),
      touchFeedbackInstalled: Boolean(window.__itapTouchFeedbackInstalled),
      touchFeedbackTags: [...document.scripts].filter(script => script.src.includes('itap-touch-feedback.js')).length
    };
  });
  results.push({ viewport: scenario, navigationError, pageErrors, promoRequests, data });
  await page.close();
}
await browser.close();
const normalResults = results.filter(result => result.viewport.motion === 'no-preference');
const reducedResults = results.filter(result => result.viewport.motion === 'reduce');
const summary = {
  base,
  fixtureInactive,
  cases: results.length,
  normalCases: normalResults.length,
  reducedMotionCases: reducedResults.length,
  navigationErrors: results.filter(result => result.navigationError).length,
  pageErrors: results.filter(result => result.pageErrors.length).length,
  overflowCases: results.filter(result => result.data.overflow).length,
  duplicateIdCases: results.filter(result => result.data.duplicateIds.length).length,
  guideVisibleCases: results.filter(result => result.data.guideVisible).length,
  fiveStepCases: results.filter(result => result.data.guideSteps === 5).length,
  noServerCopyCases: results.filter(result => !result.data.bodyServerCopy).length,
  doubtLauncherCases: results.filter(result => /DÚVIDAS · CLIQUE AQUI/i.test(result.data.launcher?.text || '')).length,
  noWinnerFormCases: results.filter(result => !result.data.picoleWinnerFormPresent).length,
  normalAnimationCases: normalResults.filter(result => /itapPicoleStepIn/i.test(result.data.stepAnimationName || '')).length,
  reducedMotionPassCases: reducedResults.filter(result => result.data.stepAnimationName === 'none' && result.data.stepOpacity.every(opacity => opacity === '1')).length,
  touchFeedbackCases: results.filter(result => result.data.touchFeedbackInstalled && result.data.touchFeedbackTags === 1).length,
  allStatusRequestsGet: results.every(result => result.promoRequests.every(request => request.method === 'GET'))
};
const payload = { generatedAt: new Date().toISOString(), readOnly: true, noSubmissions: true, viewports, scenarios, summary, results };
await fs.writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ out, summary }, null, 2));
