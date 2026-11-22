import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const playerScript = join(root, 'scripts/itap-music-player.js');
const audioFile = join(root, 'media/audio/itapolitana-trilha-20261122.mpeg');
const swFile = join(root, 'sw.js');

const publicPages = [
  'index.html',
  '404.html',
  'offline.html',
  'encomendas.html',
  'retirada.html',
  'promocao.html',
  'sobre.html',
  'dicas.html',
  'politica-privacidade.html',
  'cardapio-acai-natureon.html',
  'carrossel.html',
  'admin-painel.html',
  'admin-catalogo.html',
  'admin-picole.html',
  'admin/index.html',
];

const defaultTag = '<script src="scripts/itap-music-player.js?v=20261122" defer></script>';
const adminTag = '<script src="../scripts/itap-music-player.js?v=20261122" defer></script>';

await access(audioFile, constants.R_OK);
await access(playerScript, constants.R_OK);

const scriptSource = await readFile(playerScript, 'utf8');
assert.match(scriptSource, /audio\.preload\s*=\s*'none'/, 'player deve manter preload none');
assert.match(scriptSource, /audio\.src\s*=\s*AUDIO_PATH/, 'player deve carregar o áudio somente sob demanda');
assert.match(scriptSource, /button\.addEventListener\('click'/, 'player deve iniciar após clique explícito');
assert.match(scriptSource, /aria-live/, 'player deve anunciar estado de forma acessível');
assert.match(scriptSource, /▶ Ouça nossa música/, 'player deve usar CTA claro para iniciar música');
assert.match(scriptSource, /⏸ Pausar música/, 'player deve usar CTA claro para pausar música');
assert.match(scriptSource, /resetSourceForRetry/, 'player deve redefinir a origem para retry');
assert.doesNotMatch(scriptSource, /__itapMusicPlayerDebug/, 'player não deve expor instrumentação debug em produção');
assert.match(scriptSource, /setInterval\(scheduleSafePlacement,\s*12000\)/, 'player deve recalcular posição sem varredura contínua');
assert.match(scriptSource, /Não foi possível/, 'player deve exibir erro visível em falhas de reprodução');
assert.doesNotMatch(scriptSource, /autoplay/i, 'player não pode usar autoplay');

const swSource = await readFile(swFile, 'utf8');
const handlers = {};
let cacheAccessed = false;
let networkFails = false;
const context = {
  URL,
  Response,
  self: { addEventListener: (name, handler) => { handlers[name] = handler; } },
  caches: { match: () => { cacheAccessed = true; throw new Error('áudio não deve usar cache'); } },
  fetch: async () => {
    if (networkFails) throw new Error('offline');
    return new Response('trecho', { status: 206 });
  },
};
vm.runInNewContext(swSource, context);
async function fetchAudio() {
  let response;
  handlers.fetch({
    request: { url: 'https://itapolitanacajuru.com.br/media/audio/itapolitana-trilha-20261122.mpeg', method: 'GET', destination: 'audio' },
    respondWith: (promise) => { response = promise; },
  });
  return await response;
}
assert.equal((await fetchAudio()).status, 206, 'áudio parcial deve passar pela rede');
networkFails = true;
assert.equal((await fetchAudio()).status, 503, 'áudio offline deve retornar erro explícito');
assert.equal(cacheAccessed, false, 'áudio não deve usar Cache Storage');

for (const page of publicPages) {
  const html = await readFile(join(root, page), 'utf8');
  const expected = page === 'admin/index.html' ? adminTag : defaultTag;
  assert.ok(
    html.includes(expected),
    `${page} deve incluir o player flutuante de música`
  );
}

console.log('✅ Music player audit passed.');
