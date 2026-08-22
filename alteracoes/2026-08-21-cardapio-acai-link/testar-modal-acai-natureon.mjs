import { spawn } from 'node:child_process';

const port = 9348;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=375,812', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-acai-modal-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page'); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador indisponível para testar o cardápio de Açaí.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const callback = pending.get(message.id); pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result || {}); });
const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
try {
  await call('Page.navigate', { url: 'http://127.0.0.1:4173/index.html' }); await wait(3000);
  const opened = await evaluate(`(() => { const trigger = document.querySelector('[data-acai-modal-trigger]'); if (!trigger) throw new Error('Gatilho do cardápio Açaí não encontrado.'); window.scrollTo({ top: trigger.getBoundingClientRect().top + window.scrollY - 140, behavior: 'instant' }); const initial = window.scrollY; trigger.focus({ preventScroll: true }); trigger.click(); const dialog = document.getElementById('catalogo-acai-natureon'); return { initial, open: dialog?.open === true, pages: dialog?.querySelectorAll('.catalogo-acai-pagina').length || 0, focusedClose: document.activeElement?.id === 'fechar-catalogo-acai' }; })()`);
  if (!opened.open || opened.pages !== 12 || !opened.focusedClose) throw new Error('Abertura do cardápio Açaí não respeitou o fluxo esperado.');
  await evaluate(`document.getElementById('fechar-catalogo-acai').click()`); await wait(200);
  const closed = await evaluate(`({ open: document.getElementById('catalogo-acai-natureon')?.open === true, focusedTrigger: document.activeElement?.matches('[data-acai-modal-trigger]') === true, scrollY: window.scrollY })`);
  const delta = Math.abs(closed.scrollY - opened.initial);
  const result = { ok: !closed.open && closed.focusedTrigger && delta <= 36, viewport: '375x812', initialScrollY: opened.initial, finalScrollY: closed.scrollY, delta, pagesRendered: opened.pages, focusReturned: closed.focusedTrigger };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) throw new Error('Fechamento do cardápio Açaí perdeu foco ou posição.');
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
