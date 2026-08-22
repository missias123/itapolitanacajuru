import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const port = 9264;
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-caixas-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' });
chrome.unref();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) break; } catch { /* espera */ } await wait(200); }
if (!page) throw new Error('Navegador de teste indisponível.');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map();
socket.addEventListener('message', (event) => { const payload = JSON.parse(event.data); if (!payload.id || !pending.has(payload.id)) return; const current = pending.get(payload.id); pending.delete(payload.id); payload.error ? current.reject(new Error(payload.error.message)) : current.resolve(payload.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => { const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Falha no teste.'); return response.result?.value; };

try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-caixas=1#catalogo' });
  await wait(3600);
  const result = await evaluate(`(() => {
    localStorage.removeItem('itap_retirada_v1');
    const expected = ['CAX-5L_2S', 'CAX-5L_3S', 'CAX-10L_2S', 'CAX-10L_3S'];
    const cards = expected.map((sku) => document.querySelector('[data-catalog-sku="' + sku + '"]'));
    const visible = cards.map((card) => ({ sku: card?.dataset.catalogSku || '', text: card?.textContent || '' }));
    const openAndMeasure = (sku, amount) => { const card = document.querySelector('[data-catalog-sku="' + sku + '"]'); card?.querySelector('button')?.click(); const grid = [...document.querySelectorAll('#flavor-grid .flavor-chip')]; grid.slice(0, amount).forEach((button) => button.click()); return { title: document.getElementById('flavor-title')?.textContent.trim(), selected: document.querySelectorAll('#flavor-grid [aria-pressed="true"]').length, confirmEnabled: !document.getElementById('confirm-flavors').disabled, subtitle: document.getElementById('flavor-subtitle')?.textContent.trim() }; };
    const twoFlavors = openAndMeasure('CAX-5L_2S', 2); document.getElementById('confirm-flavors').click();
    const threeFlavors = openAndMeasure('CAX-10L_3S', 3); document.getElementById('confirm-flavors').click();
    const cartText = document.getElementById('cart-list')?.textContent || ''; const notes = document.getElementById('notes'); const notesHelp = notes?.parentElement?.textContent || '';
    return { cards: visible, allCardsPresent: cards.every(Boolean), twoFlavors, threeFlavors, cartHasFiveLiterSku: cartText.includes('CAX-5L_2S'), cartHasTenLiterSku: cartText.includes('CAX-10L_3S'), includedPackaging: cartText.includes('Embalagem Caixa 5 Litros') && cartText.includes('incluída no valor'), notesPlaceholder: notes?.getAttribute('placeholder') || '', notesHelp, whatsappOpened: false, orderSent: false };
  })()`);
  await evaluate(`document.querySelector('[data-form-step="4"]')?.scrollIntoView({ block: 'center' })`);
  await wait(400);
  const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${root}/demonstracao-desktop-observacoes-substituicoes.png`, Buffer.from(image.data, 'base64'));
  writeFileSync(`${root}/resultado-teste-caixas-grandes-observacoes.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-chrome.pid, 'SIGTERM'); }
