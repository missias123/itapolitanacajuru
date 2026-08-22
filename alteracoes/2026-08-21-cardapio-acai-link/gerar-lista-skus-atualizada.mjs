import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source';
const jsonPath = `${root}/dados/produtos.json`;
const outputDir = `${root}/alteracoes/2026-08-21-cardapio-acai-link`;
const current = JSON.parse(readFileSync(jsonPath, 'utf8'));
const previous = JSON.parse(execFileSync('git', ['show', 'HEAD:dados/produtos.json'], { cwd: root, encoding: 'utf8' }));
const currentEntries = Object.values(current.cadastro_skus?.por_chave || {});
const previousBySku = new Map(Object.values(previous.cadastro_skus?.por_chave || {}).map((item) => [item.sku, item]));
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const textSkus = new Set(['TAC-TRD-001', 'TAC-TRD-002', 'TAC-TRD-003', 'TAC-TRD-004', 'TAC-TRD-005', 'TAC-TRD-006', 'TAC-TRD-007', 'TAC-TRD-008', 'SOB-006']);

const rows = currentEntries
  .map((item) => ({
    sku: item.sku || '',
    categoria: item.categoria || 'Sem categoria',
    produto: item.nome || '',
    tamanho: item.tamanho || '',
    preco: Number(item.preco || 0),
    ingredientes: Array.isArray(item.ingredientes) ? item.ingredientes.join('; ') : '',
    ativo: item.ativo !== false ? 'Ativo' : 'Inativo',
    priceUnchanged: Number(previousBySku.get(item.sku)?.preco) === Number(item.preco)
  }))
  .sort((a, b) => collator.compare(a.categoria, b.categoria) || a.preco - b.preco || collator.compare(a.produto, b.produto) || collator.compare(a.sku, b.sku));

const changedIngredients = rows.filter((row) => textSkus.has(row.sku));
const alteredPrices = rows.filter((row) => !row.priceUnchanged);
const escapeCell = (value) => String(value || '—').split('\n').join(' ').split('\r').join(' ').split('|').join('\\|');
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const markdown = [
  '# Lista atualizada de SKUs — Sorveteria Itapolitana',
  '',
  `**Total de SKUs:** ${rows.length}. **Preços preservados:** ${rows.length - alteredPrices.length}/${rows.length}. Os preços do PDF não foram usados.`,
  '',
  '## Textos incorporados do PDF',
  '',
  '| SKU | Produto | Ingredientes anexados |',
  '|---|---|---|',
  ...changedIngredients.map((row) => `| ${escapeCell(row.sku)} | ${escapeCell(row.produto)} | ${escapeCell(row.ingredientes)} |`),
  '',
  '## Cadastro completo',
  '',
  '| SKU | Categoria | Produto | Tamanho | Preço do site | Ingredientes / descrição | Situação |',
  '|---|---|---|---|---:|---|---|',
  ...rows.map((row) => `| ${escapeCell(row.sku)} | ${escapeCell(row.categoria)} | ${escapeCell(row.produto)} | ${escapeCell(row.tamanho)} | ${currency.format(row.preco)} | ${escapeCell(row.ingredientes)} | ${row.ativo} |`),
  '',
  '## Conferência',
  '',
  `- Preços alterados nesta atualização: **${alteredPrices.length}**.`,
  '- Fonte dos textos anexados: PDF enviado pelo responsável; valores presentes no documento foram ignorados.',
  '- Produto sem correspondência automática: **nenhum**. O texto de Vaca Preta foi associado ao SKU oficial TAC-TRD-006 após conferência do nome no cadastro mestre.'
].join('\n');

const csv = [
  ['SKU', 'Categoria', 'Produto', 'Tamanho', 'Preço do site', 'Ingredientes ou descrição', 'Situação'],
  ...rows.map((row) => [row.sku, row.categoria, row.produto, row.tamanho, row.preco.toFixed(2).replace('.', ','), row.ingredientes, row.ativo])
].map((line) => line.map(csvCell).join(';')).join('\n');

writeFileSync(`${outputDir}/lista-atualizada-skus.md`, `${markdown}\n`);
writeFileSync(`${outputDir}/lista-atualizada-skus.csv`, `${csv}\n`);
writeFileSync(`${outputDir}/validacao-precos-e-textos.json`, `${JSON.stringify({
  totalSkus: rows.length,
  precosAlterados: alteredPrices.length,
  skusComTextoDoPdf: changedIngredients.map((row) => row.sku),
  semCorrespondencia: []
}, null, 2)}\n`);
console.log(JSON.stringify({ totalSkus: rows.length, precosAlterados: alteredPrices.length, textosAnexados: changedIngredients.length }, null, 2));
