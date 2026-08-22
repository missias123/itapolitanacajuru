import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9294;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-direct-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const call = pending.get(message.id); pending.delete(message.id); message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;

try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-sabores-diretos=1' }); await wait(3300);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1'); const click = (selector, index = 0) => { const element = [...document.querySelectorAll(selector)][index]; if (!element) throw new Error('Elemento não encontrado: ' + selector); element.click(); };
    click('[data-catalog-sku="SVM-CC-03"] button'); click('[data-container-choice="copo"]'); const massTabsHidden = document.getElementById('flavor-preferences').hidden; const buttons = [...document.querySelectorAll('#flavor-distribution-list .qty button')].filter((button) => button.textContent === '+'); buttons.slice(0, 3).forEach((button) => button.click()); click('[data-mode-choice="store"]'); const massEnabled = !document.getElementById('confirm-flavors').disabled; click('#confirm-flavors'); const massCart = document.getElementById('cart-list').textContent;
    const firstPopsicle = document.querySelector('[data-catalog-sku^="PIC-"] button'); firstPopsicle.click(); const popsicleTabsHidden = document.getElementById('popsicle-preferences').hidden; click('#popsicle-list button:not(:disabled)'); const popsicleEnabled = !document.getElementById('confirm-popsicle-preferences').disabled; click('#confirm-popsicle-preferences'); const cartText = document.getElementById('cart-list').textContent; const noteHelp = document.querySelector('.form-block--notes .field__help')?.textContent || ''; return { massTabsHidden, massEnabled, massHasNoOptions: !/Opção\s*[123]/.test(massCart), popsicleTabsHidden, popsicleEnabled, cartHasNoOptions: !/Opção\s*[123]/.test(cartText), notesMentionsUnavailableFlavor: /não estiver na lista/i.test(noteHelp), whatsappOpened: false };
  })()`);
  writeFileSync(`${root}/resultado-teste-reversao-sabores-diretos.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
