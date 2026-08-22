import { readFileSync, writeFileSync } from 'node:fs';

const file = '/home/ubuntu/itapolitanacajuru-source/dados/produtos.json';
const data = JSON.parse(readFileSync(file, 'utf8'));
const sabores = (data.sabores_sorvete || []).map((item) => typeof item === 'string' ? item : item.nome).filter(Boolean);
if (sabores.length !== 38) throw new Error(`Foram encontrados ${sabores.length} sabores de massa; eram esperados 38.`);
data.milkshake = { ...(data.milkshake || {}), sabores, adicional_ovomaltine: 3 };
writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ sabores_milkshake: sabores.length, adicional_ovomaltine: data.milkshake.adicional_ovomaltine }, null, 2));
