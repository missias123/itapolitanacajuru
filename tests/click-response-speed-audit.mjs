import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8161;
const base = `http://127.0.0.1:${port}`;
const out = process.env.AUDIT_OUT || '/tmp/itapolitana-click-response-speed-audit.json';
const MAX_NEXT_PAINT_MS = Number(process.env.MAX_CLICK_RESPONSE_MS || 220);
const MAX_SPREAD_MS = Number(process.env.MAX_CLICK_RESPONSE_SPREAD_MS || 140);

const server = spawn(process.execPath, ['tests/local-static-server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

function waitForChildExit(child) {
  if (!child || child.exitCode !== null || child.killed) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (serverOutput.includes('STATIC_SERVER_READY')) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Servidor local não iniciou: ${serverOutput}`);
}

const VIEWPORTS = [
  { name: 'iphone', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false, hasTouch: false },
];

const SCENARIOS = [
  {
    id: 'home-sorvetes-accordion',
    page: 'index.html',
    selector: '#acc-sorvetes .acc-header',
    waitFor: () => document.querySelector('#acc-sorvetes .acc-header')?.getAttribute('aria-expanded') === 'true',
  },
  {
    id: 'home-picoles-accordion',
    page: 'index.html',
    selector: '#acc-picolés .acc-header',
    waitFor: () => document.querySelector('#acc-picolés .acc-header')?.getAttribute('aria-expanded') === 'true',
  },
  {
    id: 'home-encomendas-picoles-accordion',
    page: 'index.html',
    selector: '#acc-enc-picolés .acc-header',
    waitFor: () => document.querySelector('#acc-enc-picolés .acc-header')?.getAttribute('aria-expanded') === 'true',
  },
  {
    id: 'encomendas-caixas-accordion',
    page: 'encomendas.html',
    selector: 'button[onclick*="sec-caixas"]',
    waitFor: () => getComputedStyle(document.getElementById('sec-caixas')).display === 'block',
  },
  {
    id: 'encomendas-picoles-accordion',
    page: 'encomendas.html',
    selector: 'button[onclick*="sec-picoles"]',
    waitFor: () => getComputedStyle(document.getElementById('sec-picoles')).display === 'block',
  },
  {
    id: 'encomendas-picoles-modal-open',
    page: 'encomendas.html',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('button[onclick*="sec-picoles"]');
        if (hdr) hdr.click();
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('sec-picoles')).display === 'block');
    },
    selector: '.btn-sabores--picoles',
    waitFor: () => getComputedStyle(document.getElementById('modal-picoles')).display !== 'none',
  },
  {
    id: 'encomendas-picoles-plus',
    page: 'encomendas.html',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('button[onclick*="sec-picoles"]');
        if (hdr) hdr.click();
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('sec-picoles')).display === 'block');
      await page.evaluate(() => {
        const btn = document.querySelector('.btn-sabores--picoles');
        if (btn) btn.click();
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('modal-picoles')).display !== 'none');
      await page.waitForFunction(() => document.querySelectorAll('#lista-sabores-picole [data-picole-key]').length > 0);
      await page.evaluate(() => {
        const row = document.querySelector('#lista-sabores-picole [data-picole-key]');
        if (!row) return;
        row.setAttribute('data-click-speed-target', 'true');
      });
    },
    selector: '[data-click-speed-target="true"] .picole-qtd-btn--plus',
    waitFor: () => {
      const row = document.querySelector('[data-click-speed-target="true"]');
      const counter = row && row.querySelector('[id^="q-"]');
      return counter && counter.textContent.trim() === '01';
    },
  },
  {
    id: 'encomendas-carrinho-open',
    page: 'encomendas.html',
    setup: async (page) => {
      await page.evaluate(() => {
        window.carrinho = [{
          id: 'teste',
          tipo: 'Teste',
          nome: 'Item teste',
          preco: 10,
          quantidade: 1,
          precoUnit: 10,
          sabores: [],
          isPicole: false,
          isAcrescimo: false,
        }];
        if (typeof window.atualizarCarrinhoFixo === 'function') window.atualizarCarrinhoFixo();
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('btn-carrinho-fixo')).display !== 'none');
    },
    selector: '#btn-carrinho-fixo',
    waitFor: () => getComputedStyle(document.getElementById('modal-carrinho')).display !== 'none',
  },
  {
    id: 'encomendas-carrinho-close',
    page: 'encomendas.html',
    setup: async (page) => {
      await page.evaluate(() => {
        window.carrinho = [{
          id: 'teste',
          tipo: 'Teste',
          nome: 'Item teste',
          preco: 10,
          quantidade: 1,
          precoUnit: 10,
          sabores: [],
          isPicole: false,
          isAcrescimo: false,
        }];
        if (typeof window.atualizarCarrinhoFixo === 'function') window.atualizarCarrinhoFixo();
        if (typeof window.abrirCarrinho === 'function') window.abrirCarrinho();
      });
      await page.waitForFunction(() => getComputedStyle(document.getElementById('modal-carrinho')).display !== 'none');
    },
    selector: '#modal-carrinho button[onclick*="fecharModal"]',
    waitFor: () => getComputedStyle(document.getElementById('modal-carrinho')).display === 'none',
  },
];

async function medirClique(page, selector, waitForFn) {
  const result = await page.evaluate((targetSelector) => {
    const el = document.querySelector(targetSelector);
    if (!el) return { missing: true };
    el.scrollIntoView({ block: 'center', inline: 'center' });
    window.__clickResponseMetric = { nextPaintMs: null, start: performance.now() };
    el.click();
    return { missing: false };
  }, selector);
  if (result.missing) throw new Error(`Seletor não encontrado: ${selector}`);
  await page.waitForFunction(waitForFn, { timeout: 1500 });
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => {
      window.__clickResponseMetric.nextPaintMs = performance.now() - window.__clickResponseMetric.start;
      resolve();
    });
  }));
  return page.evaluate(() => window.__clickResponseMetric.nextPaintMs);
}

async function runScenario(browser, viewport, scenario) {
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    });

    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));

    await page.goto(`${base}/${scenario.page}?click-response-speed-audit=${viewport.name}-${scenario.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (scenario.setup) await scenario.setup(page);

    const nextPaintMs = await medirClique(page, scenario.selector, scenario.waitFor);

    const result = {
      scenario: scenario.id,
      page: scenario.page,
      viewport: viewport.name,
      selector: scenario.selector,
      nextPaintMs: Number(nextPaintMs.toFixed(2)),
      pass: nextPaintMs <= MAX_NEXT_PAINT_MS,
      pageErrors,
    };

    assert.deepEqual(pageErrors, [], `${scenario.id}/${viewport.name}: erros de página`);
    assert.ok(nextPaintMs <= MAX_NEXT_PAINT_MS, `${scenario.id}/${viewport.name}: resposta lenta (${nextPaintMs.toFixed(2)}ms)`);

    return result;
  } finally {
    await page.close();
  }
}

await waitForServer();

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const results = [];
try {
  for (const viewport of VIEWPORTS) {
    for (const scenario of SCENARIOS) {
      results.push(await runScenario(browser, viewport, scenario));
    }
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
  await waitForChildExit(server);
}

const summaryByViewport = VIEWPORTS.map((viewport) => {
  const items = results.filter((item) => item.viewport === viewport.name);
  const times = items.map((item) => item.nextPaintMs);
  const slowest = Math.max(...times);
  const fastest = Math.min(...times);
  return {
    viewport: viewport.name,
    count: items.length,
    fastestMs: Number(fastest.toFixed(2)),
    slowestMs: Number(slowest.toFixed(2)),
    spreadMs: Number((slowest - fastest).toFixed(2)),
  };
});

summaryByViewport.forEach((item) => {
  assert.ok(item.spreadMs <= MAX_SPREAD_MS, `${item.viewport}: variação alta entre cliques (${item.spreadMs}ms)`);
});

const payload = {
  generatedAt: new Date().toISOString(),
  base,
  thresholds: {
    maxNextPaintMs: MAX_NEXT_PAINT_MS,
    maxSpreadMs: MAX_SPREAD_MS,
  },
  summary: {
    totalScenarios: results.length,
    maxNextPaintMs: Number(Math.max(...results.map((item) => item.nextPaintMs)).toFixed(2)),
    minNextPaintMs: Number(Math.min(...results.map((item) => item.nextPaintMs)).toFixed(2)),
    byViewport: summaryByViewport,
  },
  results,
};

await fs.writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ out, summary: payload.summary }, null, 2));
