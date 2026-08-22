import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9236;
const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-horario-${Date.now()}`,
  '--window-size=390,844', 'about:blank'
], { detached: true, stdio: 'ignore' });
chrome.unref();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let attempt = 0; attempt < 35; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* Aguarda o navegador. */ }
    await wait(200);
  }
  throw new Error('Navegador de teste indisponível.');
}

const page = await target();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0;
const waiting = new Map();
socket.addEventListener('message', (event) => { const payload = JSON.parse(event.data); if (!payload.id || !waiting.has(payload.id)) return; const current = waiting.get(payload.id); waiting.delete(payload.id); payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {}); });
function command(method, params = {}) { const requestId = ++id; return new Promise((resolve, reject) => { waiting.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); }); }
async function evaluate(expression) { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Falha na avaliação do navegador.'); return result; }
async function screenshot(name) { const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(`${root}/${name}`, Buffer.from(image.data, 'base64')); }

try {
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl.replace(/\/$/, '')}/retirada.html?teste-horario=1#catalogo` });
  await wait(3800);
  await evaluate(`localStorage.removeItem('itap_retirada_v1'); location.reload()`);
  await wait(3000);
  await evaluate(`(() => { const product = document.querySelector('[data-catalog-sku="ACA-MSK-001"]'); product?.querySelector('button')?.click(); const dialog = document.getElementById('cart-dialog'); if (!dialog.open) dialog.showModal(); document.getElementById('pickup-form')?.scrollIntoView({ block: 'start' }); })()`);
  await wait(500);
  const invalid = await evaluate(`(() => { const time = document.getElementById('pickup-time'); time.disabled = false; time.value = '11:00'; time.dispatchEvent(new Event('input', { bubbles: true })); return { value: time.value, min: time.min, invalid: time.getAttribute('aria-invalid'), message: document.getElementById('pickup-time-error')?.textContent?.trim(), visible: document.getElementById('pickup-time-error')?.classList.contains('is-visible') }; })()`);
  await screenshot('demonstracao-mobile-horario-brasilia-invalido.png');
  const valid = await evaluate(`(() => { const time = document.getElementById('pickup-time'); time.value = time.min; time.dispatchEvent(new Event('input', { bubbles: true })); return { value: time.value, min: time.min, invalid: time.getAttribute('aria-invalid'), messageVisible: document.getElementById('pickup-time-error')?.classList.contains('is-visible'), payment: document.querySelector('[name="pagamento"]')?.value, pixVisible: /\\bPix\\b/i.test(document.getElementById('pickup-form')?.textContent || ''), cnpjVisible: /08\\.922\\.044\\/0001-80/.test(document.getElementById('pickup-form')?.textContent || '') }; })()`);
  const message = await evaluate(`(() => { const originalOpen = window.open; let captured = ''; window.open = (url) => { captured = String(url); return null; }; const form = document.getElementById('pickup-form'); document.getElementById('client-name').value = 'Teste Itapolitana'; document.getElementById('client-phone').value = '(16) 99999-9999'; document.getElementById('accept-rules').checked = true; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); window.open = originalOpen; const text = decodeURIComponent((captured.split('text=')[1] || '').replace(/\\+/g, ' ')); return { opened: Boolean(captured), containsPriority: text.includes('RESUMO PRIORITÁRIO'), containsAcceptance: text.includes('Cliente marcou o aceite'), containsCnpj: /08\\.922\\.044\\/0001-80/.test(text), containsPix: /\\bPix\\b/i.test(text), containsPresential: text.includes('Pagamento presencial na loja') }; })()`);
  await evaluate(`document.querySelector('.form-block--confirmation')?.scrollIntoView({ block: 'center' })`);
  await wait(350);
  await screenshot('demonstracao-mobile-confirmacao-simplificada.png');
  const result = { invalid: invalid.result?.value || null, valid: valid.result?.value || null, message: message.result?.value || null, whatsappRealAberto: false, pagamentoRealEfetuado: false };
  writeFileSync(`${root}/resultado-teste-horario-pagamento-presencial.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  socket.close();
  process.kill(-chrome.pid, 'SIGTERM');
}
