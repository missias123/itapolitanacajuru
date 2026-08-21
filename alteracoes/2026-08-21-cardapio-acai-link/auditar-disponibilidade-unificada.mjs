import { readFile, writeFile } from 'node:fs/promises';

const raiz = new URL('../../', import.meta.url);
const dados = JSON.parse(await readFile(new URL('dados/produtos.json', raiz), 'utf8'));
const mestre = Object.entries(dados.cadastro_skus?.por_chave || {}).map(([chave, registro]) => ({ chave, ...registro }));

const embalagemPorChave = new Map([
  ['caixas.cx5l_2s', 'EMB-5L'],
  ['caixas.cx5l_3s', 'EMB-5L'],
  ['caixas.cx10l_2s', 'EMB-10L'],
  ['caixas.cx10l_3s', 'EMB-10L'],
  ['isopores.7_bolas', 'EMB-7B'],
  ['isopores.9_bolas', 'EMB-9B'],
  ['isopores.12_bolas', 'EMB-12B'],
]);

const embalagens = [
  { sku: 'EMB-5L', nome: 'Embalagem Caixa 5 Litros', tipo: 'embalagem', dependencias: [] },
  { sku: 'EMB-10L', nome: 'Embalagem Caixa 10 Litros', tipo: 'embalagem', dependencias: [] },
  { sku: 'EMB-7B', nome: 'Embalagem Isopor 7 Bolas', tipo: 'embalagem', dependencias: [] },
  { sku: 'EMB-9B', nome: 'Embalagem Isopor 9 Bolas', tipo: 'embalagem', dependencias: [] },
  { sku: 'EMB-12B', nome: 'Embalagem Isopor 12 Bolas', tipo: 'embalagem', dependencias: [] },
];

for (const registro of mestre) {
  const embalagem = embalagemPorChave.get(registro.chave);
  if (embalagem) embalagens.find((item) => item.sku === embalagem).dependencias.push(registro.sku);
}

const produtosComSaboresMassa = mestre
  .filter((registro) => /^(sorvetes\.|isopores\.|caixas\.|tortas\.)/.test(registro.chave))
  .map((registro) => registro.sku);

const relatorio = {
  fonte: 'dados/produtos.json',
  total_skus_mestre: mestre.length,
  total_sabores_massa: (dados.sabores_sorvete || []).length,
  total_produtos_com_sabores_massa: produtosComSaboresMassa.length,
  grupos: {
    produtos_por_categoria: Object.fromEntries(Object.entries(mestre.reduce((acc, item) => {
      const categoria = item.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {})).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))),
    picoles: mestre.filter((registro) => registro.categoria === 'Picolés').length,
    acais: mestre.filter((registro) => /^acai\./.test(registro.chave)).length,
  },
  embalagens,
  regras: {
    sabores_massa: 'Aplicável apenas aos produtos configurados com escolha de sabores de massa.',
    picoles_acais: 'Controlados apenas pelo próprio SKU, sem dependência de embalagem ou sabor de massa.',
    produto_bloqueado: 'Produto indisponível se o próprio SKU estiver esgotado ou se uma embalagem dependente estiver esgotada.',
  },
};

await writeFile(new URL('auditoria-disponibilidade-unificada.json', import.meta.url), `${JSON.stringify(relatorio, null, 2)}\n`);
console.log(JSON.stringify(relatorio, null, 2));
