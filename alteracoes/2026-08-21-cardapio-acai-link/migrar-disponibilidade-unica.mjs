import { readFile, writeFile } from 'node:fs/promises';

const raiz = new URL('../../', import.meta.url);
const arquivo = new URL('dados/produtos.json', raiz);
const dados = JSON.parse(await readFile(arquivo, 'utf8'));
const mestre = dados.cadastro_skus?.por_chave;

if (!mestre) throw new Error('cadastro_skus.por_chave não encontrado.');

const configuracaoEmbalagens = [
  {
    sku: 'EMB-5L',
    nome: 'Embalagem Caixa 5 Litros',
    dependencias: ['caixas.cx5l_2s', 'caixas.cx5l_3s'],
  },
  {
    sku: 'EMB-10L',
    nome: 'Embalagem Caixa 10 Litros',
    dependencias: ['caixas.cx10l_2s', 'caixas.cx10l_3s'],
  },
  {
    sku: 'EMB-7B',
    nome: 'Embalagem Isopor 7 Bolas',
    dependencias: ['isopores.7_bolas'],
  },
  {
    sku: 'EMB-9B',
    nome: 'Embalagem Isopor 9 Bolas',
    dependencias: ['isopores.9_bolas'],
  },
  {
    sku: 'EMB-12B',
    nome: 'Embalagem Isopor 12 Bolas',
    dependencias: ['isopores.12_bolas'],
  },
];

const embalagens = {};
for (const embalagem of configuracaoEmbalagens) {
  const dependenciasSku = embalagem.dependencias.map((chave) => {
    if (!mestre[chave]?.sku) throw new Error(`SKU dependente ausente: ${chave}`);
    mestre[chave].dependencias_embalagem = [embalagem.sku];
    return mestre[chave].sku;
  });

  embalagens[embalagem.sku] = {
    sku: embalagem.sku,
    nome: embalagem.nome,
    tipo: 'embalagem_operacional',
    ativo: dados.disponibilidade?.embalagens?.[embalagem.sku]?.ativo !== false,
    dependencias_sku: dependenciasSku,
  };
}

dados.cadastro_skus.versao = Math.max(Number(dados.cadastro_skus.versao || 1), 2);
dados.disponibilidade = {
  versao: 1,
  descricao: 'Fonte única de disponibilidade do site. Produtos e sabores usam ativo no SKU oficial; embalagens operacionais usam este bloco e bloqueiam seus SKUs dependentes.',
  regras: {
    produto: 'O produto fica indisponível quando seu SKU ativo for falso ou quando alguma embalagem dependente estiver inativa.',
    sabor_massa: 'O sabor de massa fica indisponível somente quando o SKU MAS correspondente estiver inativo.',
    picole: 'O sabor de picolé fica indisponível somente quando seu SKU PIC correspondente estiver inativo.',
    acai: 'Cada copo de açaí é um produto fechado e fica indisponível somente quando seu próprio SKU estiver inativo.',
  },
  embalagens,
};

await writeFile(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
console.log(JSON.stringify({
  versao_catalogo: dados.cadastro_skus.versao,
  embalagens: Object.keys(embalagens),
  dependencias: Object.fromEntries(Object.entries(embalagens).map(([sku, item]) => [sku, item.dependencias_sku])),
}, null, 2));
