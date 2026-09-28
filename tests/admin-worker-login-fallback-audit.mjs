import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const adminPanel = await readFile(join(root, 'admin-painel.html'), 'utf8');

assert.match(adminPanel, /globalThis\.ITAP_WORKER_API\|\|window\.ITAP_WORKER_API/, 'admin-painel deve aceitar override explícito da base do Worker');
assert.match(adminPanel, /window\.location\?\.origin/, 'admin-painel deve considerar fallback same-origin para o Worker');
assert.match(adminPanel, /const sessionPaths=\['\/api\/admin\/session','\/api\/admin\/auth'\]/, 'admin-painel deve tentar a rota principal e o alias legado de login admin');

console.log('✅ Admin worker login fallback audit passed.');
