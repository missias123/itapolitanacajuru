import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:8135';
const OUT = process.env.AUDIT_OUT || '/tmp/itapolitana-casquinha-copo-catalog-audit.json';
const VIEWPORTS = [
  { name: 'iphone-se', width: 320, height: 800, isMobile: true },
  { name: 'iphone', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false }
];
const MASS_SKUS = {
  'SVM-CASK-01': { name: 'Casquinha', size: '1 Bola', price: 8 },
  'SVM-CASK-02': { name: 'Casquinha', size: '2 Bolas', price: 10 },
  'SVM-CASK-03': { name: 'Casquinha', size: '3 Bolas', price: 12 },
  'SVM-COPO-01': { name: 'Copo', size: '1 Bola', price: 8 },
  'SVM-COPO-02': { name: 'Copo', size: '2 Bolas', price: 10 },
  'SVM-COPO-03': { name: 'Copo', size: '3 Bolas', price: 12 },
  'SVM-CR-01': { name: 'Copo recheado', size: '1 Bola', price: 10 },
  'SVM-CR-02': { name: 'Copo recheado', size: '2 Bolas', price: 12 },
  'SVM-CR-03': { name: 'Copo recheado', size: '3 Bolas', price: 15 }
};
const HOME_CARDS = {
  Casquinha: 'R$ 8,00',
  Copo: 'R$ 8,00',
  'Copo recheado': 'R$ 10,00',
  Cascão: 'R$ 12,00',
  Cestinha: 'R$ 14,00'
};
const LEGACY_RE = /casquinha_copo|copo_casquinha|casquinha\s*\/\s*copo|copo\s*\/\s*casquinha|casquinha\s+ou\s+copo|copo\s+ou\s+casquinha/i;

function parseMaster(raw) {
  assert.ok(raw && raw.cadastro_skus?.por_chave, 'cadastro_skus.por_chave ausente');
  const entries = Object.values(raw.cadastro_skus.por_chave);
  const bySku = new Map(entries.map((entry) => [entry.sku, entry]));
  for (const [sku, expected] of Object.entries(MASS_SKUS)) {
    const actual = bySku.get(sku);
    assert.ok(actual, `SKU ausente no mestre: ${sku}`);
    assert.equal(actual.nome, expected.name, `${sku}: nome divergente`);
    assert.equal(actual.tamanho, expected.size, `${sku}: tamanho divergente`);
    assert.equal(Number(actual.preco), expected.price, `${sku}: preço divergente`);
    assert.equal(actual.ativo, true, `${sku}: SKU não está activo`);
  }
  const prices = raw.sorvetes?.preços || raw.sorvetes?.precos || {};
  assert.deepEqual(Object.keys(prices), ['casquinha', 'copo', 'copo_recheado', 'cascão', 'cestinha'], 'formatos de massa fora da ordem oficial');
  assert.equal(prices.casquinha['1 Bola'], 8);
  assert.equal(prices.casquinha['2 Bolas'], 10);
  assert.equal(prices.casquinha['3 Bolas'], 12);
  assert.equal(prices.copo['1 Bola'], 8);
  assert.equal(prices.copo['2 Bolas'], 10);
  assert.equal(prices.copo['3 Bolas'], 12);
  assert.equal(prices.copo_recheado['1 Bola'], 10);
  assert.equal(prices.copo_recheado['2 Bolas'], 12);
  assert.equal(prices.copo_recheado['3 Bolas'], 15);
  assert.equal(Object.keys(prices).some((key) => /casquinha[_/]?copo|copo[_/]?casquinha/i.test(key)), false, 'chave combinada no catálogo mestre');
  return { bySku, entries: entries.length };
}

async function inspectPage(browser, route, viewport) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1, isMobile: viewport.isMobile, hasTouch: viewport.isMobile });
  const errors = [];
  const failedRequests = [];
  const httpFailures = [];
  const localOrigin = new URL(BASE).origin;
  const isExternalExpected = (url) => /^https:\/\/(api\.itapolitanacajuru\.com\.br\/|www\.google-analytics\.com\/|www\.googletagmanager\.com\/)/i.test(url);
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => { const text = message.text(); const knownExternal = /api\.itapolitanacajuru\.com\.br\/api\/promocao\/picole\/status/i.test(text); if (message.type() === 'error' && !knownExternal && !/Failed to load resource:/i.test(text)) errors.push(text); });
  page.on('requestfailed', (request) => { if (!isExternalExpected(request.url())) failedRequests.push({ url: request.url(), error: request.failure()?.errorText || '' }); });
  page.on('response', (response) => { if (response.status() >= 400 && new URL(response.url()).origin === localOrigin) httpFailures.push({ url: response.url(), status: response.status() }); });
  let navigationError = null;
  try {
    await page.goto(`${BASE}/${route}?catalog-audit=20260827`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction((pageRoute) => pageRoute === 'index.html'
      ? Boolean(window.PRODUTOS_DATA?.cadastro_skus?.por_chave) && document.querySelectorAll('#sorvetes-grid .prod-card').length >= 5
      : pageRoute === 'retirada.html'
        ? document.querySelectorAll('.product[data-catalog-sku]').length > 0
        : document.querySelectorAll('#lista-caixas [data-sku], #lista-tortas [data-sku], #lista-acrescimos [data-sku]').length > 0, { timeout: 30000 }, route);
  } catch (error) {
    navigationError = String(error?.message || error);
  }
  const result = await page.evaluate((pageRoute) => {
    const bodyText = document.body?.innerText || '';
    const base = {
      route: pageRoute,
      width: innerWidth,
      height: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
      legacyText: bodyText.match(/casquinha_copo|copo_casquinha|casquinha\s*\/\s*copo|copo\s*\/\s*casquinha|casquinha\s+ou\s+copo|copo\s+ou\s+casquinha/i)?.[0] || '',
      bodyTextLength: bodyText.length
    };
    if (pageRoute === 'index.html') {
      return {
        ...base,
        cards: [...document.querySelectorAll('#sorvetes-grid .prod-card')].map((card) => ({
          name: card.querySelector('.prod-nome')?.textContent.trim() || '',
          text: card.innerText,
          sku: card.querySelector('[data-sku]')?.getAttribute('data-sku') || ''
        }))
      };
    }
    if (pageRoute === 'retirada.html') {
      return {
        ...base,
        products: [...document.querySelectorAll('.product[data-catalog-sku]')].map((row) => ({
          sku: row.dataset.catalogSku || '',
          name: (row.querySelector('.product__name')?.textContent || '').replace(/^\s*\d+/, '').replace(/Esgotado/g, '').trim(),
          price: row.querySelector('.product__price')?.textContent.trim() || '',
          text: row.innerText
        }))
      };
    }
    return {
      ...base,
      cards: [...document.querySelectorAll('#lista-caixas [data-sku], #lista-tortas [data-sku], #lista-acrescimos [data-sku]')].map((card) => ({
        name: card.querySelector('.prod-nome')?.textContent.trim() || '',
        text: card.innerText,
        sku: card.dataset.sku || ''
      }))
    };
  }, route);
  await page.close();
  return { viewport, navigationError, errors, failedRequests, httpFailures, ...result };
}

const raw = JSON.parse(await fs.readFile(path.join(ROOT, 'dados', 'produtos.json'), 'utf8'));
const master = parseMaster(raw);
const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const results = [];
try {
  for (const viewport of VIEWPORTS) {
    results.push(await inspectPage(browser, 'index.html', viewport));
    results.push(await inspectPage(browser, 'retirada.html', viewport));
    results.push(await inspectPage(browser, 'encomendas.html', viewport));
  }
} finally {
  await browser.close();
}

for (const result of results) {
  assert.equal(result.navigationError, null, `${result.route} ${result.viewport.name}: navegação/espera falhou: ${result.navigationError}`);
  assert.equal(result.errors.length, 0, `${result.route} ${result.viewport.name}: erros de navegador: ${result.errors.join(' | ')}`);
  assert.equal(result.failedRequests.length, 0, `${result.route} ${result.viewport.name}: requests locais falharam: ${JSON.stringify(result.failedRequests)}`);
  assert.equal(result.httpFailures.length, 0, `${result.route} ${result.viewport.name}: respostas HTTP locais falharam: ${JSON.stringify(result.httpFailures)}`);
  assert.equal(result.overflow, false, `${result.route} ${result.viewport.name}: overflow horizontal`);
  assert.equal(result.legacyText, '', `${result.route} ${result.viewport.name}: nomenclatura legada visível (${result.legacyText})`);
  if (result.route === 'encomendas.html') assert.ok(result.cards.every((card) => master.bySku.has(card.sku)), `${result.route} ${result.viewport.name}: card fora do mestre: ${JSON.stringify(result.cards.filter((card) => !master.bySku.has(card.sku)))}`);
}

const home = results.find((result) => result.route === 'index.html' && result.viewport.name === 'iphone');
assert.equal(home.cards.length, Object.keys(HOME_CARDS).length, 'Home: quantidade inesperada de cards de sorvetes de massa');
for (const [name, price] of Object.entries(HOME_CARDS)) {
  const card = home.cards.find((item) => item.name === name);
  assert.ok(card, `Home: card ausente ou com nome diferente: ${name}`);
  assert.match(card.text, new RegExp(price.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Home: preço inicial divergente para ${name}`);
  assert.ok(card.sku && master.bySku.has(card.sku), `Home: SKU não oficial para ${name}: ${card.sku}`);
}

const retirada = results.find((result) => result.route === 'retirada.html' && result.viewport.name === 'iphone');
const nonMasterRows = retirada.products.filter((item) => !master.bySku.has(item.sku));
assert.deepEqual(nonMasterRows, [], `Peça e Retire: existem cards com SKU fora do Cardápio Mestre: ${JSON.stringify(nonMasterRows)}`);
for (const [sku, expected] of Object.entries(MASS_SKUS)) {
  const row = retirada.products.find((item) => item.sku === sku);
  assert.ok(row, `Peça e Retire: SKU não renderizado: ${sku}`);
  assert.match(row.name, new RegExp(expected.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${sku}: nome renderizado divergente`);
  assert.match(row.price, new RegExp(`R\\$ ${expected.price.toFixed(2).replace('.', ',')}`), `${sku}: preço renderizado divergente`);
}
const massRows = retirada.products.filter((item) => Object.hasOwn(MASS_SKUS, item.sku));
assert.equal(massRows.length, Object.keys(MASS_SKUS).length, 'Peça e Retire: número divergente de SKUs de massa');
assert.equal(new Set(massRows.filter((item) => /CASK|COPO-/.test(item.sku)).map((item) => item.name.replace(/\d+$/, '').trim())).size >= 2, true, 'Casquinha e Copo não aparecem como produtos separados');
assert.equal(massRows.filter((item) => /SVM-CR-/.test(item.sku)).every((item) => /Copo recheado/i.test(item.name)), true, 'Copo recheado perdeu sua identidade própria');

const payload = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  readOnly: true,
  masterEntries: master.entries,
  summary: {
    cases: results.length,
    navigationErrors: results.filter((item) => item.navigationError).length,
    browserErrorCases: results.filter((item) => item.errors.length).length,
    localFailedRequestCases: results.filter((item) => item.failedRequests.length).length,
    localHttpFailureCases: results.filter((item) => item.httpFailures.length).length,
    overflowCases: results.filter((item) => item.overflow).length,
    legacyTextCases: results.filter((item) => item.legacyText).length,
    homeCards: home.cards.length,
    retiradaMassSkus: massRows.length,
    encomendasCards: results.find((result) => result.route === 'encomendas.html' && result.viewport.name === 'iphone')?.cards.length || 0,
    encomendasNonMasterCards: results.filter((result) => result.route === 'encomendas.html').flatMap((result) => result.cards.filter((card) => !master.bySku.has(card.sku))).length
  },
  results
};
await fs.writeFile(OUT, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ out: OUT, summary: payload.summary }, null, 2));
