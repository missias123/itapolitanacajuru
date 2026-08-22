import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const raiz = new URL('../../', import.meta.url);
const dados = JSON.parse(await readFile(new URL('dados/produtos.json', raiz), 'utf8'));
const codigoAdaptador = await readFile(new URL('scripts/catalogo-mestre.js', raiz), 'utf8');

function aplicar(raw) {
  const window = {};
  vm.runInNewContext(codigoAdaptador, { window, console });
  return window.ITAP_CATALOGO_MESTRE.aplicar(raw);
}

const mestre = dados.cadastro_skus.por_chave;
const registros = Object.values(mestre);
const problemas = [];

if (registros.length !== 199) problemas.push(`Esperados 199 SKUs vendáveis; encontrados ${registros.length}.`);
if (new Set(registros.map((item) => item.sku)).size !== registros.length) problemas.push('Há SKU duplicado no cadastro mestre.');

for (const embalagem of Object.values(dados.disponibilidade.embalagens || {})) {
  for (const sku of embalagem.dependencias_sku || []) {
    if (!registros.some((item) => item.sku === sku)) problemas.push(`${embalagem.sku} aponta para SKU ausente: ${sku}.`);
  }
}

const cenárioEmbalagem = structuredClone(dados);
cenárioEmbalagem.disponibilidade.embalagens['EMB-5L'].ativo = false;
const visaoEmbalagem = aplicar(cenárioEmbalagem);
const caixas5L = (visaoEmbalagem.caixas_enc || []).filter((item) => /^cx5l_/.test(item.id));
if (!caixas5L.length || !caixas5L.every((item) => item.esgotado === true)) problemas.push('EMB-5L não bloqueou todas as caixas de 5 L.');

const cenárioSabor = structuredClone(dados);
cenárioSabor.cadastro_skus.por_chave['massas.MAS-001'].ativo = false;
const visaoSabor = aplicar(cenárioSabor);
const sabor001 = (visaoSabor.sabores_sorvete || []).find((item) => item.codigo === 'MAS-001');
if (!sabor001 || sabor001.esgotado !== true) problemas.push('MAS-001 não bloqueou somente o sabor correspondente.');

const cenárioAcai = structuredClone(dados);
cenárioAcai.cadastro_skus.por_chave['acai.250ml.1'].ativo = false;
const visaoAcai = aplicar(cenárioAcai);
const acai250 = (visaoAcai.acai?.categorias || []).find((categoria) => categoria.id === '250ml');
if (!acai250?.produtos?.[0] || acai250.produtos[0].esgotado !== true) problemas.push('O SKU fechado do copo de açaí não bloqueou somente o copo correspondente.');

if (problemas.length) {
  console.error(JSON.stringify({ aprovado: false, problemas }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  aprovado: true,
  skus_vendaveis: registros.length,
  sabores_massa: dados.sabores_sorvete.length,
  embalagens: Object.keys(dados.disponibilidade.embalagens),
  cenarios: ['embalagem 5 L bloqueia caixas 5 L', 'sabor MAS-001 bloqueia somente o sabor', 'SKU de açaí bloqueia somente o copo fechado']
}, null, 2));
