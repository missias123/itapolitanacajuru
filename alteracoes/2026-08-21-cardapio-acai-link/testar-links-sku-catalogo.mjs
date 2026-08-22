import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const inventory = JSON.parse(await readFile(resolve(import.meta.dirname, 'inventario-botoes-site.json'), 'utf8'));
const products = JSON.parse(await readFile(resolve(root, 'dados/produtos.json'), 'utf8'));
const activeSkus = new Set();
const collectSkus = (value) => {
  if (!value || typeof value !== 'object') return;
  if (typeof value.sku === 'string' && value.sku.trim()) activeSkus.add(value.sku.trim());
  for (const child of Object.values(value)) collectSkus(child);
};
collectSkus(products);

const linkedSkus = [];
for (const [page, controls] of Object.entries(inventory.pages || inventory)) {
  for (const control of controls.controls || controls) {
    const href = control.href || '';
    const match = href.match(/retirada\.html\?sku=([^&#"']+)/i);
    if (match) linkedSkus.push({ page, sku: decodeURIComponent(match[1]), label: control.text || control.label || '' });
  }
}
const invalid = linkedSkus.filter((link) => !activeSkus.has(link.sku));
const unique = [...new Set(linkedSkus.map((link) => link.sku))];
const result = { generatedAt: new Date().toISOString(), controlsChecked: linkedSkus.length, uniqueSkusChecked: unique.length, activeSkus: activeSkus.size, invalid };
await writeFile(resolve(import.meta.dirname, 'resultado-links-sku-catalogo.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ controlsChecked: result.controlsChecked, uniqueSkusChecked: result.uniqueSkusChecked, invalidLinks: invalid.length, reportPath: resolve(import.meta.dirname, 'resultado-links-sku-catalogo.json') }, null, 2));
if (invalid.length) process.exitCode = 1;
