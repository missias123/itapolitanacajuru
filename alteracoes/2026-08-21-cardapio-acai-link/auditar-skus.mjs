import fs from 'node:fs';

const arquivo = new URL('../../dados/produtos.json', import.meta.url);
const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const itens = Object.values(dados.cadastro_skus?.por_chave || {});
const categorias = itens.reduce((resultado, item) => {
  const categoria = item.categoria || 'Sem categoria';
  resultado[categoria] = (resultado[categoria] || 0) + 1;
  return resultado;
}, {});
const skus = itens.map((item) => item.sku).filter(Boolean);
const duplicados = skus.filter((sku, indice) => skus.indexOf(sku) !== indice);
const ativos = itens.filter((item) => item.ativo === true).length;

console.log(JSON.stringify({
  total_produtos_com_sku: itens.length,
  total_skus_preenchidos: skus.length,
  total_ativos: ativos,
  total_skus_duplicados: [...new Set(duplicados)].length,
  por_categoria: Object.fromEntries(Object.entries(categorias).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')))
}, null, 2));
