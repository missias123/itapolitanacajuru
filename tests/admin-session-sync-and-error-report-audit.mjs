import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const adminCatalog = await fs.readFile(path.join(root, 'admin-catalogo.html'), 'utf8');
const adminPainel = await fs.readFile(path.join(root, 'admin-painel.html'), 'utf8');
const worker = await fs.readFile(path.join(root, 'cloudflare-worker/src/index.js'), 'utf8');

assert(adminCatalog.includes("WORKER_SESSION_SYNC_KEY='itap_worker_session_sync'"), 'admin-catalogo: chave de sync entre abas ausente');
assert(adminCatalog.includes("window.addEventListener('storage'"), 'admin-catalogo: listener storage para sync de sessão ausente');
assert(adminCatalog.includes('/api/admin/error-report'), 'admin-catalogo: envio de error-report ausente');

assert(adminPainel.includes("WORKER_SESSION_SYNC_KEY='itap_worker_session_sync'"), 'admin-painel: chave de sync entre abas ausente');
assert(adminPainel.includes('publishWorkerSessionTokenSync('), 'admin-painel: publicação de sync de sessão ausente');
assert(adminPainel.includes('/api/admin/error-report'), 'admin-painel: envio de error-report ausente');

assert(worker.includes("path === '/api/admin/error-report'"), 'worker: rota de error-report ausente');
assert(worker.includes('handleAdminErrorReport'), 'worker: handler de error-report ausente');

console.log('✅ Admin session sync + error-report audit passed.');
