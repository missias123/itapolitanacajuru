import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const raw = JSON.parse(fs.readFileSync(new URL('dados/produtos.json', root), 'utf8'));
const flavors = raw.sabores_sorvete || [];
const records = raw.cadastro_skus?.por_chave || {};
const newFlavor = flavors.find((item) => item.codigo === 'MAS-039');
const newRecord = records['massas.MAS-039'];

assert.equal(flavors.length, 39, 'o catálogo de sabores de massa deve ter 39 itens');
assert.ok(newFlavor, 'MAS-039 não está no array de sabores');
assert.ok(newRecord, 'massas.MAS-039 não está no cadastro mestre');
assert.equal(newFlavor.nome, 'Açaí Natureon');
assert.equal(newRecord.sku, 'MAS-039');
assert.equal(newRecord.categoria, 'Sabores de massa');
assert.equal(newRecord.nome, 'Açaí Natureon');
assert.equal(newRecord.preco, null, 'o sabor deve herdar o preço por número de bolas');
assert.equal(newRecord.ativo, true);
assert.deepEqual(raw.sorvetes.preços.casquinha, { '1 Bola': 8, '2 Bolas': 10, '3 Bolas': 12 });
assert.deepEqual(raw.sorvetes.preços.copo, { '1 Bola': 8, '2 Bolas': 10, '3 Bolas': 12 });

const acaiRecords = Object.entries(records).filter(([key, item]) => key.startsWith('acai.') || /açaí/i.test(item.categoria || ''));
const picoleRecords = Object.entries(records).filter(([key, item]) => key.startsWith('picoles.') || item.categoria === 'Picolés');
assert.equal(acaiRecords.some(([, item]) => item.sku === 'MAS-039'), false, 'MAS-039 vazou para Açaí');
assert.equal(picoleRecords.some(([, item]) => item.sku === 'MAS-039'), false, 'MAS-039 vazou para picolés');
assert.equal(Object.values(raw.picolés || {}).some((group) => (group.sabores || []).some((item) => item.codigo === 'MAS-039')), false, 'MAS-039 vazou para sabores de picolé');

test('Açaí Natureon é o 39.º sabor de sorvete de massa', () => {
  assert.equal(flavors.at(-1).codigo, 'MAS-039');
  assert.equal(flavors.at(-1).nome, 'Açaí Natureon');
});

test('Açaí Natureon não é produto de Açaí por copo nem picolé', () => {
  assert.equal(acaiRecords.some(([, item]) => item.sku === 'MAS-039'), false);
  assert.equal(picoleRecords.some(([, item]) => item.sku === 'MAS-039'), false);
});

console.log('PASS: 39 sabores, MAS-039 activo, preço herdado por bolas e exclusão de Açaí/picolés.');
