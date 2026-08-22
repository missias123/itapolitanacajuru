import { readFileSync, writeFileSync } from 'node:fs';

const path = '/home/ubuntu/itapolitanacajuru-source/dados/produtos.json';
const data = JSON.parse(readFileSync(path, 'utf8'));
const order = ['frutas_agua', 'leite_sem_recheio', 'leite_com_recheio', 'especiais', 'esquimós'];
const current = data['picolés'] || {};
data['picolés'] = Object.fromEntries(order.map((key) => [key, current[key]]).filter(([, value]) => value));
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ categoryOrder: Object.keys(data['picolés']), titles: Object.values(data['picolés']).map((group) => group.nome) }, null, 2));
