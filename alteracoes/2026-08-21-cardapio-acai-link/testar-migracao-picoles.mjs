import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = '/home/ubuntu/itapolitanacajuru-source';
const evidence = `${root}/alteracoes/2026-08-21-cardapio-acai-link/resultado-teste-migracao-picoles.json`;
const data = JSON.parse(readFileSync(`${root}/dados/produtos.json`, 'utf8'));
const expected = [
  ['frutas_agua', 'Picolés Base Água & Frutas', 'PIC-AG', 8],
  ['leite_sem_recheio', 'Picolés AO LEITE Cremosos S/ Recheio', 'PIC-CR', 4],
  ['leite_com_recheio', 'Picolés AO LEITE Cremosos Recheados', 'PIC-REC', 12],
  ['especiais', 'Picolés AO LEITE Especiais', 'PIC-ESP', 2],
  ['esquimós', 'Picolés AO LEITE Premium Eskimós', 'PIC-PREM-ESKIMO', 8]
];
const groups = data['picolés'];
const groupOrder = Object.keys(groups);
const catalogChecks = expected.map(([key, name, prefix, count]) => {
  const group = groups[key] || {}; const skus = (group.sabores || []).map((item) => item.codigo);
  return { key, name: group.nome, price: group.preço_varejo, skus, correctName: group.nome === name, correctCount: skus.length === count, correctPrefix: skus.every((sku) => sku.startsWith(`${prefix}-`)) };
});
const allSkus = catalogChecks.flatMap((item) => item.skus);
const activeFiles = ['dados/produtos.json', 'dados/config.json', 'dados/faq_cardapio.json', 'index.html', 'encomendas.html', 'retirada.html', 'admin-painel.html', 'dicas.html', 'sobre.html', 'scripts/retirada.js', 'scripts/ita-bot-engine.js', 'schema-markup-expanded.json', 'MEMORIA_OFICIAL_ITAPOLITANA.md'];
const oldSkuFiles = activeFiles.filter((file) => /PIC-\d{3}\b/.test(readFileSync(`${root}/${file}`, 'utf8')));
const encomendasSource = readFileSync(`${root}/encomendas.html`, 'utf8');
const expectedLabels = expected.map((item) => item[1]);
const encomendasSourceIndexes = expectedLabels.map((label) => encomendasSource.indexOf(label));

const port = 9297; const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/itap-sku-${Date.now()}`, '--window-size=1280,900', 'about:blank'], { detached: true, stdio: 'ignore' }); browser.unref();
let target;
for (let attempt = 0; attempt < 40; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = pages.find((page) => page.type === 'page' && page.webSocketDebuggerUrl); if (target) break; } catch { /* aguarda */ } await wait(200); }
if (!target) throw new Error('Navegador de validação indisponível.');
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result || {}); });
const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
try {
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/retirada.html?teste-skus-picoles=1' }); await wait(3200);
  const pageGroups = await evaluate(`(() => [...document.querySelectorAll('[data-section-tone="picoles"] .product__name')].map((node) => node.textContent.trim()))()`);
  const expectedLabelText = expectedLabels.join('|');
  await command('Page.navigate', { url: 'http://127.0.0.1:4173/encomendas.html?teste-skus-picoles=1' }); await wait(3200);
  const encomendasText = await evaluate('document.body.innerText');
  const encomendasIndexes = expected.map((item) => encomendasText.indexOf(item[1]));
  const result = { categoryOrder: groupOrder, catalogChecks, uniqueSkuCount: new Set(allSkus).size, totalSkuCount: allSkus.length, nonDecreasingPrices: catalogChecks.every((entry, index, list) => index === 0 || entry.price >= list[index - 1].price), oldSkuFiles, pageGroups, pageGroupsMatch: pageGroups.join('|') === expectedLabelText, encomendasIndexes, encomendasCategoriesMatch: encomendasIndexes.every((position) => position >= 0) && encomendasIndexes.every((position, index) => index === 0 || position > encomendasIndexes[index - 1]), encomendasSourceIndexes, encomendasSourceCategoriesMatch: encomendasSourceIndexes.every((position) => position >= 0) && encomendasSourceIndexes.every((position, index) => index === 0 || position > encomendasSourceIndexes[index - 1]), whatsappOpened: false, orderSent: false };
  writeFileSync(evidence, `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify(result, null, 2));
} finally { socket.close(); process.kill(-browser.pid, 'SIGTERM'); }
