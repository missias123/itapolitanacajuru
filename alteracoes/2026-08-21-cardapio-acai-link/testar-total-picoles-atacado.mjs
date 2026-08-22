import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const out = `${root}/alteracoes/2026-08-21-cardapio-acai-link/resultado-teste-total-picoles-atacado.json`;
const port = 9297;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-picole-total-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page'); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de validação indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const setTestSchedule = async () => evaluate(`window.ItapHorarioPedidos = { estaAberto: () => true, textoAviso: () => '', aviso: () => {} }`);
const openGroup = async (secondFlavor = false) => { await evaluate(`document.querySelector('[data-catalog-sku="PIC-AG-001"] .add-btn')?.click()`); await wait(160); await evaluate(`document.querySelectorAll('#popsicle-list button')[${secondFlavor ? 1 : 0}]?.click()`); await wait(120); };
const increaseTo = async (amount) => { for (let count = 1; count < amount; count += 1) { await evaluate(`document.querySelector('#popsicle-quantity .qty button:last-child')?.click()`); await wait(20); } };
try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-picoles-atacado=1' }); await wait(2600); await setTestSchedule();
  await openGroup(); await increaseTo(50);
  const beforeWholesale = await evaluate(`({ text: document.querySelector('.popsicle-quantity__total')?.textContent, confirm: document.querySelector('#confirm-popsicle-preferences')?.disabled })`);
  await evaluate(`document.querySelector('#confirm-popsicle-preferences')?.click()`); await wait(220);
  await openGroup(true); await increaseTo(50);
  const atWholesale = await evaluate(`({ text: document.querySelector('.popsicle-quantity__total')?.textContent, confirm: document.querySelector('#confirm-popsicle-preferences')?.disabled })`);
  await evaluate(`document.querySelector('#confirm-popsicle-preferences')?.click()`); await wait(220);
  const cart = await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`);
  const cartVisual = await evaluate(`document.querySelector('#cart-breakdown')?.innerText`);
  const result = { beforeWholesale, atWholesale, cart, cartVisual, whatsappOpened: false, orderSent: false };
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  if (!/atacado a partir de 100/.test(beforeWholesale.text || '') || /preço de atacado aplicado/.test(beforeWholesale.text || '')) throw new Error('Resumo de varejo inválido antes de 100 picolés.');
  if (!/Total de picolés: 100/.test(atWholesale.text || '') || !/preço de atacado aplicado/.test(atWholesale.text || '')) throw new Error('Resumo de atacado não foi aplicado ao atingir 100 picolés.');
  if (!/Picolés: 100 · atacado/.test(cartVisual || '') || !/R\$ 180,00/.test(cartVisual || '')) throw new Error('Carrinho não registrou o total de atacado esperado.');
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
