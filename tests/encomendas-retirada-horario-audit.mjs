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

  const optionsInfo = await page.$eval('#pedido-hora-retirada', (input) => {
    const values = Array.from(input.options).map((option) => option.value).filter(Boolean);
    return {
      first: values[0],
      last: values[values.length - 1],
      count: values.length,
      hasBelowMin: values.includes('10:55'),
      hasOffStep: values.includes('20:57'),
      hasAboveMax: values.includes('21:05'),
    };
  });
  assert.equal(optionsInfo.first, '11:00', 'A primeira opção de horário deve ser 11:00.');
  assert.equal(optionsInfo.last, '21:00', 'A última opção de horário deve ser 21:00.');
  assert.equal(optionsInfo.count, 121, 'A lista deve conter todos os horários de 5 em 5 minutos entre 11:00 e 21:00.');
  assert.equal(optionsInfo.hasBelowMin, false, 'A lista não pode incluir horários abaixo de 11:00.');
  assert.equal(optionsInfo.hasOffStep, false, 'A lista não pode incluir horários fora do intervalo de 5 minutos.');
  assert.equal(optionsInfo.hasAboveMax, false, 'A lista não pode incluir horários acima de 21:00.');

  await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '21:00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '1', '21:00 deve manter o formulário válido.');
  assert.notEqual(buttonState.pointerEvents, 'none', '21:00 deve permitir finalizar.');

  const invalidOptionResult = await page.$eval('#pedido-hora-retirada', (input) => {
    input.value = '21:05';
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
  assert.equal(invalidOptionResult.value, '', 'Horário fora da lista deve ser descartado do campo.');
  assert.equal(invalidOptionResult.valid, false, 'Com select obrigatório e bloqueado por opções, valor fora da lista deve manter o campo inválido.');
  assert.equal(invalidOptionResult.message, '', 'Sem valor fora da lista persistido, não deve haver mensagem de erro.');
  assert.equal(invalidOptionResult.ariaInvalid, null, 'Sem valor inválido persistido, aria-invalid deve permanecer limpo.');
  assert.equal(invalidOptionResult.errorHidden, true, 'Sem valor inválido persistido, o bloco de erro deve permanecer oculto.');
  assert.equal(invalidOptionResult.errorAriaHidden, 'true', 'Sem valor inválido persistido, o erro deve permanecer oculto para leitores de tela.');

  buttonState = await page.$eval('#btn-finalizar-pedido', (button) => ({
    opacity: button.style.opacity,
    pointerEvents: button.style.pointerEvents,
  }));
  assert.equal(buttonState.opacity, '0.5', 'Sem horário selecionado após valor inválido, o botão deve voltar a bloquear.');
  assert.equal(buttonState.pointerEvents, 'none', 'Sem horário selecionado após valor inválido, não pode liberar a finalização.');

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
