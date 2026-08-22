import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const base = 'https://itapolitanacajuru.com.br';
const pages = ['index.html', 'retirada.html', 'encomendas.html', 'cardapio-acai-natureon.html', 'sobre.html', 'dicas.html', 'promocao.html', 'politica-privacidade.html', '404.html', 'offline.html', 'carrossel.html', 'admin-catalogo.html', 'admin-painel.html'];
const root = '/home/ubuntu/itapolitanacajuru-source';
const output = `${root}/alteracoes/2026-08-21-cardapio-acai-link/inventario-botoes-site.json`;
const port = 9312;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-inventario-${Date.now()}`, 'about:blank'], { detached: true, stdio: 'ignore' });
browser.unref();
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = list.find((item) => item.type === 'page'); if (page) break; } catch { /* aguarda */ } await wait(200); }
if (!page) throw new Error('Navegador de inventário indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let requestId = 0; const callbacks = new Map(); socket.addEventListener('message', (event) => { const response = JSON.parse(event.data); if (!response.id || !callbacks.has(response.id)) return; const pending = callbacks.get(response.id); callbacks.delete(response.id); response.error ? pending.reject(new Error(response.error.message)) : pending.resolve(response.result || {}); });
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++requestId; callbacks.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
try {
  const report = [];
  for (const path of pages) {
    await call('Page.navigate', { url: `${base}/${path}?auditoria_botoes=1` }); await wait(2300);
    const controls = await evaluate(`(() => Array.from(document.querySelectorAll('a[href], button, input[type="button"], input[type="submit"], [role="button"]')).map((node) => {
      const rect = node.getBoundingClientRect(); const style = getComputedStyle(node); const text = (node.innerText || node.value || node.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
      return { tag: node.tagName.toLowerCase(), text: text.slice(0, 120), href: node.getAttribute('href') || '', id: node.id || '', className: typeof node.className === 'string' ? node.className.slice(0, 120) : '', disabled: Boolean(node.disabled || node.getAttribute('aria-disabled') === 'true'), visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' };
    }).filter((item) => item.visible))()`);
    report.push({ path, count: controls.length, controls });
  }
  const summary = { generatedAt: new Date().toISOString(), pages: report, totalControls: report.reduce((sum, item) => sum + item.count, 0) };
  writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`); console.log(JSON.stringify({ totalControls: summary.totalControls, pages: report.map((item) => ({ path: item.path, count: item.count })) }, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
