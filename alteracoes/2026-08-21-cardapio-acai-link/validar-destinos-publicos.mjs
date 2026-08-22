import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const siteUrl = process.argv[2] || 'https://itapolitanacajuru.com.br/index.html?auditoria-destinos=1';
const reportPath = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link/resultado-destinos-publicos.json';
const html = execFileSync('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--ignore-certificate-errors',
  '--virtual-time-budget=8000', '--dump-dom', siteUrl
], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

function attr(raw, name) {
  return raw.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || '';
}
const buttons = [...html.matchAll(/<a\b([\s\S]*?)>([\s\S]*?)<\/a>/gi)]
  .map((match) => ({ raw: match[1], href: attr(match[1], 'href'), sku: attr(match[1], 'data-sku') }))
  .filter((item) => attr(item.raw, 'class').split(/\s+/).includes('product-pickup-btn'));

const queue = [...buttons];
const results = [];
async function worker() {
  while (queue.length) {
    const item = queue.shift();
    const url = new URL(item.href, siteUrl).href;
    try {
      const response = await fetch(url, { redirect: 'follow' });
      const content = await response.text();
      const finalUrl = response.url;
      const expected = new URL(item.href, siteUrl);
      const final = new URL(finalUrl);
      const approved = response.ok && /Pedido para retirada/i.test(content) && expected.searchParams.get('sku') === item.sku && expected.hash === '#catalogo' && final.pathname.endsWith('/retirada.html') && final.searchParams.get('sku') === item.sku;
      results.push({ sku: item.sku, href: url, destino: finalUrl, status: response.status, aprovado: approved });
    } catch (error) {
      results.push({ sku: item.sku, href: url, destino: '', status: 0, aprovado: false, erro: error.message });
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
const failed = results.filter((item) => !item.aprovado);
const report = { origem: siteUrl, total: results.length, aprovados: results.length - failed.length, falhas: failed.length, pedidoEnviado: false, itensComFalha: failed, resultados: results };
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ total: report.total, aprovados: report.aprovados, falhas: report.falhas, relatorio: reportPath }, null, 2));
