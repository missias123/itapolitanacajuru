import { spawn } from 'node:child_process';

const mobile = process.argv.includes('--mobile');
const port = mobile ? 9347 : 9337;
const base = 'http://preview.manus.computer:4173/retirada.html#demo-retirada=aberta';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--host-resolver-rules=MAP preview.manus.computer 127.0.0.1', `--window-size=${mobile ? '375,812' : '1280,900'}`, `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-retorno-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page'); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador indisponível para o teste de retorno.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const callbacks = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !callbacks.has(message.id)) return; const pending = callbacks.get(message.id); callbacks.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result || {}); });
const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; callbacks.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
try {
  await call('Page.navigate', { url: base }); await wait(2600);
  if (!await evaluate(`window.ItapHorarioPedidos?.estaAberto('retirada')`)) throw new Error('A sessão de demonstração deveria liberar a retirada para o teste.');
  const result = await evaluate(`(() => {
    const section = document.querySelector('#sec-picoles'); if (!section) throw new Error('Seção Picolés não encontrada.');
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY + 150, behavior: 'instant' });
    const initial = window.scrollY;
    const button = section.querySelector('.add-btn'); if (!button) throw new Error('Botão de picolé não encontrado.');
    button.click();
    return { initial, dialog: document.querySelector('#popsicle-dialog')?.open };
  })()`);
  if (!result.dialog) throw new Error('O diálogo de picolé não abriu.');
  await wait(250);
  await evaluate(`document.querySelector('#popsicle-list button:not([disabled])')?.click()`); await wait(100);
  await evaluate(`document.querySelector('#confirm-popsicle-preferences')?.click()`); await wait(180);
  if (!await evaluate(`document.querySelector('#cart-dialog')?.open`)) throw new Error('O carrinho não abriu após adicionar o picolé.');
  await evaluate(`document.querySelector('#continue-shopping')?.click()`); await wait(1800);
  const final = await evaluate(`window.scrollY`);
  const delta = Math.abs(final - result.initial);
  if (delta > 36) throw new Error(`Retorno deslocado: início ${result.initial}px, fim ${final}px, diferença de ${delta}px.`);
  console.log(JSON.stringify({ ok: true, viewport: mobile ? '375x812' : '1280x900', initialScrollY: result.initial, finalScrollY: final, delta }, null, 2));
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
