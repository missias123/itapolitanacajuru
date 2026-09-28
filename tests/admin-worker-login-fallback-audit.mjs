import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const adminPanel = await readFile(join(root, 'admin-painel.html'), 'utf8');

assert.ok(adminPanel.includes('globalThis.ITAP_WORKER_API'), 'admin-painel deve aceitar override explícito da base do Worker');
assert.ok(adminPanel.includes('window.ITAP_WORKER_API'), 'admin-painel deve aceitar override via window da base do Worker');
assert.ok(adminPanel.includes('window.location?.origin'), 'admin-painel deve considerar fallback same-origin para o Worker');
assert.ok(adminPanel.includes("'/api/admin/session'"), 'admin-painel deve tentar a rota principal de login admin');
assert.ok(adminPanel.includes("'/api/admin/auth'"), 'admin-painel deve manter o alias legado de login admin');

console.log('✅ Admin worker login fallback audit passed.');
