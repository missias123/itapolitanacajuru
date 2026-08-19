import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const root = 'http://127.0.0.1:4173/index.html?neon-interaction-test=20260818';
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=9222', '--user-data-dir=/tmp/itap-neon-cdp',
  '--window-size=360,800', 'about:blank'
], { stdio: 'ignore' });

try {
  let page;
  for (let i = 0; i < 30 && !page; i++) {
    await sleep(200);
    try {
      const response = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(root), { method: 'PUT' });
      if (response.ok) page = await response.json();
    } catch {}
  }
  if (!page) throw new Error('Não foi possível abrir a página CDP');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, message => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result));
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  await send('Runtime.enable');
  const evalJs = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await sleep(1500);
  const rect = await evalJs(`(() => { const b = document.querySelector('.itap-nav-btn:not([aria-current])'); const r = b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
  const normal = await evalJs(`(() => { const b=document.querySelector('.itap-nav-btn:not([aria-current])'); const s=getComputedStyle(b); return {border:s.borderColor,shadow:s.boxShadow}; })()`);
  await evalJs(`document.querySelector('.itap-nav-btn:not([aria-current])').focus()`);
  await sleep(80);
  const focus = await evalJs(`(() => { const b=document.querySelector('.itap-nav-btn:not([aria-current])'); const s=getComputedStyle(b); return {border:s.borderColor,shadow:s.boxShadow}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
  await sleep(120);
  const hover = await evalJs(`(() => { const b=document.querySelector('.itap-nav-btn:not([aria-current])'); const s=getComputedStyle(b); return {border:s.borderColor,shadow:s.boxShadow}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await sleep(80);
  const active = await evalJs(`(() => { const b=document.querySelector('.itap-nav-btn:not([aria-current])'); const s=getComputedStyle(b); return {border:s.borderColor,shadow:s.boxShadow}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  console.log(JSON.stringify({ normal, hover, active, focus }, null, 2));
  ws.close();
} finally {
  chrome.kill('SIGTERM');
}
