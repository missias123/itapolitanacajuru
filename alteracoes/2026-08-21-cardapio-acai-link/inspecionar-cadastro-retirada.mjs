import fs from 'node:fs';

const arquivo = new URL('../../dados/produtos.json', import.meta.url);
const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const itens = Object.values(dados.cadastro_skus?.por_chave || {});
const porCategoria = itens.reduce((resultado, item) => {
  const categoria = item.categoria || 'Sem categoria';
  if (!resultado[categoria]) resultado[categoria] = [];
  resultado[categoria].push({
    sku: item.sku,
    nome: item.nome,
    tamanho: item.tamanho,
    preco: item.preco
  });
  return resultado;
}, {});

console.log(JSON.stringify(Object.fromEntries(
  Object.entries(porCategoria).map(([categoria, lista]) => [categoria, {
    quantidade: lista.length,
    exemplos: lista.slice(0, 3)
  }])
), null, 2));
