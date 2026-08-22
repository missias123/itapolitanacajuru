import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9271;
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-preferencias-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl); if (target) break; } catch { /* aguarda o navegador */ } await wait(200); }
if (!target) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let requestId = 0; const waiting = new Map();
socket.addEventListener('message', (event) => { const data = JSON.parse(event.data); if (!data.id || !waiting.has(data.id)) return; const current = waiting.get(data.id); waiting.delete(data.id); data.error ? current.reject(new Error(data.error.message)) : current.resolve(data.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++requestId; waiting.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => { const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text); return response.result?.value; };

try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-preferencias=1#catalogo' });
  await wait(3500);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1');
    const click = (selector, index = 0) => { const element = [...document.querySelectorAll(selector)][index]; if (!element) throw new Error('Elemento não encontrado: ' + selector); element.click(); };
    const chooseMass = (sku, quantity) => {
      click('[data-catalog-sku="' + sku + '"] button'); if (!document.getElementById('cake-choice').hidden) click('input[name="cake-choice"][value="producao_48h"]'); if (!document.getElementById('item-container').hidden) click('[data-container-choice="copo"]');
      const before = document.getElementById('confirm-flavors').disabled;
      for (let option = 0; option < 3; option += 1) { if (option) click('#flavor-preferences-tabs button', option); const chips = [...document.querySelectorAll('#flavor-grid button:not(:disabled)')]; chips.slice(0, quantity).forEach((chip) => chip.click()); }
      if (!document.getElementById('item-mode').hidden) click('[data-mode-choice="store"]'); const after = document.getElementById('confirm-flavors').disabled; click('#confirm-flavors');
      return { before, after, cart: document.getElementById('cart-list').textContent };
    };
    const mass = chooseMass('SVM-CC-03', 3);
    click('#continue-shopping');
    const box = chooseMass('CAX-5L_2S', 2); click('#continue-shopping'); const boxTen = chooseMass('CAX-10L_3S', 3); click('#continue-shopping');
    click('[data-catalog-sku="PIC-009"] button');
    const popBefore = document.getElementById('confirm-popsicle-preferences').disabled;
    for (let option = 0; option < 3; option += 1) { if (option) click('#popsicle-preferences-tabs button', option); click('#popsicle-list button:not(:disabled)'); }
    const popAfter = document.getElementById('confirm-popsicle-preferences').disabled; click('#confirm-popsicle-preferences');
    click('#continue-shopping');
    click('[data-catalog-sku="PIC-025"] button');
    const special = { tabsHidden: document.getElementById('popsicle-preferences').hidden, before: document.getElementById('confirm-popsicle-preferences').disabled };
    click('#popsicle-list button:not(:disabled)'); special.after = document.getElementById('confirm-popsicle-preferences').disabled; click('[data-close="popsicle-dialog"]');
    const brasilia = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])); const future = Math.min(20 * 60, Number(brasilia.hour) * 60 + Number(brasilia.minute) + 120); const time = String(Math.floor(future / 60)).padStart(2, '0') + ':' + String(future % 60).padStart(2, '0'); let sentUrl = ''; window.ItapHorarioPedidos = { estaAberto: () => true, aviso: () => {}, textoAviso: () => '' }; window.open = (url) => { sentUrl = url; return null; }; const input = (selector, value) => { const field = document.querySelector(selector); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); }; input('#client-name', 'Teste Preferências'); input('#client-phone', '999999999'); if (!document.getElementById('pickup-date-field').hidden) input('#pickup-date', document.getElementById('pickup-date').min); input('#pickup-time', time); click('#confirm-payment'); click('#continue-notes'); const accept = document.getElementById('accept-rules'); accept.checked = true; accept.dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('pickup-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); const message = sentUrl ? decodeURIComponent(sentUrl.split('?text=')[1] || '') : '';
    return { mass, box, boxTen, popBefore, popAfter, special, cartText: document.getElementById('cart-list').textContent, messageHasMassOptions: /Opção 1: Abacaxi ao Vinho, Abacaxi Suíço, Amarena/.test(message) && /Opção 3: Bis e Trufa, Blue Ice, Cereja Trufada/.test(message), messageHasBoxSku: /CAX-5L_2S/.test(message) && /EMB-5L/.test(message) && /CAX-10L_3S/.test(message) && /EMB-10L/.test(message) && /incluída no valor/.test(message), messageHasPopsicleOptions: /Opção 1: Açaí/.test(message) && /Opção 3: Caraxi/.test(message), whatsappOpened: false, orderSent: false };
  })()`);
  await evaluate(`(() => { const dialog = document.getElementById('cart-dialog'); if (!dialog.open) dialog.showModal(); })()`); await wait(300);
  const screenshot = await command('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${root}/resultado-teste-preferencias-sabores.json`, `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(`${root}/demonstracao-desktop-preferencias-sabores.png`, Buffer.from(screenshot.data, 'base64'));
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
