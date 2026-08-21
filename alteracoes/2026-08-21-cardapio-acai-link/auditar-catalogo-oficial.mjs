import { readFileSync, writeFileSync } from 'node:fs';

const source = '/home/ubuntu/itapolitanacajuru-source/dados/produtos.json';
const output = '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link/auditoria-catalogo-oficial.json';
const data = JSON.parse(readFileSync(source, 'utf8'));
const products = Object.entries(data.cadastro_skus?.por_chave ?? {}).map(([key, product]) => ({ key, ...product }));
const byCategory = products.reduce((map, product) => {
  (map[product.categoria] ??= []).push(product);
  return map;
}, {});
const duplicateSkus = products.filter((product, index, list) => list.findIndex((item) => item.sku === product.sku) !== index).map((product) => product.sku);
const missingRequired = products.filter((product) => !product.sku || !product.nome || !product.categoria || !product.tamanho || !Number.isFinite(Number(product.preco)));
const report = {
  generatedAt: new Date().toISOString(),
  totalProducts: products.length,
  categories: Object.fromEntries(Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([category, items]) => [category, {
    total: items.length,
    products: items.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.tamanho.localeCompare(b.tamanho, 'pt-BR') || a.sku.localeCompare(b.sku)),
  }])),
  integrity: {
    duplicateSkus: [...new Set(duplicateSkus)],
    missingRequired: missingRequired.map(({ key, sku, nome }) => ({ key, sku, nome })),
  },
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ totalProducts: report.totalProducts, categories: Object.fromEntries(Object.entries(report.categories).map(([category, value]) => [category, value.total])), duplicateSkus: report.integrity.duplicateSkus.length, missingRequired: report.integrity.missingRequired.length }, null, 2));
