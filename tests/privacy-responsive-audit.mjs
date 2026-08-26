import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const base = (process.env.AUDIT_BASE || 'http://127.0.0.1:8145').replace(/\/$/, '');
const out = process.env.AUDIT_OUT || '/home/ubuntu/site-audit/privacy-responsive-audit-2026-08-26.json';
const screenDir = process.env.SCREEN_DIR || '/home/ubuntu/site-audit/privacy-premium-screens-2026-08-26';
const viewports = [
  { name: 'iphone-se', width: 320, height: 800, isMobile: true },
  { name: 'iphone', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false }
];
await fs.mkdir(screenDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1, isMobile: viewport.isMobile, hasTouch: viewport.isMobile });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
  let navigationError = null;
  try {
    await page.goto(`${base}/politica-privacidade.html?privacy-responsive-audit=20260826`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(() => document.fonts?.ready);
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    navigationError = String(error?.message || error);
  }
  const data = await page.evaluate(() => {
    const idValues = [...document.querySelectorAll('[id]')].map(node => node.id);
    const duplicateIds = [...new Set(idValues.filter((id, index) => idValues.indexOf(id) !== index))];
    const summaries = [...document.querySelectorAll('.privacy-card > summary')];
    const summaryRects = summaries.map(node => {
      const rect = node.getBoundingClientRect();
      return { text: (node.innerText || '').replace(/\s+/g, ' ').trim(), width: rect.width, height: rect.height, minHeight: parseFloat(getComputedStyle(node).minHeight || '0') || 0 };
    });
    const links = [...document.querySelectorAll('a[href]')];
    const focusable = [...document.querySelectorAll('a[href], summary, button, input, select, textarea')];
    return {
      bodyClass: document.body.className,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      hero: Boolean(document.querySelector('.privacy-hero')),
      indexLinks: document.querySelectorAll('.privacy-index a').length,
      cards: document.querySelectorAll('.privacy-card').length,
      openCards: document.querySelectorAll('.privacy-card[open]').length,
      summaryRects,
      touchTargetFailures: summaryRects.filter(item => item.width < 44 || item.height < 44 || item.minHeight < 44).length,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      duplicateIds,
      focusableWithoutText: focusable.filter(node => !(node.innerText || node.getAttribute('aria-label') || node.getAttribute('title') || '').trim()).length,
      whatsappLinks: links.filter(link => link.href.includes('wa.me/5516996062046')).length,
      fontStatus: document.fonts?.status || 'unknown',
      bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim()
    };
  });
  const summaryInteractions = await page.evaluate(() => {
    const output = [];
    for (const summary of document.querySelectorAll('.privacy-card > summary')) {
      const details = summary.parentElement;
      details.open = false;
      summary.click();
      output.push({ text: (summary.innerText || '').replace(/\s+/g, ' ').trim(), opened: details.open, contentVisible: Boolean(details.querySelector('.privacy-card__content')?.getBoundingClientRect().height) });
    }
    return output;
  });
  data.summaryInteractions = summaryInteractions;
  data.summaryInteractionFailures = summaryInteractions.filter(item => !item.opened || !item.contentVisible).length;
  if (!navigationError) {
    await page.screenshot({ path: `${screenDir}/${viewport.name}-privacy-top.png`, fullPage: false });
  }
  results.push({ viewport, navigationError, pageErrors, data });
  await page.close();
}
await browser.close();
const summary = {
  base,
  cases: results.length,
  navigationErrors: results.filter(result => result.navigationError).length,
  pageErrors: results.filter(result => result.pageErrors.length).length,
  overflowCases: results.filter(result => result.data.overflow).length,
  duplicateIdCases: results.filter(result => result.data.duplicateIds.length).length,
  touchTargetFailureCases: results.filter(result => result.data.touchTargetFailures > 0).length,
  expectedCardsCases: results.filter(result => result.data.cards === 10 && result.data.indexLinks === 10).length,
  summaryInteractionFailureCases: results.filter(result => result.data.summaryInteractionFailures > 0).length,
  professionalShellCases: results.filter(result => result.data.hero && result.data.bodyClass.includes('privacy-page') && Boolean(result.data.h1)).length,
  whatsappCases: results.filter(result => result.data.whatsappLinks >= 3).length
};
const payload = { generatedAt: new Date().toISOString(), readOnly: true, noFormsSubmitted: true, viewports, summary, results };
await fs.writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ out, screenDir, summary }, null, 2));
