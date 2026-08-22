import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9291;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--host-resolver-rules=MAP preview.manus.computer 127.0.0.1', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-48h-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador de validação indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const call = pending.get(message.id); pending.delete(message.id); message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result?.value; };

try {
  await command('Page.navigate', { url: 'http://preview.manus.computer:4173/retirada.html#demo-retirada=aberta' }); await wait(3400);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1'); const retiradaAberta = window.ItapHorarioPedidos?.estaAberto?.('retirada') === true; let opened = ''; window.open = (url) => { opened = url; return null; }; const click = (selector, index = 0) => { const element = [...document.querySelectorAll(selector)][index]; if (!element) throw new Error('Elemento não encontrado: ' + selector); element.click(); };
    const triggerState = (sku) => { const button = document.querySelector('[data-catalog-sku="' + sku + '"] button'); return button ? { exists: true, label: button.textContent, disabled: button.disabled } : { exists: false }; };
    const consultTrigger = triggerState('CAX-5L_2S'); click('[data-catalog-sku="CAX-5L_2S"] button'); const consultDialogOpened = document.getElementById('flavor-dialog').open; click('input[name="cake-choice"][value="pronta_consulta"]'); const boxConsult = { url: opened, dialogClosed: !document.getElementById('flavor-dialog').open, cartCount: document.querySelectorAll('.cart-item').length };
    const orderTrigger = triggerState('CAX-10L_3S'); click('[data-catalog-sku="CAX-10L_3S"] button'); click('input[name="cake-choice"][value="producao_48h"]'); const orderDialogOpen = document.getElementById('flavor-dialog').open; [...document.querySelectorAll('#flavor-grid button:not(:disabled)')].slice(0, 3).forEach((chip) => chip.click()); click('#confirm-flavors'); const dateField = document.getElementById('pickup-date-field'); const minDate = document.getElementById('pickup-date').min; const result = { retiradaAberta, consultTrigger, orderTrigger, boxConsult: { dialogOpened: consultDialogOpened, opensWhatsApp: /wa\.me/.test(boxConsult.url) && /CAX-5L_2S/.test(decodeURIComponent(boxConsult.url)), dialogClosed: boxConsult.dialogClosed, cartEmpty: boxConsult.cartCount === 0 }, order: { dialogStayedOpen: orderDialogOpen, cartContainsBox: document.getElementById('cart-list').textContent.includes('CAX-10L_3S'), dateVisible: !dateField.hidden, minDate, whatsappOpened: false } }; const validDate = result.order.minDate.length === 10 && result.order.minDate[4] === '-' && result.order.minDate[7] === '-'; result.ok = result.retiradaAberta && result.consultTrigger.label === 'Escolher sabores' && result.orderTrigger.label === 'Escolher sabores' && result.boxConsult.dialogOpened && result.boxConsult.opensWhatsApp && result.boxConsult.dialogClosed && result.boxConsult.cartEmpty && result.order.dialogStayedOpen && result.order.cartContainsBox && result.order.dateVisible && validDate && !result.order.whatsappOpened; return result;
  })()`);
  writeFileSync(`${root}/resultado-teste-consulta-encomenda-48h.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) throw new Error('A jornada de consulta ou encomenda de caixa grande não cumpriu as regras esperadas.');
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
