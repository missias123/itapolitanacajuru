import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.AUDIT_PORT || 8166);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['tests/local-static-server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (serverOutput.includes('STATIC_SERVER_READY')) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Servidor local não iniciou: ${serverOutput}`);
}

async function gotoPage(page, pathname) {
  await page.goto(`${base}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
}

async function loadExpectedSoldOut() {
  const raw = await fs.readFile(path.join(root, 'dados/produtos.json'), 'utf8');
  const parsed = JSON.parse(raw);
  const allEntries = Object.entries(parsed?.cadastro_skus?.por_chave || {}).map(([key, item]) => ({ key, ...(item || {}) }));
  const inactiveMass = allEntries
    .filter((item) => item?.categoria === 'Sabores de massa' && item?.ativo === false)
    .map((item) => String(item.nome || '').trim())
    .filter(Boolean);
  const picoleFlavors = allEntries.filter((item) => item.key.startsWith('picoles.') && item.key.split('.').length >= 3);
  const inactivePicoles = picoleFlavors
    .filter((item) => item?.ativo === false)
    .map((item) => String(item.nome || '').trim())
    .filter(Boolean);
  const activeMassSample = allEntries
    .filter((item) => item?.categoria === 'Sabores de massa' && item?.ativo !== false)
    .map((item) => String(item.nome || '').trim())
    .find(Boolean) || '';
  const activePicoleSample = picoleFlavors
    .filter((item) => item?.ativo !== false)
    .map((item) => String(item.nome || '').trim())
    .find(Boolean) || '';
  return { inactiveMass, inactivePicoles, activeMassSample, activePicoleSample };
}

const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

await waitForServer();
const expected = await loadExpectedSoldOut();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const report = {};

  const home = await browser.newPage();
  await home.setViewport({ width: 1280, height: 800 });
  await gotoPage(home, '/index.html?sold-out-admin-propagation-audit=home');
  await home.waitForFunction(() => typeof window.abrirSaboresInline === 'function' && typeof window.abrirPicoléInline === 'function', { timeout: 15000 });
  report.index = await home.evaluate(() => {
    const soldOutTexts = (root) => [...(root?.querySelectorAll('.chip-inline.is-esgotado') || [])].map((el) => el.textContent.replace(/ESGOTADO/g, '').trim()).filter(Boolean);
    const massButton = document.querySelector('button[onclick*="abrirSaboresInline(\'sorvetes\'"]');
    const massRoot = massButton?.closest('.acc-body') || document.getElementById('sorvetes-body');
    window.abrirSaboresInline('sorvetes', '39 Sabores de Sorvete', massButton);
    const massSoldOut = soldOutTexts(massRoot);
    const waterButton = document.querySelector('button[onclick*="abrirPicoléInline(\'frutas_agua\'"]');
    const popsicleRoot = waterButton?.closest('.acc-body') || document.getElementById('picolés-body');
    window.abrirPicoléInline('frutas_agua', 'Picolés Base Água & Frutas', waterButton);
    const waterPopsicleSoldOut = soldOutTexts(popsicleRoot);
    const popsicleButton = document.querySelector('button[onclick*="abrirPicoléInline(\'leite_com_recheio\'"]');
    window.abrirPicoléInline('leite_com_recheio', 'Picolés AO LEITE Cremosos Recheados', popsicleButton);
    const stuffedPopsicleSoldOut = soldOutTexts(popsicleRoot);
    return { massSoldOut, waterPopsicleSoldOut, stuffedPopsicleSoldOut };
  });
  expected.inactiveMass.forEach((name) => {
    assert(report.index.massSoldOut.includes(name), `Home: ${name} não apareceu riscado`);
  });
  if (expected.activeMassSample) {
    assert(!report.index.massSoldOut.includes(expected.activeMassSample), `Home: ${expected.activeMassSample} apareceu esgotado sem estar esgotado`);
  }
  await home.close();

  const encomendas = await browser.newPage();
  await encomendas.setViewport({ width: 1280, height: 800 });
  await gotoPage(encomendas, '/encomendas.html?sold-out-admin-propagation-audit=encomendas');
  await encomendas.waitForFunction(() => document.querySelector('#lista-caixas .btn-sabores:not([disabled])'), { timeout: 20000 });
  await encomendas.evaluate(() => {
    window.toggleSecao('sec-caixas');
    document.querySelector('#lista-caixas .btn-sabores:not([disabled])')?.click();
  });
  await encomendas.waitForSelector('#grid-sabores .sabor-item', { timeout: 15000 });
  report.encomendasMassas = await encomendas.evaluate(() => [...document.querySelectorAll('#grid-sabores .sabor-item.is-esgotado span:last-child')].map((el) => el.textContent.trim()));
  expected.inactiveMass.forEach((name) => {
    assert(report.encomendasMassas.includes(name), `Encomendas: ${name} não apareceu riscado`);
  });
  await encomendas.evaluate(() => {
    window.fecharModal('modal-sabores');
    window.toggleSecao('sec-picoles');
    document.querySelector('button.btn-sabores--picoles')?.click();
  });
  await encomendas.waitForSelector('#lista-sabores-picole [data-picole-key]', { timeout: 15000 });
  report.encomendasPicoles = await encomendas.evaluate(() => [...document.querySelectorAll('#lista-sabores-picole [data-picole-key]')].map((row) => {
    const rawName = row.querySelector('[data-picole-name], .picole-name, .sabor-nome, strong')?.textContent || row.textContent || '';
    const name = String(rawName).split('\n').map((line) => line.trim()).filter(Boolean)[0] || '';
    return {
      name,
      text: String(row.textContent || '').trim(),
      soldOut: row.classList.contains('is-esgotado'),
      plusDisabled: Boolean(row.querySelector('.picole-qtd-btn--plus')?.disabled),
    };
  }));
  expected.inactivePicoles.forEach((name) => {
    const row = report.encomendasPicoles.find((item) => norm(item.name) === norm(name));
    assert(row?.soldOut, `Encomendas: ${name} não apareceu como esgotado`);
    assert(row?.plusDisabled, `Encomendas: ${name} continuou podendo entrar no carrinho`);
  });
  assert(report.encomendasPicoles.some((item) => !item.soldOut && !item.plusDisabled), 'Encomendas: todos os picolés apareceram bloqueados');
  await encomendas.close();

  const retirada = await browser.newPage();
  await retirada.setViewport({ width: 1280, height: 800 });
  await gotoPage(retirada, '/retirada.html?demo-retirada=aberta&sold-out-admin-propagation-audit=retirada');
  await retirada.waitForSelector('[data-catalog-sku="SVM-CASK-01"] .add-btn', { timeout: 20000 });
  await retirada.evaluate(() => document.querySelector('[data-catalog-sku="SVM-CASK-01"] .add-btn')?.click());
  await retirada.waitForSelector('#flavor-distribution-list .flavor-distribution__row, #flavor-grid .sabor-item', { timeout: 15000 });
  report.retiradaMassas = await retirada.evaluate(() => [...document.querySelectorAll('#flavor-distribution-list .flavor-distribution__row, #flavor-grid .sabor-item')].map((el) => ({
    text: el.textContent.replace(/ESGOTADO/g, '').trim(),
    soldOut: el.classList.contains('is-unavailable') || el.classList.contains('is-esgotado'),
    disabled: Boolean(el.disabled) || Boolean(el.querySelector('.qty button:last-child')?.disabled),
  })));
  expected.inactiveMass.forEach((name) => {
    assert(report.retiradaMassas.some((item) => item.text.includes(name) && item.soldOut && item.disabled), `Retirada: ${name} não apareceu bloqueado`);
  });
  await retirada.evaluate(() => {
    document.querySelector('[data-close="flavor-dialog"]')?.click();
    const button = [...document.querySelectorAll('.product .add-btn')].find((entry) => entry.textContent.includes('Abrir lista única'));
    button?.click();
  });
  await retirada.waitForSelector('#popsicle-list .popsicle-row', { timeout: 15000 });
  report.retiradaPicoles = await retirada.evaluate(() => [...document.querySelectorAll('#popsicle-list .popsicle-row')].map((row) => {
    const rawName = row.querySelector('[data-popsicle-name], .popsicle-name, .sabor-nome, strong, span')?.textContent || row.textContent || '';
    const name = String(rawName).split('\n').map((line) => line.trim()).filter(Boolean)[0] || '';
    return {
      name,
      text: String(row.textContent || '').trim(),
      soldOut: row.classList.contains('is-unavailable'),
      plusDisabled: Boolean(row.querySelector('.qty button:last-child')?.disabled),
    };
  }));
  expected.inactivePicoles.forEach((name) => {
    const row = report.retiradaPicoles.find((item) => norm(item.name) === norm(name));
    assert(row?.soldOut, `Retirada: ${name} não apareceu como esgotado`);
    assert(row?.plusDisabled, `Retirada: ${name} continuou podendo entrar no carrinho`);
  });
  assert(report.retiradaPicoles.some((item) => !item.soldOut && !item.plusDisabled), 'Retirada: todos os picolés apareceram bloqueados');
  await retirada.close();

  console.log(JSON.stringify({ pass: true, report }, null, 2));
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
