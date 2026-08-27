#!/usr/bin/env node
/**
 * Gate de integridade do Cardápio Oficial Mestre.
 *
 * Este gate é somente leitura. Ele confirma que:
 * - as variantes de sorvetes de massa têm preço e SKU correspondente no mestre;
 * - os seis SKUs de Casquinha/Copo e os três de Copo recheado permanecem intactos;
 * - nenhuma superfície pública activa reintroduz identificadores legados combinados.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const checks = [];

function check(name, passed, detail = '') {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
}

function readJson(relativePath) {
  const file = path.join(ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push({ name: `${relativePath}: JSON válido`, detail: error.message });
    return null;
  }
}

function normalizedKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function numeric(value) {
  return Number(value);
}

function trackedFiles() {
  try {
    return cp.execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean);
  } catch (error) {
    failures.push({ name: 'git ls-files disponível', detail: error.message });
    return [];
  }
}

function isPublishedSource(relativePath) {
  if (!/\.(html|js|json|css)$/i.test(relativePath)) return false;
  if (/^(tests|docs|\.github)\//i.test(relativePath)) return false;
  if (/(^|\/)(\.changes|\.alteracoes-overlays|\.backups|alteracoes|backups|historico|historico-)/i.test(relativePath)) return false;
  if (/\.(before|backup)(\.|$)/i.test(relativePath)) return false;
  if (/^scripts\/(auditoria|audit-|dependency-audit|quality-audit|auto-corrigir|admin-espelho-gate|catalogo-mestre-gate)/i.test(relativePath)) return false;
  return true;
}

const catalog = readJson('dados/produtos.json');
check('dados/produtos.json: leitura', Boolean(catalog));

if (catalog) {
  const master = catalog.cadastro_skus?.por_chave || {};
  const prices = catalog.sorvetes?.preços || catalog.sorvetes?.precos || {};
  check('cadastro_skus.por_chave existe', Object.keys(master).length > 0, Object.keys(master).length);
  check('sorvetes.preços não tem chave combinada legada', !Object.keys(prices).some((key) => /casquinha[_/]?copo|copo[_/]?casquinha/i.test(key)), Object.keys(prices));

  const expected = {
    'sorvetes.casquinha.1_bola': { sku: 'SVM-CASK-01', nome: 'Casquinha', tamanho: '1 Bola', preco: 8 },
    'sorvetes.casquinha.2_bolas': { sku: 'SVM-CASK-02', nome: 'Casquinha', tamanho: '2 Bolas', preco: 10 },
    'sorvetes.casquinha.3_bolas': { sku: 'SVM-CASK-03', nome: 'Casquinha', tamanho: '3 Bolas', preco: 12 },
    'sorvetes.copo.1_bola': { sku: 'SVM-COPO-01', nome: 'Copo', tamanho: '1 Bola', preco: 8 },
    'sorvetes.copo.2_bolas': { sku: 'SVM-COPO-02', nome: 'Copo', tamanho: '2 Bolas', preco: 10 },
    'sorvetes.copo.3_bolas': { sku: 'SVM-COPO-03', nome: 'Copo', tamanho: '3 Bolas', preco: 12 },
    'sorvetes.copo_recheado.1_bola': { sku: 'SVM-CR-01', nome: 'Copo recheado', tamanho: '1 Bola', preco: 10 },
    'sorvetes.copo_recheado.2_bolas': { sku: 'SVM-CR-02', nome: 'Copo recheado', tamanho: '2 Bolas', preco: 12 },
    'sorvetes.copo_recheado.3_bolas': { sku: 'SVM-CR-03', nome: 'Copo recheado', tamanho: '3 Bolas', preco: 15 }
  };

  for (const [key, expectedRecord] of Object.entries(expected)) {
    const actual = master[key];
    check(`${key}: SKU, nome, tamanho e preço oficiais`, Boolean(actual) && actual.sku === expectedRecord.sku && actual.nome === expectedRecord.nome && actual.tamanho === expectedRecord.tamanho && numeric(actual.preco) === expectedRecord.preco && actual.ativo === true, actual || null);
  }

  const massPriceKeys = Object.keys(prices);
  check('tabela de massa contém apenas os cinco formatos oficiais', JSON.stringify(massPriceKeys) === JSON.stringify(['casquinha', 'copo', 'copo_recheado', 'cascão', 'cestinha']), massPriceKeys);
  for (const [format, table] of Object.entries(prices)) {
    for (const [size, price] of Object.entries(table || {})) {
      const key = `sorvetes.${format}.${normalizedKey(size)}`;
      const record = master[key];
      check(`${key}: preço da tabela corresponde ao SKU mestre`, Boolean(record) && numeric(record.preco) === numeric(price) && record.ativo === true, { tablePrice: price, record });
    }
  }

  const massMasterKeys = Object.keys(master).filter((key) => key.startsWith('sorvetes.'));
  const missingPriceRows = massMasterKeys.filter((key) => {
    const match = key.match(/^sorvetes\.([^\.]+)\.(.+)$/);
    if (!match) return false;
    const table = prices[match[1]];
    if (!table) return true;
    const size = Object.keys(table).find((candidate) => normalizedKey(candidate) === match[2]);
    return !size;
  });
  check('cada SKU de sorvete de massa tem linha de preço oficial', missingPriceRows.length === 0, missingPriceRows);

  const skuValues = Object.values(master).map((record) => record?.sku).filter(Boolean);
  const duplicateSkus = skuValues.filter((sku, index) => skuValues.indexOf(sku) !== index);
  check('cadastro mestre não duplica SKU', duplicateSkus.length === 0, duplicateSkus);
}

const forbiddenFragments = [
  ['casquinha', '_', 'copo'],
  ['copo', '_', 'casquinha'],
  ['casquinha', '/', 'copo'],
  ['copo', '/', 'casquinha'],
  ['casquinha', ' ou ', 'copo'],
  ['copo', ' ou ', 'casquinha']
];
const forbiddenPattern = new RegExp(forbiddenFragments.map((parts) => parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*')).join('|'), 'i');
const activeMatches = [];
for (const relativePath of trackedFiles().filter(isPublishedSource)) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  if (forbiddenPattern.test(source)) activeMatches.push(relativePath);
}
check('superfícies publicadas sem nomenclatura legada combinada', activeMatches.length === 0, activeMatches);

const summary = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failed: failures.length,
  failures
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exit(1);
