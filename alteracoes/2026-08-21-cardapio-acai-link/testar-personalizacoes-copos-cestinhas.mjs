import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const out = `${root}/alteracoes/2026-08-21-cardapio-acai-link/resultado-teste-personalizacoes-copos-cestinhas.json`;
const port = 9301;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-personalizacoes-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page'); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const request = pending.get(message.id); pending.delete(message.id); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const liberarHorario = () => evaluate(`window.ItapHorarioPedidos = { estaAberto: () => true, textoAviso: () => '', aviso: () => {} }`);
const openAndCustomize = async (sku, choiceIndexes) => {
  await evaluate(`document.querySelector('[data-catalog-sku="${sku}"] .add-btn')?.click()`); await wait(200);
  await evaluate(`document.querySelector('#flavor-distribution-list .qty button:last-child')?.click()`); await wait(160);
  const ui = await evaluate(`({ visible: !document.querySelector('#included-customizations')?.hidden, labels: [...document.querySelectorAll('#included-customizations label')].map((label) => label.innerText), text: document.querySelector('#included-customizations')?.innerText })`);
  for (const index of choiceIndexes) { await evaluate(`document.querySelectorAll('#included-customizations input')[${index}]?.click()`); await wait(80); }
  await evaluate(`document.querySelector('input[name="item-mode"][value="store"]')?.click()`); await wait(80);
  await evaluate(`document.querySelector('#confirm-flavors')?.click()`); await wait(200);
  const cart = await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`);
  return { ui, cart };
};
try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-personalizacoes=1' }); await wait(2800); await liberarHorario();
  const cup = await openAndCustomize('SVM-CR-01', [0, 2]);
  await evaluate(`localStorage.removeItem('itap_retirada_v1'); location.reload()`); await wait(2400); await liberarHorario();
  const basket = await openAndCustomize('SVM-CT-01', [1, 3]);
  const result = { cup, basket, whatsappOpened: false, orderSent: false };
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  for (const scenario of [cup, basket]) if (!scenario.ui.visible || !scenario.cart[0]?.includedExtras?.length || scenario.cart[0]?.price !== (scenario.cart[0]?.sku === 'SVM-CR-01' ? 10 : 14) || scenario.cart[0]?.boxAddOns?.length) throw new Error('Personalização incluída não foi registrada corretamente.');
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
