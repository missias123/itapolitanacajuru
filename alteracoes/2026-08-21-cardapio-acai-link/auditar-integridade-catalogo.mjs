import { readFile } from 'node:fs/promises';

const raiz = new URL('../../', import.meta.url);
const ler = (arquivo) => readFile(new URL(arquivo, raiz), 'utf8');
const dados = JSON.parse(await ler('dados/produtos.json'));
const [index, retirada, retiradaControlador, encomendas, products] = await Promise.all([
  ler('index.html'),
  ler('retirada.html'),
  ler('scripts/retirada.js'),
  ler('encomendas.html'),
  ler('scripts/products.js')
]);

const registros = Object.entries(dados.cadastro_skus?.por_chave || {}).map(([chave, produto]) => ({ chave, ...produto }));
const skuVazios = registros.filter((produto) => !String(produto.sku || '').trim());
const vistos = new Map();
for (const produto of registros) {
  const lista = vistos.get(produto.sku) || [];
  lista.push(produto.chave);
  vistos.set(produto.sku, lista);
}
const duplicados = [...vistos.entries()].filter(([, chaves]) => chaves.length > 1).map(([sku, chaves]) => ({ sku, chaves }));
const dependenciasAusentes = [];
for (const embalagem of Object.values(dados.disponibilidade?.embalagens || {})) {
  for (const sku of embalagem.dependencias_sku || []) {
    if (!registros.some((produto) => produto.sku === sku)) dependenciasAusentes.push({ embalagem: embalagem.sku, sku });
  }
}

const fontesAtivas = {
  index_carrega_catalogo_mestre: /scripts\/catalogo-mestre\.js/.test(index),
  retirada_carrega_controlador_oficial: /scripts\/retirada\.js/.test(retirada),
  retirada_le_base_oficial: /fetch\('dados\/produtos\.json/.test(retiradaControlador),
  encomendas_carrega_catalogo_mestre: /scripts\/catalogo-mestre\.js/.test(encomendas),
  carregador_produtos_le_base_oficial: /fetch\('dados\/produtos\.json/.test(products)
};

const resultado = {
  aprovado: registros.length === 198 && skuVazios.length === 0 && duplicados.length === 0 && dependenciasAusentes.length === 0 && Object.values(fontesAtivas).every(Boolean),
  skus_oficiais: registros.length,
  sku_sem_valor: skuVazios,
  skus_duplicados: duplicados,
  dependencias_de_embalagem_ausentes: dependenciasAusentes,
  fontes_ativas: fontesAtivas,
  observacao: 'A auditoria de links renderizados é executada separadamente no navegador, porque os botões são gerados dinamicamente a partir da base oficial.'
};

console.log(JSON.stringify(resultado, null, 2));
if (!resultado.aprovado) process.exit(1);
