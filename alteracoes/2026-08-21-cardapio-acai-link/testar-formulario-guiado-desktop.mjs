import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const baseUrl = 'https://itapolitanacajuru.com.br/retirada.html?teste-desktop=1#catalogo';
const port = 9262;
const width = 1280;
const height = 900;
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-desktop-form-${Date.now()}`, `--window-size=${width},${height}`, 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map();
socket.addEventListener('message', (event) => { const payload = JSON.parse(event.data); if (!payload.id || !pending.has(payload.id)) return; const current = pending.get(payload.id); pending.delete(payload.id); payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Falha no teste.'); return result.result?.value; };

try {
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: baseUrl });
  await wait(4200);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1');
    const card = document.querySelector('[data-catalog-sku="ACA-MSK-001"]'); card?.querySelector('button')?.click();
    const dialog = document.getElementById('cart-dialog'); if (!dialog.open) dialog.showModal();
    const form = document.getElementById('pickup-form'); form.scrollIntoView({ block: 'start' });
    const status = (label) => ({ label, locked: [...document.querySelectorAll('[data-form-step]')].map((step) => step.classList.contains('is-locked')), submitDisabled: document.getElementById('final-submit').disabled });
    const steps = [status('inicial')];
    const name = document.getElementById('client-name'); const phone = document.getElementById('client-phone'); name.value = 'Teste Computador'; name.dispatchEvent(new Event('input', { bubbles: true })); phone.value = '999991234'; phone.dispatchEvent(new Event('input', { bubbles: true }));
    const time = document.getElementById('pickup-time'); time.disabled = false; time.value = time.min; time.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('confirm-payment').click(); document.getElementById('continue-notes').click(); document.getElementById('accept-rules').checked = true; document.getElementById('accept-rules').dispatchEvent(new Event('change', { bubbles: true })); steps.push(status('final'));
    const originalOpen = window.open; const originalOpenState = window.ItapHorarioPedidos?.estaAberto; let capturedUrl = '';
    window.open = (url) => { capturedUrl = String(url); return null; }; if (window.ItapHorarioPedidos) window.ItapHorarioPedidos.estaAberto = () => true;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    if (window.ItapHorarioPedidos && originalOpenState) window.ItapHorarioPedidos.estaAberto = originalOpenState; window.open = originalOpen;
    const message = decodeURIComponent((capturedUrl.split('text=')[1] || '').replace(/\\\\+/g, ' '));
    document.querySelector('[data-form-step="5"]')?.scrollIntoView({ block: 'center' });
    return { viewport: String(innerWidth) + 'x' + String(innerHeight), productAdded: Boolean(document.querySelector('#cart-list .cart-item')), steps, submitReady: !document.getElementById('final-submit').disabled, phonePrefix: document.querySelector('.phone-fixed__prefix')?.textContent.trim(), requestIntercepted: Boolean(capturedUrl), paymentPresential: message.includes('Pagamento presencial na loja'), whatsappOpened: false };
  })()`);
  await wait(500);
  const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/demonstracao-desktop-formulario-guiado-ddd16.png`, Buffer.from(image.data, 'base64'));
  writeFileSync(`${root}/resultado-teste-formulario-guiado-desktop.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
