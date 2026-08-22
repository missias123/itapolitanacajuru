import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9291;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-48h-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador de validação indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const call = pending.get(message.id); pending.delete(message.id); message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result?.value; };

try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-48h=1' }); await wait(3400);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1'); let opened = ''; window.open = (url) => { opened = url; return null; }; const click = (selector, index = 0) => { const element = [...document.querySelectorAll(selector)][index]; if (!element) throw new Error('Elemento não encontrado: ' + selector); element.click(); };
    click('[data-catalog-sku="SOB-001"] button'); click('input[name="cake-choice"][value="pronta_consulta"]'); const cakeConsult = { url: opened, dialogClosed: !document.getElementById('flavor-dialog').open, cartCount: document.querySelectorAll('.cart-item').length };
    opened = ''; click('[data-catalog-sku="CAX-5L_2S"] button'); click('input[name="cake-choice"][value="pronta_consulta"]'); const boxConsult = { url: opened, dialogClosed: !document.getElementById('flavor-dialog').open, cartCount: document.querySelectorAll('.cart-item').length };
    click('[data-catalog-sku="CAX-10L_3S"] button'); click('input[name="cake-choice"][value="producao_48h"]'); const orderDialogOpen = document.getElementById('flavor-dialog').open; for (let option = 0; option < 3; option += 1) { if (option) click('#flavor-preferences-tabs button', option); [...document.querySelectorAll('#flavor-grid button:not(:disabled)')].slice(0, 3).forEach((chip) => chip.click()); } click('#confirm-flavors'); const dateField = document.getElementById('pickup-date-field'); const minDate = document.getElementById('pickup-date').min; return { cakeConsult: { opensWhatsApp: /wa\.me/.test(cakeConsult.url) && /SOB-001/.test(decodeURIComponent(cakeConsult.url)), dialogClosed: cakeConsult.dialogClosed, cartEmpty: cakeConsult.cartCount === 0 }, boxConsult: { opensWhatsApp: /wa\.me/.test(boxConsult.url) && /CAX-5L_2S/.test(decodeURIComponent(boxConsult.url)), dialogClosed: boxConsult.dialogClosed, cartEmpty: boxConsult.cartCount === 0 }, order: { dialogStayedOpen: orderDialogOpen, cartContainsBox: document.getElementById('cart-list').textContent.includes('CAX-10L_3S'), dateVisible: !dateField.hidden, minDate, whatsappOpened: false } };
  })()`);
  writeFileSync(`${root}/resultado-teste-consulta-encomenda-48h.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
