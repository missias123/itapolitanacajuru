import { spawn } from 'node:child_process';

const port = 9338;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=1280,900', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-encomendas-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page'); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador indisponível para testar Encomendas.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const callback = pending.get(message.id); pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result || {}); });
const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
try {
  await call('Page.navigate', { url: 'http://127.0.0.1:4173/encomendas.html' }); await wait(2600);
  await evaluate(`(() => { const open = (id) => { const content = document.getElementById(id); if (!content) throw new Error('Seção não encontrada: ' + id); if (content.style.display !== 'block') content.previousElementSibling?.click(); }; open('sec-caixas'); open('sec-picoles'); })()`); await wait(220);
  const initial = await evaluate(`(() => { const trigger = document.querySelector('.btn-sabores--picoles'); document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo({ top: trigger.getBoundingClientRect().top + window.scrollY - 180, behavior: 'instant' }); const y = window.scrollY; trigger.click(); return { y, modalOpen: document.querySelector('#modal-picoles')?.style.display === 'flex' }; })()`);
  if (!initial.modalOpen) throw new Error('Modal de picolés de Encomendas não abriu.');
  await wait(200);
  await evaluate(`window.fecharModal('modal-picoles')`); await wait(300);
  const finalY = await evaluate(`window.scrollY`); const delta = Math.abs(finalY - initial.y);
  console.log(JSON.stringify({ ok: delta <= 36, initialScrollY: initial.y, finalScrollY: finalY, delta }, null, 2));
  if (delta > 36) throw new Error(`Encomendas perdeu posição: início ${initial.y}px, fim ${finalY}px.`);
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
