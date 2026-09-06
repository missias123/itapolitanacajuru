import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = '/home/runner/work/itapolitanacajuru/itapolitanacajuru';

async function read(rel) {
  return readFile(join(root, rel), 'utf8');
}

const [adminPanel, adminCatalog, workerSource] = await Promise.all([
  read('admin-painel.html'),
  read('admin-catalogo.html'),
  read('cloudflare-worker/src/index.js'),
]);

assert.equal(/senhaHash\s*===\s*STATE\.senhaAdmin/.test(adminPanel), false, 'admin-painel não pode validar senha localmente');
assert.equal(adminPanel.includes("ghGet(PATHS.auth)"), false, 'admin-painel não pode carregar hash de auth público');
assert.equal(/localStorage\.getItem\('itap_github_token'\)/.test(adminCatalog), false, 'admin-catalogo não pode persistir token GitHub em localStorage');
assert.equal(adminCatalog.includes("PIN='2046'"), false, 'admin-catalogo não pode conter PIN hardcoded');
assert.equal(adminCatalog.includes('/api/admin/github-file'), true, 'admin-catalogo deve salvar via Worker autenticado');
assert.equal(adminCatalog.includes('X-Itap-Session-Token'), true, 'admin-catalogo deve enviar token de sessão administrativa');
assert.equal(/return jsonResp\(\{ ok: true, cliente \}\)/.test(workerSource), false, 'worker não pode retornar objeto cliente no login');
assert.equal(workerSource.includes('phone: insc.phone'), false, 'worker não pode expor telefone na busca pública do sorteio');
assert.equal(workerSource.includes('created_at: insc.created_at'), false, 'worker não pode expor metadata sensível do sorteio');

console.log('✅ Security regression audit passed.');
