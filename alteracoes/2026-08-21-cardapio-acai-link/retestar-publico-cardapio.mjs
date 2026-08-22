import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const out = `${root}/alteracoes/2026-08-21-cardapio-acai-link/resultado-reteste-publico-cardapio.json`;
const port = 9304;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-reteste-publico-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page'); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de reteste indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const request = pending.get(message.id); pending.delete(message.id); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
try {
  await command('Page.navigate', { url: 'https://itapolitanacajuru.com.br/retirada.html?v=20260822-cardapio-milkshake-atacado-personalizacoes&reteste=1' }); await wait(4500);
  await evaluate(`window.ItapHorarioPedidos = { estaAberto: () => true, textoAviso: () => '', aviso: () => {} }; window.open = () => { throw new Error('WhatsApp bloqueado no reteste'); }`);
  const scriptVersion = await evaluate(`document.querySelector('script[src*="scripts/retirada.js"]')?.src || ''`);
  await evaluate(`document.querySelector('[data-catalog-sku="MLK-TRD-300"] .add-btn')?.click()`); await wait(180);
  const milkshakeBefore = await evaluate(`({ flavors: document.querySelectorAll('#flavor-grid button').length, confirmBlocked: document.querySelector('#confirm-flavors')?.disabled })`);
  await evaluate(`document.querySelectorAll('#flavor-grid button')[0]?.click(); document.querySelectorAll('#flavor-grid button[aria-pressed="false"]')[0]?.click()`); await wait(140);
  const milkshakeReady = await evaluate(`({ addonVisible: !document.querySelector('#milkshake-ovomaltine')?.hidden, confirmBlocked: document.querySelector('#confirm-flavors')?.disabled })`);
  await evaluate(`document.querySelector('#milkshake-ovomaltine-input')?.click(); document.querySelector('input[name="item-mode"][value="store"]')?.click()`); await wait(120); await evaluate(`document.querySelector('#confirm-flavors')?.click()`); await wait(250);
  const milkshakeCart = await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`);
  await evaluate(`localStorage.removeItem('itap_retirada_v1'); location.reload()`); await wait(3200); await evaluate(`window.ItapHorarioPedidos = { estaAberto: () => true, textoAviso: () => '', aviso: () => {} }; window.open = () => { throw new Error('WhatsApp bloqueado no reteste'); }`);
  await evaluate(`document.querySelector('[data-catalog-sku="SVM-CR-01"] .add-btn')?.click()`); await wait(150); await evaluate(`document.querySelector('#flavor-distribution-list .qty button:last-child')?.click()`); await wait(130); await evaluate(`document.querySelector('#included-customizations input')?.click(); document.querySelector('input[name="item-mode"][value="store"]')?.click()`); await wait(120); await evaluate(`document.querySelector('#confirm-flavors')?.click()`); await wait(220);
  const cupCart = await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`);
  const result = { scriptVersion, milkshakeBefore, milkshakeReady, milkshakeCart, cupCart, whatsappOpened: false, orderSent: false };
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  if (!scriptVersion.includes('20260822-cardapio-milkshake-atacado-personalizacoes') || milkshakeBefore.flavors !== 38 || !milkshakeReady.addonVisible || !milkshakeCart[0]?.boxAddOns?.some((item) => item.name === 'Ovomaltine') || !cupCart[0]?.includedExtras?.includes('Cobertura de morango')) throw new Error(`Fluxo público não validou os recursos publicados: ${JSON.stringify(result)}`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
