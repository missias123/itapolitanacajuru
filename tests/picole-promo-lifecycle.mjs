import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const OriginalDate = Date;
let fakeNow = OriginalDate.parse('2026-08-25T14:00:02.000Z');
class TestDate extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : [fakeNow])); }
  static now() { return fakeNow; }
}

const sourcePath = new URL('../cloudflare-worker/src/index.js', import.meta.url);
let source = fs.readFileSync(sourcePath, 'utf8')
  .replace('export class PicoleReservaDO', 'class PicoleReservaDO')
  .replace('export default {', 'const defaultExport = {');
source += `\n\nglobalThis.__itapTest = { PicoleReservaDO, defaultExport, handlePicoleStatus, handlePicoleReservar, handlePicoleReservaForm, normalizarCelularPicole, gerarHorariosDiversificados, gerarCodigoRetirada, criarCampanhaPicole };\n`;
const context = vm.createContext({
  console, URL, Request, Response, Headers, crypto: webcrypto, TextEncoder, TextDecoder,
  Uint8Array, Uint32Array, ArrayBuffer, Date: TestDate, Intl, Math, JSON, String, Number,
  Boolean, Object, Array, RegExp, Error, TypeError, Promise, setTimeout, clearTimeout,
});
vm.runInContext(source, context, { filename: sourcePath.pathname });
const t = context.__itapTest;
assert.ok(t);

class MockKV {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); this.writes = []; }
  async get(key, type) {
    const value = this.map.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.writes.push({ key, value }); this.map.set(key, String(value)); }
  async list({ prefix = '' } = {}) {
    return { keys: [...this.map.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
  }
}
class MockDOState {
  constructor() { this.values = new Map(); this.lock = Promise.resolve(); }
  get storage() {
    return {
      get: async key => this.values.get(key),
      put: async (key, value) => { this.values.set(key, value); },
      delete: async key => { this.values.delete(key); },
    };
  }
  blockConcurrencyWhile(fn) {
    const run = this.lock.then(fn);
    this.lock = run.catch(() => {});
    return run;
  }
}
class MockDONamespace {
  constructor() { this.states = new Map(); }
  idFromName(name) { return name; }
  get(id) {
    if (!this.states.has(id)) {
      const state = new MockDOState();
      this.states.set(id, { state, object: new t.PicoleReservaDO(state, {}) });
    }
    return { fetch: request => this.states.get(id).object.fetch(typeof request === 'string' ? new Request(request) : request) };
  }
}
function envFor(initial = {}) {
  return {
    PROMO_KV: new MockKV(initial), RATE_KV: new MockKV(), CLIENTES_KV: new MockKV(),
    ENCOMENDAS_KV: new MockKV(), PICOLE_RESERVA_DO: new MockDONamespace(),
  };
}
function req(url, init = {}) { return new Request(url, init); }
function campaignInitial() {
  return {
    'picole:campanha': JSON.stringify({ id: 'manual-cycle-test', dataInicio: '2026-08-25', dataFim: '2026-09-23', ativo: true, pausado: false, ativacaoAdmin: true }),
    'picole:dia:2026-08-25': JSON.stringify({ id: 'manual-cycle-test-001', campanhaId: 'manual-cycle-test', dataLocal: '2026-08-25', horarioSorteado: '11:00:00', status: 'agendado', vencedorId: null }),
  };
}

// Campanha ausente: status inativo, sem criação de campanha/agenda.
{
  const env = envFor();
  const response = await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env);
  const body = await response.json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.campaign_configured, false);
  assert.equal(body.safeToAnnounce, false);
  assert.equal(env.PROMO_KV.writes.length, 0);
  assert.equal([...env.PROMO_KV.map.keys()].some(k => k.startsWith('picole:')), false);
}

// Campanha configurada, mas sem ativação explícita: nunca anuncia nem agenda timer público.
{
  const env = envFor({ 'picole:campanha': JSON.stringify({ id: 'auto', ativo: true, pausado: false, ativacaoAdmin: false }) });
  const response = await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env);
  const body = await response.json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.campaign_configured, true);
  assert.equal(body.campaign_active, false);
  assert.equal(body.activation_explicit, false);
  assert.equal(body.safeToAnnounce, false);
  assert.equal(env.PROMO_KV.writes.length, 0);
}

// Campanha pausada ou cancelada permanece inativa e explica o motivo.
{
  let env = envFor({ 'picole:campanha': JSON.stringify({ id: 'manual-pause', ativo: true, pausado: true, ativacaoAdmin: true }) });
  let response = await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env);
  let body = await response.json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.paused, true);
  assert.equal(body.campaign_active, false);
  assert.equal(body.motivo, 'campanha_pausada');

  env = envFor({ 'picole:campanha': JSON.stringify({ id: 'manual-cancel', ativo: false, pausado: false, ativacaoAdmin: true, cancelado: true }) });
  response = await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env);
  body = await response.json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.paused, false);
  assert.equal(body.campaign_active, false);
  assert.equal(body.motivo, 'campanha_cancelada');
}

// Antes, dentro e depois da janela de exatamente 5 segundos; nenhum GET grava PROMO_KV.
{
  const env = envFor(campaignInitial());
  fakeNow = OriginalDate.parse('2026-08-25T13:59:59.500Z');
  let body = await (await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env)).json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.safeToAnnounce, false);
  assert.equal(body.inicioEm, OriginalDate.parse('2026-08-25T14:00:00.000Z'));
  assert.equal(env.PROMO_KV.writes.length, 0);

  fakeNow = OriginalDate.parse('2026-08-25T14:00:02.000Z');
  body = await (await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env)).json();
  assert.equal(body.status, 'ativo');
  assert.equal(body.campaign_active, true);
  assert.equal(body.activation_explicit, true);
  assert.equal(body.paused, false);
  assert.equal(body.schedule_created, true);
  assert.equal(body.safeToAnnounce, true);
  assert.equal(body.fimEm - body.inicioEm, 5000);
  assert.equal(env.PROMO_KV.writes.length, 0);

  fakeNow = OriginalDate.parse('2026-08-25T14:00:05.000Z');
  body = await (await t.handlePicoleStatus(req('https://api.test/api/promocao/picole/status'), env)).json();
  assert.equal(body.status, 'inativo');
  assert.equal(body.motivo, 'janela_expirada');
  assert.equal(env.PROMO_KV.writes.length, 0);
}

// Reserva fora da janela é negada sem DO; dentro da janela cria exatamente um vencedor.
{
  const env = envFor(campaignInitial());
  fakeNow = OriginalDate.parse('2026-08-25T13:59:59.000Z');
  let result = await t.handlePicoleReservar(req('https://api.test/api/promocao/picole/reservar', { method: 'POST' }), env);
  assert.equal((await result.json()).codigo, 'PROMOCAO_NAO_INICIADA');
  assert.equal(env.PROMO_KV.map.has('picole:winner:2026-08-25'), false);

  fakeNow = OriginalDate.parse('2026-08-25T14:00:02.000Z');
  result = await t.handlePicoleReservar(req('https://api.test/api/promocao/picole/reservar', { method: 'POST', headers: { 'X-Idempotency-Key': 'tentativa-test-000001' } }), env);
  const winner = await result.json();
  assert.equal(winner.sucesso, true);
  assert.ok(winner.reservaId);
  const reservaId = winner.reservaId;
  assert.equal(env.PROMO_KV.map.get('picole:winner:2026-08-25'), reservaId);
  assert.equal((await env.PROMO_KV.get('picole:dia:2026-08-25', 'json')).status, 'reservado');

  // Formulário com DDD externo é rejeitado antes do DO confirmar preenchimento.
  let formResponse = await t.handlePicoleReservaForm(reservaId, req('https://api.test/api/promocao/picole/reserva/' + reservaId, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Maria Teste', celular: '11999990000', aceiteTermos: true, aceiteLGPD: true }),
  }), env);
  assert.equal((await formResponse.json()).sucesso, false);

  formResponse = await t.handlePicoleReservaForm(reservaId, req('https://api.test/api/promocao/picole/reserva/' + reservaId, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Maria Teste', celular: '(16) 99999-0000', aceiteTermos: true, aceiteLGPD: true }),
  }), env);
  const filled = await formResponse.json();
  assert.equal(filled.sucesso, true);
  assert.match(filled.codigoRetirada, /^ITP-2026-20260825-[A-Z0-9]{8}$/);

  // Repetição do formulário é idempotente e devolve o mesmo código.
  formResponse = await t.handlePicoleReservaForm(reservaId, req('https://api.test/api/promocao/picole/reserva/' + reservaId, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Outro Nome', celular: '(16) 98888-0000', aceiteTermos: true, aceiteLGPD: true }),
  }), env);
  const repeated = await formResponse.json();
  assert.equal(repeated.sucesso, true);
  assert.equal(repeated.codigoRetirada, filled.codigoRetirada);
  assert.notEqual(repeated.codigoRetirada, 'OUTRO');

  const invalidReservation = await t.handlePicoleReservaForm('reserva-inexistente', req('https://api.test/api/promocao/picole/reserva/reserva-inexistente', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Teste Falso', celular: '(16) 99999-0000', aceiteTermos: true, aceiteLGPD: true }),
  }), env);
  assert.equal((await invalidReservation.json()).sucesso, false);
}

// Campanha cancelada não pode ser retomada; é preciso criar um novo ciclo.
{
  const env = envFor(campaignInitial());
  env.ADMIN_SECRET = 'admin-secret';
  let response = await t.defaultExport.fetch(req('https://api.test/api/admin/promocao/picole/campanha', {
    method: 'DELETE',
    headers: { 'X-Itap-Admin-Secret': 'admin-secret' },
  }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);

  response = await t.defaultExport.fetch(req('https://api.test/api/admin/promocao/picole/retomar', {
    method: 'POST',
    headers: { 'X-Itap-Admin-Secret': 'admin-secret', 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }), env);
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.ok, false);
  assert.equal(body.nextStep, 'criar_nova_campanha');
  assert.match(body.error, /nova campanha/i);
  const campanha = await env.PROMO_KV.get('picole:campanha', 'json');
  assert.equal(campanha.ativo, false);
  assert.equal(campanha.cancelado, true);
  assert.equal(campanha.pausado, false);
}

// Manual helper remains explicit and creates 30 dates with 30 seconds exact distinct.
{
  const env = envFor();
  const created = await t.criarCampanhaPicole({ PROMO_KV: env.PROMO_KV }, { dataInicio: '2026-08-25', origem: 'manual' });
  assert.equal(created.campanha.ativacaoAdmin, true);
  assert.equal(created.dias.length, 30);
  const values = [...env.PROMO_KV.map.entries()].filter(([k]) => k.startsWith('picole:dia:')).map(([, v]) => JSON.parse(v).horarioSorteado);
  assert.equal(new Set(values).size, 30);
  assert.equal(t.gerarCodigoRetirada('abc12345', '2026-08-25'), 'ITP-2026-20260825-ABC12345');
}

assert.equal(t.normalizarCelularPicole('(16) 99999-0000'), '16999990000');
assert.equal(t.normalizarCelularPicole('(11) 99999-0000'), null);
console.log('PASS: lifecycle isolado — status sem mutação, ativação explícita, janela de 5s, reserva, DDD 16, formulário idempotente, código e expiração.');
