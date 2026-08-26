#!/usr/bin/env node
/**
 * Auditoria pós-alteração de duplicações do site Itapolitana.
 *
 * Uso:
 *   node scripts/auditoria-duplicacoes.js
 *   node scripts/auditoria-duplicacoes.js --ci
 *
 * O gate é somente leitura. Não remove históricos, backups, produtos ou dados.
 * A regra é aplicada ao markup publicado na raiz e aos SKUs do catálogo oficial.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CI = process.argv.includes('--ci');
const failures = [];
const warnings = [];
const knownIntentional = [];
const checks = [];

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function recordCheck(name, passed, detail = '') {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
}

function readRootHtmlFiles() {
  return fs.readdirSync(ROOT)
    .filter(name => name.endsWith('.html'))
    .sort()
    .map(name => ({ name, file: path.join(ROOT, name), source: fs.readFileSync(path.join(ROOT, name), 'utf8') }));
}

function extractAll(source, pattern, group = 1) {
  const values = [];
  let match;
  while ((match = pattern.exec(source)) !== null) values.push(match[group]);
  return values;
}

for (const { name, source } of readRootHtmlFiles()) {
  // Strings de templates (por exemplo, a janela de impressão do admin) não são
  // markup publicado. Removê-las evita falsos positivos sem esconder tags reais.
  const staticMarkup = source.replace(/<script\b(?![^>]*\bsrc=)[\s\S]*?<\/script>/gi, '');
  const scripts = extractAll(staticMarkup, /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi);
  const styles = extractAll(staticMarkup, /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi);
  const ids = extractAll(staticMarkup, /\bid=["']([^"']+)["']/gi);
  const duplicateScripts = countValues(scripts);
  const duplicateStyles = countValues(styles);
  const duplicateIds = countValues(ids);
  const touchCount = scripts.filter(src => src.includes('scripts/itap-touch-feedback.js')).length;

  recordCheck(`${name}: scripts sem duplicação literal`, duplicateScripts.length === 0, duplicateScripts);
  recordCheck(`${name}: CSS sem duplicação literal`, duplicateStyles.length === 0, duplicateStyles);
  recordCheck(`${name}: IDs únicos`, duplicateIds.length === 0, duplicateIds);
  recordCheck(`${name}: haptic carregado uma vez`, touchCount === 1, { touchCount });
}

// O SKU é o mesmo item operacional em duas camadas oficiais: cadastro por chave
// e disponibilidade. Isto é uma relação documentada, não dois produtos vendíveis.
const KNOWN_SKU_REGISTRATIONS = new Map([
  ['EMB-VIAGEM', 'alias operacional: cadastro_skus.por_chave + disponibilidade.embalagens']
]);

const productsPath = path.join(ROOT, 'dados', 'produtos.json');
if (fs.existsSync(productsPath)) {
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const skus = [];
  const walk = (value, currentPath = '$') => {
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
    if (!value || typeof value !== 'object') return;
    if (typeof value.sku === 'string' && value.sku.trim()) skus.push({ sku: value.sku.trim(), path: currentPath });
    for (const [key, child] of Object.entries(value)) walk(child, `${currentPath}.${key}`);
  };
  walk(products);
  const allDuplicateSkus = countValues(skus.map(item => item.sku));
  const duplicateSkus = allDuplicateSkus.filter(item => !KNOWN_SKU_REGISTRATIONS.has(item.value));
  for (const item of allDuplicateSkus.filter(item => KNOWN_SKU_REGISTRATIONS.has(item.value))) {
    knownIntentional.push({ type: 'sku-alias', value: item.value, count: item.count, reason: KNOWN_SKU_REGISTRATIONS.get(item.value), paths: skus.filter(row => row.sku === item.value).map(row => row.path) });
  }
  recordCheck('dados/produtos.json: SKUs únicos fora dos aliases documentados', duplicateSkus.length === 0, duplicateSkus.map(item => ({ ...item, paths: skus.filter(row => row.sku === item.value).map(row => row.path) })));
} else {
  warnings.push('dados/produtos.json não encontrado; verificação de SKUs não executada.');
}

const summary = {
  mode: CI ? 'ci' : 'report',
  htmlFiles: readRootHtmlFiles().length,
  checks: checks.length,
  passed: checks.filter(check => check.passed).length,
  failed: failures.length,
  warnings: warnings.length,
  failures,
  warnings,
  knownIntentional
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0 || (CI && warnings.length > 0)) process.exit(1);
