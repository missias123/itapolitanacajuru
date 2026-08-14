import fs from 'node:fs';
import vm from 'node:vm';

const root = '/home/ubuntu/itapolitanacajuru';
const engineCode = fs.readFileSync(`${root}/scripts/ita-bot-engine.js`, 'utf8');
const prodData = JSON.parse(fs.readFileSync(`${root}/dados/produtos.json`, 'utf8'));
const sandbox = { console, setTimeout, window: {} };
sandbox.window = sandbox;
vm.runInNewContext(engineCode, sandbox, { filename: 'ita-bot-engine.js' });
const engine = sandbox.ItaBotEngine.createEngine();
engine.loadData(prodData, null);

const queries = [
  'picole',
  'picolé',
  'picolés',
  'picolé de uva',
  'picole de Leite Ninho',
  'picolé esquimó',
  'quero saber sobre sorvetes',
  'milk shake',
  'açaí',
  'encomenda',
  'sabores'
];
let failed = 0;
for (const query of queries) {
  const response = engine.getResponse(query);
  const answer = response && response.answer ? response.answer : '[sem resposta]';
  const ok = Boolean(response && (response.answer || response.__async));
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK' : 'FALHA'} | ${query} | ${answer.split('\n')[0]}`);
}
if (failed) process.exit(1);
