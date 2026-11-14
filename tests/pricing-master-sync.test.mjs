import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const raw = JSON.parse(fs.readFileSync(new URL('dados/produtos.json', root), 'utf8'));
const adapterSource = fs.readFileSync(new URL('scripts/catalogo-mestre.js', root), 'utf8');
const adminSource = fs.readFileSync(new URL('admin-painel.html', root), 'utf8');
const skuAdminSource = fs.readFileSync(new URL('admin-catalogo.html', root), 'utf8');
const indexSource = fs.readFileSync(new URL('index.html', root), 'utf8');
const ordersPageSource = fs.readFileSync(new URL('encomendas.html', root), 'utf8');
const botSource = fs.readFileSync(new URL('scripts/ita-bot-engine.js', root), 'utf8');
const faqMenu = JSON.parse(fs.readFileSync(new URL('dados/faq_cardapio.json', root), 'utf8'));
const faqOrders = JSON.parse(fs.readFileSync(new URL('dados/faq_encomendas.json', root), 'utf8'));
const schemaData = JSON.parse(fs.readFileSync(new URL('schema-markup-expanded.json', root), 'utf8'));

function createAdapter() {
  const window = {};
  vm.runInNewContext(adapterSource, { window }, { filename: 'scripts/catalogo-mestre.js' });
  return window.ITAP_CATALOGO_MESTRE;
}

function evaluateAdminHelper(source, startMarker, endMarker, exportName, context = {}) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${startMarker} não encontrado`);
  assert.notEqual(end, -1, `${endMarker} não encontrado`);
  vm.runInNewContext(`${source.slice(start, end)}\nthis.helper=${exportName};`, context);
  return context.helper;
}

const expectedPrices = {
  milkshake: {
    tradicional: { '300ml': 18, '400ml': 22, '500ml': 24, '750ml': 30 },
    top: { '360ml': 22, '600ml': 26 }
  },
  isopores_viagem: { '4 Bolas': 25, '7 Bolas': 35, '9 Bolas': 45, '12 Bolas': 55 },
  caixas_viagem: {
    '5 Litros (2 sabores)': 115,
    '5 Litros (3 sabores)': 115,
    '10 Litros (2 sabores)': 165,
    '10 Litros (3 sabores)': 165
  },
  torta: 110
};

test('catálogo mestre mantém os preços aprovados e os mesmos códigos SKU', () => {
  const master = raw.cadastro_skus.por_chave;
  for (const [linha, tamanhos] of Object.entries(expectedPrices.milkshake)) {
    for (const [tamanho, preco] of Object.entries(tamanhos)) {
      const key = `milkshake.${linha}.${tamanho.toLowerCase()}`;
      assert.equal(raw.milkshake[linha][tamanho], preco, `${key}: preço de exibição`);
      assert.equal(master[key]?.preco, preco, `${key}: preço mestre`);
      assert.ok(master[key]?.sku, `${key}: código SKU ausente`);
    }
  }
  for (const [tamanho, preco] of Object.entries(expectedPrices.isopores_viagem)) {
    const key = `isopores.${tamanho.toLowerCase().replace(/ /g, '_')}`;
    assert.equal(raw.isopores_viagem[tamanho], preco, `${key}: preço de exibição`);
    assert.equal(master[key]?.preco, preco, `${key}: preço mestre`);
    assert.ok(master[key]?.sku, `${key}: código SKU ausente`);
  }
  for (const [nome, preco] of Object.entries(expectedPrices.caixas_viagem)) {
    assert.equal(raw.caixas_viagem[nome], preco, `${nome}: preço de exibição`);
  }
  for (const [id, preco] of Object.entries({
    cx5l_2s: 115,
    cx5l_3s: 115,
    cx10l_2s: 165,
    cx10l_3s: 165
  })) {
    const product = raw.caixas_enc.find((item) => item.id === id);
    assert.equal(product?.preco, preco, `${id}: encomenda`);
    assert.equal(master[`caixas.${id}`]?.preco, preco, `${id}: preço mestre`);
    assert.equal(master[`caixas.${id}`]?.sku, product?.sku, `${id}: SKU preservado`);
  }
  assert.equal(raw.sobremesas['Torta de Sorvete'], expectedPrices.torta);
  assert.equal(raw.tortas_enc[0].preço, expectedPrices.torta);
  assert.equal(master['sobremesas.1'].preco, expectedPrices.torta);
  assert.equal(master['tortas.torta1'].preco, expectedPrices.torta);
  assert.equal(raw.milkshake.adicional_ovomaltine, 3);
});

test('adaptador do catálogo mestre substitui projeções antigas em todas as telas de produtos', () => {
  const stale = JSON.parse(JSON.stringify(raw));
  stale.milkshake.tradicional['300ml'] = 1;
  stale.isopores_viagem['7 Bolas'] = 1;
  stale.caixas_viagem['5 Litros (2 sabores)'] = 1;
  stale.caixas_enc.find((item) => item.id === 'cx5l_2s').preco = 1;
  stale.sobremesas['Torta de Sorvete'] = 1;
  stale.tortas_enc[0].preço = 1;

  const view = createAdapter().aplicar(stale);
  assert.equal(view.milkshake.tradicional['300ml'], 18);
  assert.equal(view.isopores_viagem['7 Bolas'], 35);
  assert.equal(view.caixas_viagem['5 Litros (2 sabores)'], 115);
  assert.equal(view.caixas_enc.find((item) => item.id === 'cx5l_2s').preco, 115);
  assert.equal(view.sobremesas['Torta de Sorvete'], 110);
  assert.equal(view.tortas_enc[0].preco, 110);
});

test('salvar preços no painel atualiza o cadastro mestre e as projeções relacionadas', () => {
  const syncPrices = evaluateAdminHelper(
    adminSource,
    'function sincronizarPrecosCatalogoMestre(prod){',
    'async function salvarPreços()',
    'sincronizarPrecosCatalogoMestre'
  );
  const changed = JSON.parse(JSON.stringify(raw));
  changed.milkshake.tradicional['300ml'] = 19;
  changed.isopores_viagem['7 Bolas'] = 36;
  changed.caixas_viagem['5 Litros (2 sabores)'] = 116;
  changed.sobremesas['Torta de Sorvete'] = 111;
  syncPrices(changed);

  assert.equal(changed.cadastro_skus.por_chave['milkshake.tradicional.300ml'].preco, 19);
  assert.equal(changed.cadastro_skus.por_chave['isopores.7_bolas'].preco, 36);
  assert.equal(changed.cadastro_skus.por_chave['caixas.cx5l_2s'].preco, 116);
  assert.equal(changed.cadastro_skus.por_chave['caixas.cx5l'].preco_2sabores, 116);
  assert.equal(changed.caixas_enc.find((item) => item.id === 'cx5l_2s').preco, 116);
  assert.equal(changed.cadastro_skus.por_chave['sobremesas.1'].preco, 111);
  assert.equal(changed.cadastro_skus.por_chave['tortas.torta1'].preco, 111);
  assert.equal(createAdapter().aplicar(changed).milkshake.tradicional['300ml'], 19);
});

test('editor de SKUs sincroniza variantes relacionadas antes de publicar', () => {
  const state = JSON.parse(JSON.stringify(raw.cadastro_skus.por_chave));
  const syncLinkedPrices = evaluateAdminHelper(
    skuAdminSource,
    'function syncLinkedPriceRecords(key,value){',
    'function updateRecord(input)',
    'syncLinkedPriceRecords',
    { master: () => state }
  );
  syncLinkedPrices('tortas.torta1', 112);
  syncLinkedPrices('caixas.cx10l_2s', 167);

  assert.equal(state['sobremesas.1'].preco, 112);
  assert.equal(state['tortas.torta1'].preco, 112);
  assert.equal(state['caixas.cx10l_2s'].preco, 167);
  assert.equal(state['caixas.cx10l'].preco_2sabores, 167);
  assert.equal(state['caixas.cx10l'].preco, 165);
});

test('FAQ, página inicial e painel administrativo mostram os novos valores', () => {
  const menuAnswer = faqMenu.perguntas.find((item) => item.tags.includes('milkshake'))?.resposta || '';
  const isoporAnswer = faqMenu.perguntas.find((item) => item.tags.includes('isopor'))?.resposta || '';
  assert.match(menuAnswer, /300ml R\$ 18.*400ml R\$ 22.*500ml R\$ 24.*750ml R\$ 30/i);
  assert.match(menuAnswer, /360ml R\$ 22.*600ml R\$ 26/i);
  assert.match(isoporAnswer, /4 bolas R\$25.*7 bolas R\$35.*9 bolas R\$45.*12 bolas R\$55/i);
  assert.ok(faqOrders.perguntas.some((item) => /Caixa 5 Litros: 2 sabores R\$ 115,00/.test(item.resposta)));
  assert.ok(faqOrders.perguntas.some((item) => /Caixa 10 Litros: 2 sabores R\$ 165,00/.test(item.resposta)));
  assert.ok(faqOrders.perguntas.some((item) => /Torta de Sorvete R\$ 110,00/.test(item.resposta)));
  assert.ok(indexSource.includes('7 Bolas: R$ 35.00'));
  assert.ok(indexSource.includes('Torta de Sorvete: R$ 110.00'));
  assert.ok(indexSource.includes('A partir de R$ 18,00'));
  assert.ok(botSource.includes('Milkshakes a partir de R$ 18,00'));
  assert.ok(botSource.includes('Torta de Sorvete R$ 110 (at'));
  assert.ok(botSource.includes('Caixa 5L a partir de R$ 115'));
  assert.ok(botSource.includes('Caixa 10L a partir de R$ 165'));
  assert.ok(botSource.includes('7 bolas (R$ 35), 9 bolas (R$ 45), 12 bolas (R$ 55)'));
  assert.ok(botSource.includes('400ml R$ 22'));
  assert.ok(botSource.includes('500ml R$ 24'));
  assert.ok(botSource.includes('600ml R$ 26'));
  assert.ok(ordersPageSource.includes("window.abrirSaboresSorvete('torta', TORTA_ESTOQUE.preco, TORTA_ESTOQUE.max"));
  const milkshakeSchema = schemaData.schemas.find((item) => item.name === 'Milkshake Sorvete Itapolitana');
  const tortaSchema = schemaData.schemas.find((item) => item.name === 'Torta de Sorvete Sorvete Itapolitana');
  const aggregateSchema = schemaData.schemas.find((item) => item['@type'] === 'AggregateOffer');
  assert.deepEqual(milkshakeSchema.offers.map((offer) => offer.price), ['18.00', '30.00']);
  assert.equal(tortaSchema.offers.price, '110.00');
  assert.equal(aggregateSchema.highPrice, '165.00');
  assert.ok(adminSource.includes('id="cx5l_2s_preço" value="115"'));
  assert.ok(adminSource.includes('id="cx10l_2s_preço" value="165"'));
  assert.ok(adminSource.includes('id="torta1_preço" value="110"'));
});
