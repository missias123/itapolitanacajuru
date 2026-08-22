import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const current = JSON.parse(readFileSync(new URL('../../dados/produtos.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(execFileSync('git', ['show', 'HEAD:dados/produtos.json'], { encoding: 'utf8' }));
const before = baseline.cadastro_skus.por_chave;
const after = current.cadastro_skus.por_chave;
const changedPrices = Object.keys(after).filter((key) => before[key] && before[key].preco !== after[key].preco);
const withIngredients = Object.values(after).filter((item) => Array.isArray(item.ingredientes) && item.ingredientes.length).map((item) => item.sku);

if (changedPrices.length) {
  console.error(`Preços alterados: ${changedPrices.join(', ')}`);
  process.exit(1);
}

console.log(JSON.stringify({ prices_unchanged: true, skus_with_new_ingredients: withIngredients }, null, 2));
