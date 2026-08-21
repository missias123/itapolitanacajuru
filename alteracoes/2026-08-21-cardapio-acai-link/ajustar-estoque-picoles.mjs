import fs from 'node:fs';

const path = new URL('../../dados/produtos.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
let flavors = 0;

for (const group of Object.values(data['picolés'] || {})) {
  group.estoque = 50;
  for (const flavor of group.sabores || []) {
    flavor.estoque = 50;
    flavors += 1;
  }
}

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Estoque ajustado para 50 unidades em ${flavors} sabores de picolé.`);
