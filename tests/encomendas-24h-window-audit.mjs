import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'scripts', 'horario-pedidos.js'), 'utf8');

function loadHorarioApi() {
  const appended = [];
  const context = {
    URLSearchParams,
    location: { search: '', hash: '', hostname: 'itapolitanacajuru.com.br' },
    document: {
      head: { appendChild(node) { appended.push(node); } },
      body: { appendChild() {} },
      createElement() { return { style: {}, setAttribute() {}, appendChild() {}, hidden: false, textContent: '' }; },
      querySelectorAll() { return []; },
      getElementById() { return null; },
      addEventListener() {},
    },
    window: { dispatchEvent() {}, addEventListener() {} },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
    setInterval() {},
    clearTimeout() {},
    setTimeout() { return 0; },
    Intl,
    Date,
    console,
  };
  context.window.document = context.document;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.ItapHorarioPedidos;
}

const horario = loadHorarioApi();

for (const iso of [
  '2026-09-03T00:05:00-03:00',
  '2026-09-03T09:59:00-03:00',
  '2026-09-03T10:00:00-03:00',
  '2026-09-03T20:01:00-03:00',
  '2026-09-03T23:59:00-03:00',
  '2026-09-06T14:30:00-03:00',
]) {
  assert.equal(
    horario.estaAberto('encomendas', new Date(iso)),
    true,
    `Encomendas deveria ficar disponível 24h em ${iso}`,
  );
}

assert.equal(
  horario.textoAviso('encomendas'),
  'Encomendas disponíveis 24 horas por dia.',
  'Mensagem de Encomendas deve informar disponibilidade contínua.',
);

for (const [iso, expected] of [
  ['2026-09-04T09:59:00-03:00', false],
  ['2026-09-04T10:00:00-03:00', true],
  ['2026-09-04T20:00:00-03:00', true],
  ['2026-09-04T20:01:00-03:00', false],
  ['2026-09-05T11:00:00-03:00', false],
]) {
  assert.equal(
    horario.estaAberto('retirada', new Date(iso)),
    expected,
    `Retirada deveria preservar sua janela original em ${iso}`,
  );
}

console.log(JSON.stringify({ pass: true, checked: 'encomendas-24h-window' }));
