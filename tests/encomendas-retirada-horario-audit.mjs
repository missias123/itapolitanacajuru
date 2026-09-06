import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 8161;
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

await waitForServer();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.goto(`${base}/encomendas.html?horario-retirada-audit=1`, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.evaluate(() => {
    window.carrinho.length = 0;
    window.carrinho.push({
      id: 'caixa-5l-audit',
      nome: 'Caixa 5L Audit',
      tipo: 'Caixa',
      preco: 79.9,
      quantidade: 1,
      sabores: ['Chocolate', 'Morango'],
    });
    window.abrirCarrinho();
  });

  await page.waitForSelector('#modal-carrinho', { timeout: 10000 });
  await page.click('#btn-prosseguir');

  await page.type('#pedido-nome', 'Teste Encomenda');
  await page.click('#pedido-retirada');
  await page.type('#pedido-whatsapp', '(16) 99999-9999');
  await page.click('#pedido-ciencia');

  const dataMinima = await page.$eval('#pedido-data-retirada', (input) => input.min);
  assert.match(dataMinima, /^\d{4}-\d{2}-\d{2}$/);
  await page.$eval('#pedido-data-retirada', (input, value) => {
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataMinima);

  const instruction = await page.$eval('#pedido-agendamento-instrucao', (node) => node.textContent.trim());
  assert.match(instruction, /5 dias corridos/i, 'A instrução precisa destacar o prazo de 5 dias corridos.');

  const range = await page.$eval('#pedido-hora-retirada', (input) => ({ min: input.min, max: input.max }));
  assert.deepEqual(range, { min: '11:00', max: '20:55' });

  await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '20:55';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  let buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '1', '20:55 deve manter o formulário válido.');
  assert.notEqual(buttonState.pointerEvents, 'none', '20:55 deve permitir finalizar.');

  const invalidResult = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '21:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      value: input.value,
      valid: input.checkValidity(),
      message: input.validationMessage,
    };
  });
  assert.equal(invalidResult.value, '', '21:00 deve ser descartado do campo.');

  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', '21:00 não pode validar o formulário.');
  assert.equal(buttonState.pointerEvents, 'none', '21:00 não pode liberar a finalização.');

  await page.close();
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, checked: 'encomendas-retirada-horario' }));
