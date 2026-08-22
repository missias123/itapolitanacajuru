import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const resultFile = `${root}/alteracoes/2026-08-21-cardapio-acai-link/resultado-teste-milkshakes-sabores-ovomaltine.json`;
const port = 9298;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-milk-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de validação indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map();
socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const openProduct = async (sku) => { await evaluate(`document.querySelector('[data-catalog-sku="${sku}"] .add-btn')?.click()`); await wait(250); };
const liberarHorarioTeste = async () => { await evaluate(`window.ItapHorarioPedidos = { estaAberto: () => true, textoAviso: () => '', aviso: () => {} }`); };
const selectTwoFlavors = async () => { await evaluate(`document.querySelectorAll('#flavor-grid button')[0]?.click()`); await wait(120); await evaluate(`document.querySelectorAll('#flavor-grid button[aria-pressed="false"]')[0]?.click()`); await wait(120); };
const selectStoreAndConfirm = async (withOvomaltine) => { if (withOvomaltine) await evaluate(`document.querySelector('#milkshake-ovomaltine-input')?.click()`); await evaluate(`document.querySelector('input[name="item-mode"][value="store"]')?.click()`); await wait(100); await evaluate(`document.querySelector('#confirm-flavors')?.click()`); await wait(180); return await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`); };
try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-milkshakes=1' }); await wait(3000);
  await liberarHorarioTeste();
  await openProduct('MLK-TRD-300');
  const traditionalBefore = await evaluate(`({ flavorCount: document.querySelectorAll('#flavor-grid button').length, confirmBlocked: document.querySelector('#confirm-flavors')?.disabled, acaiAddonHidden: document.querySelector('#milkshake-ovomaltine')?.hidden })`);
  await selectTwoFlavors();
  const traditionalReady = await evaluate(`({ selected: document.querySelectorAll('#flavor-grid button[aria-pressed="true"]').length, addonVisible: !document.querySelector('#milkshake-ovomaltine')?.hidden, addonText: document.querySelector('#milkshake-ovomaltine')?.innerText })`);
  const traditionalCart = await selectStoreAndConfirm(true);
  await evaluate(`localStorage.removeItem('itap_retirada_v1'); location.reload()`); await wait(2500);
  await liberarHorarioTeste();
  await openProduct('MLK-TOP-360'); await selectTwoFlavors();
  const topCart = await selectStoreAndConfirm(true);
  await evaluate(`localStorage.removeItem('itap_retirada_v1'); location.reload()`); await wait(2500);
  await liberarHorarioTeste();
  await openProduct('ACA-MSK-001');
  const acaiDialogOpen = await evaluate(`document.querySelector('#flavor-dialog')?.open`);
  const acaiCart = await evaluate(`JSON.parse(localStorage.getItem('itap_retirada_v1') || '[]')`);
  const result = {
    traditionalBefore,
    traditionalReady,
    traditionalCart,
    topCart,
    acaiDialogOpen,
    acaiCart,
    whatsappOpened: false,
    orderSent: false
  };
  writeFileSync(resultFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
