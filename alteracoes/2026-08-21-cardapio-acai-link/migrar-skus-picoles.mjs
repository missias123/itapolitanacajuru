import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = '/home/ubuntu/itapolitanacajuru-source';
const activeFiles = [
  'dados/produtos.json',
  'dados/config.json',
  'dados/faq_cardapio.json',
  'index.html',
  'encomendas.html',
  'retirada.html',
  'admin-painel.html',
  'dicas.html',
  'sobre.html',
  'scripts/retirada.js',
  'scripts/ita-bot-engine.js',
  'schema-markup-expanded.json',
  'MEMORIA_OFICIAL_ITAPOLITANA.md'
];

const groupDefinitions = [
  { key: 'frutas_agua', title: 'Picolés Base Água & Frutas', prefix: 'PIC-AG', start: 1, end: 8 },
  { key: 'leite_sem_recheio', title: 'Picolés AO LEITE Cremosos S/ Recheio', prefix: 'PIC-CR', start: 21, end: 24 },
  { key: 'leite_com_recheio', title: 'Picolés AO LEITE Cremosos Recheados', prefix: 'PIC-REC', start: 9, end: 20 },
  { key: 'especiais', title: 'Picolés AO LEITE Especiais', prefix: 'PIC-ESP', start: 25, end: 26 },
  { key: 'esquimós', title: 'Picolés AO LEITE Premium Eskimós', prefix: 'PIC-PREM-ESKIMO', start: 27, end: 34 }
];

const skuMap = new Map();
for (const group of groupDefinitions) {
  for (let oldNumber = group.start, sequence = 1; oldNumber <= group.end; oldNumber += 1, sequence += 1) {
    skuMap.set(`PIC-${String(oldNumber).padStart(3, '0')}`, `${group.prefix}-${String(sequence).padStart(3, '0')}`);
  }
}

const textReplacements = [
  ['Picolés Fruta & Água', 'Picolés Base Água & Frutas'],
  ['PIC-PREM-ESK-', 'PIC-PREM-ESKIMO-'],
  ['Picolés AO LEITE Cremosos S/ RECHEIO', 'Picolés AO LEITE Cremosos S/ Recheio'],
  ['Base Água / Frutas', 'Picolés Fruta & Água'],
  ['Picolé de Frutas', 'Picolés Fruta & Água'],
  ['Picolé Frutas', 'Picolés Fruta & Água'],
  ['Frutas / Base Água', 'Picolés Fruta & Água'],
  ['Picolé Sem Recheio', 'Picolés AO LEITE Cremosos S/ RECHEIO'],
  ['Sem Recheio — Base Leite', 'Picolés AO LEITE Cremosos S/ RECHEIO'],
  ['Sem Recheio - Base Leite', 'Picolés AO LEITE Cremosos S/ RECHEIO'],
  ['Picolé Recheado', 'Picolés AO LEITE Cremosos Recheados'],
  ['Picolés Recheados', 'Picolés AO LEITE Cremosos Recheados'],
  ['Recheados — Base Leite', 'Picolés AO LEITE Cremosos Recheados'],
  ['Recheados - Base Leite', 'Picolés AO LEITE Cremosos Recheados'],
  ['Picolé Especial', 'Picolés AO LEITE Especiais'],
  ['Especiais — Base Leite', 'Picolés AO LEITE Especiais'],
  ['Especiais - Base Leite', 'Picolés AO LEITE Especiais'],
  ['Picolé Esquimó', 'Picolés AO LEITE Premium Eskimós'],
  ['Picolé Esquimós', 'Picolés AO LEITE Premium Eskimós'],
  ['Esquimós — Base Leite', 'Picolés AO LEITE Premium Eskimós'],
  ['Esquimós - Base Leite', 'Picolés AO LEITE Premium Eskimós'],
  ['"nome": "Recheados"', '"nome": "Picolés AO LEITE Cremosos Recheados"'],
  ['"nome": "Sem Recheio"', '"nome": "Picolés AO LEITE Cremosos S/ RECHEIO"'],
  ['"nome": "Especiais"', '"nome": "Picolés AO LEITE Especiais"'],
  ['"nome": "Esquimós"', '"nome": "Picolés AO LEITE Premium Eskimós"']
];

function replaceAllLiteral(content, oldValue, newValue) {
  return content.split(oldValue).join(newValue);
}

const summary = [];
for (const relativePath of activeFiles) {
  const path = resolve(root, relativePath);
  const before = readFileSync(path, 'utf8');
  let after = before;
  for (const [oldSku, newSku] of skuMap) after = replaceAllLiteral(after, oldSku, newSku);
  for (const [oldText, newText] of textReplacements) after = replaceAllLiteral(after, oldText, newText);
  if (after !== before) writeFileSync(path, after);
  summary.push({ file: relativePath, changed: after !== before });
}

const mappingRows = [...skuMap.entries()].map(([oldSku, newSku]) => `${oldSku},${newSku}`).join('\n');
writeFileSync(resolve(root, 'alteracoes/2026-08-21-cardapio-acai-link/mapeamento-skus-picoles.csv'), `sku_anterior,sku_novo\n${mappingRows}\n`);
writeFileSync(resolve(root, 'alteracoes/2026-08-21-cardapio-acai-link/resultado-migracao-skus-picoles.json'), `${JSON.stringify({ groups: groupDefinitions, files: summary }, null, 2)}\n`);
console.log(JSON.stringify({ groups: groupDefinitions, changedFiles: summary.filter((item) => item.changed).map((item) => item.file) }, null, 2));
