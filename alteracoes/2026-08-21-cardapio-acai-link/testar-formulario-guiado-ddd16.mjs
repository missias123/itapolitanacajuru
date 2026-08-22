import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9261;
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-form-guided-${Date.now()}`, '--window-size=390,844', 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* espera */ } await wait(200); }
if (!page) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map();
socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !pending.has(response.id)) return; const call = pending.get(response.id); pending.delete(response.id); response.error ? call.reject(new Error(response.error.message)) : call.resolve(response.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Falha de avaliação.'); return result.result?.value; };
const screenshot = async (name) => { const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(`${root}/${name}`, Buffer.from(image.data, 'base64')); };

try {
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-formulario-guiado=1#catalogo' });
  await wait(3600);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1');
    const product = document.querySelector('[data-catalog-sku="ACA-MSK-001"]'); product?.querySelector('button')?.click();
    const dialog = document.getElementById('cart-dialog'); if (!dialog.open) dialog.showModal();
    document.getElementById('pickup-form').scrollIntoView({ block: 'start' });
    const state = (label) => ({ label, locked: [...document.querySelectorAll('[data-form-step]')].map((el) => ({ step: el.dataset.formStep, locked: el.classList.contains('is-locked'), complete: el.classList.contains('is-complete') })), submitDisabled: document.getElementById('final-submit').disabled, submitText: document.getElementById('final-submit').textContent.trim(), phone: document.getElementById('client-phone').value });
    const states = [state('inicial')];
    const name = document.getElementById('client-name'); const phone = document.getElementById('client-phone'); name.value = 'Teste Itapolitana'; name.dispatchEvent(new Event('input', { bubbles: true })); phone.value = '999991234'; phone.dispatchEvent(new Event('input', { bubbles: true })); states.push(state('identificacao'));
    const time = document.getElementById('pickup-time'); time.disabled = false; time.value = time.min; time.dispatchEvent(new Event('input', { bubbles: true })); states.push(state('retirada'));
    document.getElementById('confirm-payment').click(); states.push(state('pagamento'));
    document.getElementById('continue-notes').click(); states.push(state('observacoes'));
    document.getElementById('accept-rules').checked = true; document.getElementById('accept-rules').dispatchEvent(new Event('change', { bubbles: true })); states.push(state('aceite'));
    const originalOpen = window.open; const originalOpenState = window.ItapHorarioPedidos?.estaAberto; let requestUrl = '';
    window.open = (url) => { requestUrl = String(url); return null; };
    if (window.ItapHorarioPedidos) window.ItapHorarioPedidos.estaAberto = () => true;
    document.getElementById('pickup-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    if (window.ItapHorarioPedidos && originalOpenState) window.ItapHorarioPedidos.estaAberto = originalOpenState;
    window.open = originalOpen;
    const message = decodeURIComponent((requestUrl.split('text=')[1] || '').replace(/\\+/g, ' '));
    return { states, message: { intercepted: Boolean(requestUrl), containsDdd16: message.includes('(16) 99999-1234'), containsPresential: message.includes('Pagamento presencial na loja'), containsAcceptance: message.includes('Cliente marcou o aceite'), containsPix: /\\bPix\\b/i.test(message), containsCnpj: /08\\.922\\.044\\/0001-80/.test(message) }, whatsappAberto: false, pagamentoEfetuado: false };
  })()`);
  await evaluate(`document.querySelector('[data-form-step="5"]')?.scrollIntoView({ block: 'center' })`);
  await wait(400);
  await screenshot('demonstracao-mobile-formulario-guiado-ddd16.png');
  writeFileSync(`${root}/resultado-teste-formulario-guiado-ddd16.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
