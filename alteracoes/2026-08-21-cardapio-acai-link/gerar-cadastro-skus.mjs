import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const productsPath = path.join(root, 'dados', 'produtos.json');
const backupPath = path.join(here, 'produtos.json.antes-cadastro-skus');
const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

if (!fs.existsSync(backupPath)) fs.copyFileSync(productsPath, backupPath);

const registros = {};
const skus = new Set();
const keyPart = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const money = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

function cadastrar(chave, sku, produto) {
  if (registros[chave]) throw new Error(`Chave duplicada: ${chave}`);
  if (skus.has(sku)) throw new Error(`SKU duplicado: ${sku}`);
  registros[chave] = { sku, ...produto };
  skus.add(sku);
}

const formatos = {
  casquinha_copo: 'Casquinha/copo',
  copo_recheado: 'Copo recheado',
  cascão: 'Cascão',
  cestinha: 'Cestinha',
};

Object.entries(data.sorvetes?.preços || {}).forEach(([formato, tabela]) => {
  Object.entries(tabela).forEach(([tamanho, preco], index) => {
    cadastrar(`sorvetes.${formato}.${keyPart(tamanho)}`, `SVM-${formato === 'casquinha_copo' ? 'CC' : formato === 'copo_recheado' ? 'CR' : formato === 'cascão' ? 'CS' : 'CT'}-${String(index + 1).padStart(2, '0')}`, {
      categoria: 'Sorvetes de massa', nome: formatos[formato] || formato, tamanho, preco: money(preco), ativo: true,
    });
  });
});

const acai = data['açaí'] || data.acai || {};
(acai.categorias || []).forEach((categoria) => {
  if (categoria.id === 'informacoes') return;
  const grupo = categoria.id === 'milkshake' ? 'MSK' : categoria.id === 'tacas_gourmet' ? 'TCG' : keyPart(categoria.id).replace('ml', '');
  (categoria.produtos || []).forEach((produto, index) => {
    cadastrar(`acai.${categoria.id}.${index + 1}`, `ACA-${grupo}-${String(index + 1).padStart(3, '0')}`, {
      categoria: categoria.titulo, nome: produto.nome, tamanho: categoria.label || '', preco: money(produto.preco ?? produto.preço), ativo: true,
    });
  });
});

const codigoPicole = { frutas_agua: 'FRT', leite_com_recheio: 'RCH', leite_sem_recheio: 'LTS', especiais: 'ESP', esquimós: 'ESQ' };
Object.entries(data['picolés'] || {}).forEach(([tipo, produto]) => {
  const precoVarejo = money(produto.preço_varejo);
  const precoAtacado = money(produto.preço_atacado);
  cadastrar(`picoles.${tipo}`, `PCT-${codigoPicole[tipo] || keyPart(tipo).toUpperCase()}`, {
    categoria: 'Picolés', nome: produto.nome, tamanho: '1 unidade', preco: precoVarejo, preco_varejo: precoVarejo, preco_atacado: precoAtacado, quantidade_minima_atacado: 100, ativo: !produto.esgotado,
  });
  (produto.sabores || []).forEach((sabor) => {
    cadastrar(`picoles.${tipo}.${sabor.codigo}`, sabor.codigo, {
      categoria: 'Picolés', nome: sabor.nome, tamanho: '1 unidade', preco: precoVarejo, preco_varejo: precoVarejo, preco_atacado: precoAtacado, quantidade_minima_atacado: 100, ativo: !sabor.esgotado,
    });
  });
});

Object.entries(data.milkshake?.tradicional || {}).forEach(([tamanho, preco]) => cadastrar(`milkshake.tradicional.${keyPart(tamanho)}`, `MLK-TRD-${keyPart(tamanho).replace('ml', '')}`, { categoria: 'Milkshake', nome: 'Milkshake tradicional', tamanho, preco: money(preco), ativo: true }));
Object.entries(data.milkshake?.top || {}).forEach(([tamanho, preco]) => cadastrar(`milkshake.top.${keyPart(tamanho)}`, `MLK-TOP-${keyPart(tamanho).replace('ml', '')}`, { categoria: 'Milkshake', nome: 'Milkshake top', tamanho, preco: money(preco), ativo: true }));

Object.entries(data.tacas?.tradicionais || {}).forEach(([nome, preco], index) => cadastrar(`tacas.tradicionais.${index + 1}`, `TAC-TRD-${String(index + 1).padStart(3, '0')}`, { categoria: 'Taças tradicionais', nome: `Taça ${nome}`, tamanho: '', preco: money(preco), ativo: true }));
Object.entries(data.tacas?.sujas || {}).forEach(([nome, preco], index) => cadastrar(`tacas.sujas.${index + 1}`, `TAC-PRM-${String(index + 1).padStart(3, '0')}`, { categoria: 'Taças premium', nome: `Taça Suja – ${nome}`, tamanho: '', preco: money(preco), ativo: true }));
Object.entries(data.isopores_viagem || {}).forEach(([tamanho, preco]) => cadastrar(`isopores.${keyPart(tamanho)}`, `ISO-${keyPart(tamanho).replace('bolas', '').padStart(3, '0')}`, { categoria: 'Isopores para viagem', nome: `Isopore ${tamanho}`, tamanho, preco: money(preco), ativo: true }));
Object.entries(data.sobremesas || {}).forEach(([nome, preco], index) => cadastrar(`sobremesas.${index + 1}`, `SOB-${String(index + 1).padStart(3, '0')}`, { categoria: 'Sobremesas', nome, tamanho: '', preco: money(preco), ativo: true }));
(data.caixas_enc || []).forEach((produto) => cadastrar(`caixas.${produto.id}`, `CAX-${String(produto.id).replace(/^cx/i, '').toUpperCase()}`, { categoria: 'Caixas para encomenda', nome: produto.nome, tamanho: '', preco: money(produto.preço), ativo: !produto.esgotado }));
(data.tortas_enc || []).forEach((produto, index) => cadastrar(`tortas.${produto.id}`, `TOR-${String(index + 1).padStart(3, '0')}`, { categoria: 'Tortas por encomenda', nome: produto.nome, tamanho: '', preco: money(produto.preço), ativo: !produto.esgotado }));
(data.acrescimos || []).forEach((produto, index) => cadastrar(`acrescimos.${produto.id}`, `ACR-${String(index + 1).padStart(3, '0')}`, { categoria: 'Acréscimos', nome: produto.nome, tamanho: '', preco: money(produto.preço), ativo: !produto.esgotado }));
(data.sabores_sorvete || []).forEach((sabor) => cadastrar(`massas.${sabor.codigo}`, sabor.codigo, { categoria: 'Sabores de massa', nome: sabor.nome, tamanho: '', preco: null, ativo: !sabor.esgotado }));

data.cadastro_skus = {
  versao: 1,
  descricao: 'Cadastro único de SKU usado para identificar produtos no site, no painel e nas mensagens de pedido.',
  por_chave: registros,
};

fs.writeFileSync(productsPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Cadastro centralizado criado com ${Object.keys(registros).length} produtos e ${skus.size} SKUs únicos.`);
