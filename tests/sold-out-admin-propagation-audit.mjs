import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8166;
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

await waitForServer();
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
  assert(report.index.massSoldOut.includes('Abacaxi ao Vinho'), 'Home: Abacaxi ao Vinho não apareceu riscado');
  assert(report.index.massSoldOut.includes('Limão'), 'Home: Limão de massa não apareceu riscado');
  assert(!report.index.waterPopsicleSoldOut.includes('Limão'), 'Home: picolé de Limão apareceu esgotado sem estar esgotado');
  assert(report.index.stuffedPopsicleSoldOut.includes('Mamão Papaia'), 'Home: Mamão Papaia não apareceu riscado');
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
  assert(report.encomendasMassas.includes('Abacaxi ao Vinho'), 'Encomendas: Abacaxi ao Vinho não apareceu riscado');
  assert(report.encomendasMassas.includes('Limão'), 'Encomendas: Limão de massa não apareceu riscado');
  await encomendas.evaluate(() => {
    window.fecharModal('modal-sabores');
    window.toggleSecao('sec-picoles');
    document.querySelector('button.btn-sabores--picoles')?.click();
  });
  await encomendas.waitForSelector('#lista-sabores-picole [data-picole-key]', { timeout: 15000 });
  report.encomendasPicoles = await encomendas.evaluate(() => {
    const rows = [...document.querySelectorAll('#lista-sabores-picole [data-picole-key]')].map((row, index) => ({
      index,
      text: row.textContent,
      soldOut: row.classList.contains('is-esgotado'),
      plusDisabled: Boolean(row.querySelector('.picole-qtd-btn--plus')?.disabled),
    }));
    return {
      mamao: rows.find((row) => row.text.includes('Mamão Papaia')),
      maracuja: rows.find((row) => row.text.includes('Maracujá')),
    };
  });
  assert(report.encomendasPicoles.mamao?.soldOut, 'Encomendas: Mamão Papaia não apareceu como esgotado');
  assert(report.encomendasPicoles.mamao?.plusDisabled, 'Encomendas: Mamão Papaia continuou podendo entrar no carrinho');
  assert(report.encomendasPicoles.mamao.index > report.encomendasPicoles.maracuja.index, 'Encomendas: Mamão Papaia não ficou abaixo de Maracujá');
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
  assert(report.retiradaMassas.some((item) => item.text.includes('Abacaxi ao Vinho') && item.soldOut && item.disabled), 'Retirada: Abacaxi ao Vinho não apareceu bloqueado');
  assert(report.retiradaMassas.some((item) => item.text.includes('Limão') && !item.text.includes('Limão Suíço') && item.soldOut && item.disabled), 'Retirada: Limão de massa não apareceu bloqueado');
  await retirada.evaluate(() => {
    document.querySelector('[data-close="flavor-dialog"]')?.click();
    const button = [...document.querySelectorAll('.product .add-btn')].find((entry) => entry.textContent.includes('Abrir lista única'));
    button?.click();
  });
  await retirada.waitForSelector('#popsicle-list .popsicle-row', { timeout: 15000 });
  report.retiradaPicoles = await retirada.evaluate(() => {
    const rows = [...document.querySelectorAll('#popsicle-list .popsicle-row')].map((row, index) => ({
      index,
      text: row.textContent,
      soldOut: row.classList.contains('is-unavailable'),
      plusDisabled: Boolean(row.querySelector('.qty button:last-child')?.disabled),
    }));
    return {
      limao: rows.find((row) => row.text.includes('Limão')),
      groselha: rows.find((row) => row.text.includes('Groselha')),
      melancia: rows.find((row) => row.text.includes('Melância')),
      mamao: rows.find((row) => row.text.includes('Mamão Papaia')),
      maracuja: rows.find((row) => row.text.includes('Maracujá')),
      morango: rows.find((row) => row.text.includes('Morango')),
    };
  });
  assert(!report.retiradaPicoles.limao?.soldOut, 'Retirada: picolé de Limão apareceu esgotado sem estar esgotado');
  assert(!report.retiradaPicoles.limao?.plusDisabled, 'Retirada: picolé de Limão não voltou ao carrinho');
  assert.equal(report.retiradaPicoles.limao.index, report.retiradaPicoles.groselha.index + 1, 'Retirada: Limão saiu da posição oficial depois de Groselha');
  assert.equal(report.retiradaPicoles.melancia.index, report.retiradaPicoles.limao.index + 1, 'Retirada: Melância não ficou logo após Limão');
  assert(report.retiradaPicoles.mamao?.soldOut, 'Retirada: Mamão Papaia não apareceu como esgotado');
  assert(report.retiradaPicoles.mamao?.plusDisabled, 'Retirada: Mamão Papaia continuou podendo entrar no carrinho');
  assert.equal(report.retiradaPicoles.mamao.index, report.retiradaPicoles.maracuja.index + 1, 'Retirada: Mamão Papaia saiu da posição oficial depois de Maracujá');
  assert.equal(report.retiradaPicoles.morango.index, report.retiradaPicoles.mamao.index + 1, 'Retirada: Morango não ficou logo após Mamão Papaia');
  await retirada.close();

  console.log(JSON.stringify({ pass: true, report }, null, 2));
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
