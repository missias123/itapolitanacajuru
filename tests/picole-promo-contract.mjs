import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const sourcePath = new URL('../cloudflare-worker/src/index.js', import.meta.url);
let source = fs.readFileSync(sourcePath, 'utf8')
  .replace('export class PicoleReservaDO', 'class PicoleReservaDO')
  .replace('export default {', 'const defaultExport = {');
source += `\n\nglobalThis.__itapTest = { PicoleReservaDO, defaultExport, handlePicoleStatus, handlePicoleReservar, handlePicoleReservaForm, normalizarCelularPicole, gerarHorariosDiversificados, criarCampanhaPicole };\n`;

const context = vm.createContext({
  console,
  URL,
  Request,
  Response,
  Headers,
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  ArrayBuffer,
  Uint8Array,
  Uint32Array,
  Date,
  Intl,
  Math,
  JSON,
  String,
  Number,
  Boolean,
  Object,
  Array,
  RegExp,
  Error,
  TypeError,
  Promise,
  setTimeout,
  clearTimeout,
});
vm.runInContext(source, context, { filename: sourcePath.pathname });
const t = context.__itapTest;
assert.ok(t, 'helpers do Worker não foram expostos no harness');

class MockKV {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial));
    this.writes = [];
  }
  async get(key, type) {
    const value = this.map.get(key);
    if (value === undefined) return null;
    if (type === 'json') return JSON.parse(value);
    return value;
  }
  async put(key, value) {
    this.writes.push({ key, value });
    this.map.set(key, String(value));
  }
  async list({ prefix = '' } = {}) {
    return { keys: [...this.map.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
  }
}

function makeRateKV() {
  return new MockKV();
}
function makeEnv(promo, doNamespace = null) {
  return {
    PROMO_KV: promo,
    RATE_KV: makeRateKV(),
    CLIENTES_KV: new MockKV(),
    ENCOMENDAS_KV: new MockKV(),
    PICOLE_RESERVA_DO: doNamespace,
  };
}

function request(url, init = {}) {
  return new Request(url, init);
}

// 1) GET público não pode criar campanha nem gravar dia/estado.
{
  const promo = new MockKV({
    'picole:campanha': JSON.stringify({
      id: 'auto-sem-ativacao', dataInicio: '2026-08-25', dataFim: '2026-09-23',
      ativo: true, pausado: false, origem: 'auto', ativacaoAdmin: false,
    }),
  });
  const env = makeEnv(promo);
  const response = await t.defaultExport.fetch(request('https://api.test/api/promocao/picole/status'), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'inativo');
  assert.equal(body.campaign_configured, true);
  assert.equal(body.campaign_active, false);
  assert.equal(body.activation_explicit, false);
  assert.equal(body.safeToAnnounce, false);
  assert.equal(promo.writes.length, 0, 'GET escreveu no PROMO_KV');
  assert.equal([...promo.map.keys()].some(k => k.startsWith('picole:dia:')), false, 'GET criou agenda');
}

// 2) Celular: somente DDD 16 + celular com 9 na frente; DDDs externos rejeitados.
assert.equal(t.normalizarCelularPicole('(16) 99999-0000'), '16999990000');
assert.equal(t.normalizarCelularPicole('11999990000'), null);
assert.equal(t.normalizarCelularPicole('(16) 8888-0000'), null);

// 3) Geração: 30 segundos exatos distintos; a faixa 11:00:00–19:59:59 é respeitada.
{
  const horarios = t.gerarHorariosDiversificados(30);
  assert.equal(horarios.length, 30);
  assert.equal(new Set(horarios).size, 30, 'horários repetidos no ciclo');
  for (const h of horarios) assert.match(h, /^(1[1-9]):[0-5]\d:[0-5]\d$/);
}

// 4) DO: 100 concorrentes -> 1 vencedor; mesma chave retorna o mesmo vencedor;
// segundo envio do formulário retorna o mesmo código.
{
  const storage = new Map();
  let lock = Promise.resolve();
  const state = {
    storage: {
      get: async k => storage.get(k),
      put: async (k, v) => { storage.set(k, v); },
      delete: async k => { storage.delete(k); },
    },
    blockConcurrencyWhile: fn => {
      const run = lock.then(fn);
      lock = run.catch(() => {});
      return run;
    },
  };
  const obj = new t.PicoleReservaDO(state, {});
  const calls = await Promise.all(Array.from({ length: 100 }, (_, i) => obj.fetch(
    request(`https://do.test/picole?action=reservar&reservaId=reserva-${i}&idempotencyKey=chave-${String(i).padStart(16, '0')}`)
  ).then(r => r.json())));
  assert.equal(calls.filter(x => x.ganhou === true).length, 1);
  assert.equal(calls.filter(x => x.ganhou === false).length, 99);
  const winner = calls.find(x => x.ganhou === true).reservaId;
  const winnerIndex = Number(winner.split('-')[1]);
  const winnerKey = `chave-${String(winnerIndex).padStart(16, '0')}`;
  const retry = await (await obj.fetch(request(`https://do.test/picole?action=reservar&reservaId=outro&idempotencyKey=${winnerKey}`))).json();
  // A chamada acima usa a chave do índice vencedor; ela deve ser idempotente.
  assert.equal(retry.ganhou, true);
  assert.equal(retry.idempotente, true);
  assert.equal(retry.reservaId, winner);
  const codigo = 'ITP-2026-0825-ABC12345';
  const first = await (await obj.fetch(request(`https://do.test/picole?action=preencherFormulario&reservaId=${winner}&codigoRetirada=${codigo}`))).json();
  const second = await (await obj.fetch(request(`https://do.test/picole?action=preencherFormulario&reservaId=${winner}&codigoRetirada=OUTRO`))).json();
  assert.equal(first.ok, true);
  assert.equal(first.jaPreenchido, false);
  assert.equal(second.ok, true);
  assert.equal(second.jaPreenchido, true);
  assert.equal(second.codigoRetirada, codigo);
}

// 5) Criar campanha pelo helper manual marca ativação explícita; o teste usa KV isolado.
{
  const promo = new MockKV();
  const result = await t.criarCampanhaPicole({ PROMO_KV: promo }, { dataInicio: '2026-08-25', origem: 'manual' });
  assert.equal(result.ok, true);
  assert.equal(result.campanha.ativacaoAdmin, true);
  assert.equal(result.campanha.ativo, true);
  assert.equal(result.dias.length, 30);
  assert.equal(new Set(result.dias.map(x => x.dataLocal)).size, 30);
}

console.log('PASS: contrato isolado do Picolé — GET sem escrita, DDD 16, horários distintos, 100 concorrentes, idempotência e campanha manual explícita.');
