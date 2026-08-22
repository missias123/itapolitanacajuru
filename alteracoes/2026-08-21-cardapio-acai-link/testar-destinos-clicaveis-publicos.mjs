import { readFileSync, writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link';
const inventory = JSON.parse(readFileSync(`${root}/inventario-botoes-site.json`, 'utf8'));
const base = 'https://itapolitanacajuru.com.br/';
const reportPath = `${root}/resultado-destinos-clicaveis-publicos.json`;
const controls = inventory.pages.flatMap((page) => page.controls.map((control) => ({ page: page.path, ...control })));
const destinations = [...new Set(controls.map((control) => control.href).filter(Boolean))];
const internal = destinations.filter((href) => {
  if (href.startsWith('#') || /^(mailto:|tel:|javascript:|https:\/\/wa\.me)/i.test(href)) return false;
  try { return new URL(href, base).origin === new URL(base).origin; } catch { return false; }
}).map((href) => new URL(href, base).href);
const external = destinations.filter((href) => !internal.includes(new URL(href, base).href));
const uniqueInternal = [...new Set(internal)];

async function check(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'ItapolitanaButtonAudit/1.0' } });
    return { url, status: response.status, ok: response.ok, finalUrl: response.url };
  } catch (error) { return { url, status: 0, ok: false, error: error.message }; }
}
async function pool(items, limit = 12) {
  const results = []; let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (cursor < items.length) { const current = items[cursor++]; results.push(await check(current)); } }));
  return results;
}
const results = await pool(uniqueInternal);
const failed = results.filter((item) => !item.ok);
const report = { generatedAt: new Date().toISOString(), totalControls: inventory.totalControls, controlsWithHref: controls.filter((item) => item.href).length, internalDestinations: results.length, externalOrActionDestinations: external.length, failedDestinations: failed, results };
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ totalControls: report.totalControls, controlsWithHref: report.controlsWithHref, internalDestinations: report.internalDestinations, failedDestinations: failed.length, reportPath }, null, 2));
