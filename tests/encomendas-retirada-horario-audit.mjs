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
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH;
const browser = await puppeteer.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
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

  let buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Sem preencher os campos obrigatórios, o botão deve iniciar bloqueado.');
  assert.equal(buttonState.pointerEvents, 'none', 'Sem preencher os campos obrigatórios, o botão não pode liberar a finalização.');

  await page.type('#pedido-nome', 'Teste Encomenda');
  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Só o nome preenchido não deve liberar a finalização.');

  await page.click('#pedido-retirada');
  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Sem WhatsApp válido, o botão deve continuar bloqueado.');

  await page.type('#pedido-whatsapp', '(16) 99999-9999');
  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Sem a ciência e o agendamento, o botão deve continuar bloqueado.');

  await page.click('#pedido-ciencia');

  const dataMinima = await page.$eval('#pedido-data-retirada', (input) => input.min);
  assert.match(dataMinima, /^\d{4}-\d{2}-\d{2}$/);
  await page.$eval('#pedido-data-retirada', (input, value) => {
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataMinima);

  const instruction = await page.$eval('#pedido-agendamento-instrucao', (node) => node.textContent.trim());
  assert.match(instruction, /5 dias corridos/i, 'A instrução precisa destacar o prazo de 5 dias corridos.');

  const range = await page.$eval('#pedido-hora-retirada', (input) => ({ min: input.min, max: input.max, step: input.step }));
  assert.deepEqual(range, { min: '11:00', max: '20:55', step: '300' });

  await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '20:55';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '1', '20:55 deve manter o formulário válido.');
  assert.notEqual(buttonState.pointerEvents, 'none', '20:55 deve permitir finalizar.');

  const belowMinimumResult = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '10:55';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      value: input.value,
      valid: input.checkValidity(),
      message: document.getElementById('pedido-agendamento-erro')?.textContent?.trim() || '',
      ariaInvalid: input.getAttribute('aria-invalid'),
      errorHidden: document.getElementById('pedido-agendamento-erro')?.hidden,
      errorAriaHidden: document.getElementById('pedido-agendamento-erro')?.getAttribute('aria-hidden'),
    };
  });
  assert.equal(belowMinimumResult.value, '', '10:55 deve ser descartado do campo.');
  assert.equal(belowMinimumResult.valid, false, '10:55 deve manter o campo inválido até o usuário corrigir.');
  assert.match(belowMinimumResult.message, /11h e 20:55.*5 minutos/i, '10:55 deve exibir a orientação correta.');
  assert.equal(belowMinimumResult.ariaInvalid, 'true', '10:55 deve marcar aria-invalid.');
  assert.equal(belowMinimumResult.errorHidden, false, '10:55 deve exibir o bloco de erro.');
  assert.equal(belowMinimumResult.errorAriaHidden, 'false', '10:55 deve anunciar o erro.');

  const stepMismatchResult = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '20:57';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      value: input.value,
      valid: input.checkValidity(),
      message: document.getElementById('pedido-agendamento-erro')?.textContent?.trim() || '',
      ariaInvalid: input.getAttribute('aria-invalid'),
      errorHidden: document.getElementById('pedido-agendamento-erro')?.hidden,
      errorAriaHidden: document.getElementById('pedido-agendamento-erro')?.getAttribute('aria-hidden'),
    };
  });
  assert.equal(stepMismatchResult.value, '', '20:57 deve ser descartado do campo.');
  assert.equal(stepMismatchResult.valid, false, '20:57 deve manter o campo inválido até o usuário corrigir.');
  assert.match(stepMismatchResult.message, /11h e 20:55.*5 minutos/i, '20:57 deve exibir a orientação correta.');
  assert.equal(stepMismatchResult.ariaInvalid, 'true', '20:57 deve marcar aria-invalid.');
  assert.equal(stepMismatchResult.errorHidden, false, '20:57 deve exibir o bloco de erro.');
  assert.equal(stepMismatchResult.errorAriaHidden, 'false', '20:57 deve anunciar o erro.');

  const invalidResult = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '21:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      value: input.value,
      valid: input.checkValidity(),
      message: document.getElementById('pedido-agendamento-erro')?.textContent?.trim() || '',
      ariaInvalid: input.getAttribute('aria-invalid'),
      errorHidden: document.getElementById('pedido-agendamento-erro')?.hidden,
      errorAriaHidden: document.getElementById('pedido-agendamento-erro')?.getAttribute('aria-hidden'),
    };
  });
  assert.equal(invalidResult.value, '', '21:00 deve ser descartado do campo.');
  assert.equal(invalidResult.valid, false, '21:00 deve manter o campo inválido até o usuário corrigir.');
  assert.match(invalidResult.message, /11h e 20:55.*5 minutos/i, '21:00 deve exibir a orientação correta.');
  assert.equal(invalidResult.ariaInvalid, 'true', '21:00 deve marcar aria-invalid.');
  assert.equal(invalidResult.errorHidden, false, '21:00 deve exibir o bloco de erro.');
  assert.equal(invalidResult.errorAriaHidden, 'false', '21:00 deve anunciar o erro.');

  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', '21:00 não pode validar o formulário.');
  assert.equal(buttonState.pointerEvents, 'none', '21:00 não pode liberar a finalização.');

  const clearedOnValidInput = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '11:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      valid: input.checkValidity(),
      message: document.getElementById('pedido-agendamento-erro')?.textContent?.trim() || '',
      ariaInvalid: input.getAttribute('aria-invalid'),
      errorHidden: document.getElementById('pedido-agendamento-erro')?.hidden,
      errorAriaHidden: document.getElementById('pedido-agendamento-erro')?.getAttribute('aria-hidden'),
    };
  });
  assert.equal(clearedOnValidInput.valid, true, 'Um horário válido deve normalizar o campo.');
  assert.equal(clearedOnValidInput.message, '', 'Um horário válido deve limpar o aviso visual anterior.');
  assert.equal(clearedOnValidInput.ariaInvalid, null, 'Um horário válido deve remover aria-invalid.');
  assert.equal(clearedOnValidInput.errorHidden, true, 'Um horário válido deve ocultar o bloco de erro.');
  assert.equal(clearedOnValidInput.errorAriaHidden, 'true', 'Um horário válido deve esconder o erro para leitores de tela.');

  await page.$eval('#pedido-whatsapp', (input) => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Se o WhatsApp ficar inválido novamente, o botão deve voltar a bloquear.');

  await page.close();
} finally {
  await browser.close();
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ pass: true, checked: 'encomendas-retirada-horario' }));
