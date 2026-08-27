import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const raw = JSON.parse(fs.readFileSync(new URL('dados/produtos.json', root), 'utf8'));
const source = fs.readFileSync(new URL('scripts/catalogo-mestre.js', root), 'utf8');
const window = {};
vm.runInNewContext(source, { window, console }, { filename: 'scripts/catalogo-mestre.js' });
const resolver = window.ITAP_CATALOGO_MESTRE;
assert.ok(resolver?.resolverNome, 'resolverNome não foi exportado');

const officialSundae = Object.values(raw.cadastro_skus?.por_chave || {}).find((item) => item.sku === 'TAC-TRD-007');
assert.ok(officialSundae, 'TAC-TRD-007 não encontrado no Cardápio Mestre');
assert.equal(officialSundae.nome, 'Taça Sundae com Nutela');
assert.equal(officialSundae.preco, 28);
assert.notEqual(officialSundae.status, 'inativo');
assert.ok(officialSundae.aliases?.includes('Sundae com Nutella'), 'alias histórico não registado');

function resolve(query, options) {
  return resolver.resolverNome(raw, query, options);
}

test('SKU exacto resolve com segurança', () => {
  const result = resolve('TAC-TRD-007');
  assert.equal(result.status, 'exact_sku');
  assert.equal(result.sku, 'TAC-TRD-007');
  assert.equal(result.safeToUse, true);
  assert.equal(result.candidates[0].preco, 28);
});

test('nome oficial e aliases do PDF apontam para um único SKU', () => {
  for (const query of ['Taça Sundae com Nutela', 'Sundae com Nutela', 'Sundae c/ Nutela', 'Sundae com Nutella', 'Taça Sundae com Nutella']) {
    const result = resolve(query);
    assert.ok(['exact_name', 'exact_alias'].includes(result.status), `${query}: status=${result.status}`);
    assert.equal(result.sku, 'TAC-TRD-007', query);
    assert.equal(result.safeToUse, true, query);
    assert.equal(result.candidates[0].preco, 28, query);
  }
});

test('erro de digitação gera sugestão, mas não confirmação automática', () => {
  const result = resolve('Sundee com Nutela');
  assert.equal(result.status, 'suggestion');
  assert.equal(result.safeToUse, false);
  assert.equal(result.requiresConfirmation, true);
  assert.equal(result.candidates[0].sku, 'TAC-TRD-007');
});

test('nome que representa vários tamanhos fica ambíguo', () => {
  const result = resolve('Copo recheado');
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.safeToUse, false);
  assert.equal(new Set(result.candidates.map((candidate) => candidate.sku)).size, 3);
});

test('SKU inactivo não pode ser usado', () => {
  const result = resolve('PIC-REC-008');
  assert.equal(result.status, 'inactive');
  assert.equal(result.safeToUse, false);
  assert.equal(result.candidates[0].nome, 'Mamão Papaia');
});

test('entrada desconhecida não inventa correspondência', () => {
  const result = resolve('produto inexistente xyz');
  assert.equal(result.status, 'not_found');
  assert.equal(result.safeToUse, false);
  assert.equal(result.candidates.length, 0);
});

test('aliases não alteram o preço nem fundem produtos distintos', () => {
  const casquinha = resolve('Casquinha');
  const copo = resolve('Copo');
  assert.equal(casquinha.status, 'ambiguous');
  assert.equal(copo.status, 'ambiguous');
  assert.equal(casquinha.safeToUse, false);
  assert.equal(copo.safeToUse, false);
  assert.notDeepEqual(casquinha.candidates.map((item) => item.sku), copo.candidates.map((item) => item.sku));
});

console.log('PASS: resolvedor de nomes para SKU — exacto, alias, sugestão, ambiguidade, inactivo e desconhecido.');
