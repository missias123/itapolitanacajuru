import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9271;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--host-resolver-rules=MAP preview.manus.computer 127.0.0.1', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-sabores-diretos-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const callback = pending.get(message.id); pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text); return response.result?.value; };

try {
  await command('Page.navigate', { url: 'http://preview.manus.computer:4173/retirada.html#demo-retirada=aberta' }); await wait(3500);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1'); const click = (selector, index = 0) => { const element = [...document.querySelectorAll(selector)][index]; if (!element) throw new Error('Elemento não encontrado: ' + selector); element.click(); };
    const chooseDirect = (sku, quantity, cake = false) => { click('[data-catalog-sku="' + sku + '"] button'); if (cake) click('input[name="cake-choice"][value="producao_48h"]'); if (!document.getElementById('item-container').hidden) click('[data-container-choice="copo"]'); const before = document.getElementById('confirm-flavors').disabled; if (!document.getElementById('flavor-distribution').hidden) { for (let index = 0; index < quantity; index += 1) click('#flavor-distribution-list button[aria-label^="Adicionar uma bola"]'); } else { for (let index = 0; index < quantity; index += 1) click('#flavor-grid button:not(:disabled):not([aria-pressed="true"])'); } if (!document.getElementById('item-mode').hidden) click('[data-mode-choice="store"]'); const after = document.getElementById('confirm-flavors').disabled; click('#confirm-flavors'); const cart = document.getElementById('cart-list').textContent; click('#continue-shopping'); return { before, after, cartHasSku: cart.includes(sku) }; };
    const mass = chooseDirect('SVM-CR-03', 3); const box5L = chooseDirect('CAX-5L_2S', 2, true); const box10L = chooseDirect('CAX-10L_3S', 3, true);
    click('[data-catalog-sku="PIC-ESP-001"] button'); const specialBefore = document.getElementById('confirm-popsicle-preferences').disabled; click('#popsicle-list button:not(:disabled)'); const specialAfter = document.getElementById('confirm-popsicle-preferences').disabled; click('#confirm-popsicle-preferences'); const picoleCart = document.getElementById('cart-list').textContent; const result = { retiradaAberta: window.ItapHorarioPedidos?.estaAberto('retirada') === true, mass, box5L, box10L, special: { preferencesHidden: document.getElementById('popsicle-preferences').hidden, before: specialBefore, after: specialAfter, cartHasSku: picoleCart.includes('PIC-ESP-001') }, whatsappOpened: false, orderSent: false }; result.ok = result.retiradaAberta && result.mass.before && !result.mass.after && result.mass.cartHasSku && result.box5L.before && !result.box5L.after && result.box5L.cartHasSku && result.box10L.before && !result.box10L.after && result.box10L.cartHasSku && result.special.preferencesHidden && result.special.before && !result.special.after && result.special.cartHasSku && !result.whatsappOpened && !result.orderSent; return result;
  })()`);
  writeFileSync(`${root}/resultado-teste-preferencias-sabores.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) throw new Error('A seleção direta de sabores não cumpriu as regras do catálogo.');
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
