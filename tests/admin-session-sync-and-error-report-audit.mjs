import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const adminCatalog = await fs.readFile(path.join(root, 'admin-catalogo.html'), 'utf8');
const adminPainel = await fs.readFile(path.join(root, 'admin-painel.html'), 'utf8');
const worker = await fs.readFile(path.join(root, 'cloudflare-worker/src/index.js'), 'utf8');

assert(/WORKER_SESSION_SYNC_KEY\s*=\s*['"]itap_worker_session_sync['"]/.test(adminCatalog), 'admin-catalogo: chave de sync entre abas ausente');
assert(/addEventListener\(\s*['"]storage['"]/.test(adminCatalog), 'admin-catalogo: listener storage para sync de sessão ausente');
assert(/\/api\/admin\/error-report/.test(adminCatalog), 'admin-catalogo: envio de error-report ausente');

assert(/WORKER_SESSION_SYNC_KEY\s*=\s*['"]itap_worker_session_sync['"]/.test(adminPainel), 'admin-painel: chave de sync entre abas ausente');
assert(/publishWorkerSessionTokenSync\s*\(/.test(adminPainel), 'admin-painel: publicação de sync de sessão ausente');
assert(/\/api\/admin\/error-report/.test(adminPainel), 'admin-painel: envio de error-report ausente');

assert(/path\s*===\s*['"]\/api\/admin\/error-report['"]/.test(worker), 'worker: rota de error-report ausente');
assert(/handleAdminErrorReport/.test(worker), 'worker: handler de error-report ausente');

console.log('✅ Admin session sync + error-report audit passed.');
