import { readFileSync, writeFileSync } from 'node:fs';

const root = '/home/ubuntu/itapolitanacajuru-source';
const data = JSON.parse(readFileSync(`${root}/dados/produtos.json`, 'utf8'));
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const rows = Object.values(data.cadastro_skus?.por_chave || {})
  .filter((item) => !Array.isArray(item.ingredientes) || item.ingredientes.length === 0)
  .filter((item) => !String(item.descricao || '').trim())
  .map((item) => ({
    sku: item.sku || '',
    categoria: item.categoria || 'Sem categoria',
    produto: item.nome || '',
    tamanho: item.tamanho || '',
    preco: Number(item.preco || 0),
    ativo: item.ativo !== false ? 'Ativo' : 'Inativo'
  }))
  .sort((a, b) => collator.compare(a.categoria, b.categoria) || a.preco - b.preco || collator.compare(a.produto, b.produto) || collator.compare(a.sku, b.sku));

const escape = (value) => String(value || '—').split('|').join('\\|');
const markdown = [
  '# SKUs de produtos sem descrição ou ingredientes',
  '',
  `**Total para completar:** ${rows.length} SKUs. Esta lista não altera preços, disponibilidade ou produtos.`,
  '',
  '| SKU | Categoria | Produto | Tamanho | Preço atual do site | Situação |',
  '|---|---|---|---|---:|---|',
  ...rows.map((row) => `| ${escape(row.sku)} | ${escape(row.categoria)} | ${escape(row.produto)} | ${escape(row.tamanho)} | ${currency.format(row.preco)} | ${row.ativo} |`)
].join('\n');

writeFileSync(`${root}/alteracoes/2026-08-21-cardapio-acai-link/skus-sem-descricao.md`, `${markdown}\n`);
writeFileSync(`${root}/alteracoes/2026-08-21-cardapio-acai-link/skus-sem-descricao.json`, `${JSON.stringify({ total: rows.length, skus: rows }, null, 2)}\n`);
console.log(JSON.stringify({ total: rows.length, arquivo: 'skus-sem-descricao.md' }, null, 2));
