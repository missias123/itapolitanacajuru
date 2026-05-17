/* eslint-env node */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALLOWED_EXT = new Set(['.html', '.js']);
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'docs/relatorios/playwright-html', 'tests/test-results']);

const TOKENS = [
  /\bgithub_pat_[A-Za-z0-9_]{70,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g
];

function shouldIgnoreDir(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return [...IGNORE_DIRS].some((ignored) => normalized === ignored || normalized.startsWith(ignored + '/'));
}

function walk(dir, rel = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const relPath = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      if (shouldIgnoreDir(relPath)) continue;
      out.push(...walk(abs, relPath));
      continue;
    }
    if (ALLOWED_EXT.has(path.extname(entry.name))) out.push(abs);
  }
  return out;
}

function findHits(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hits = [];
  for (const rx of TOKENS) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(content)) !== null) {
      const before = content.slice(0, m.index);
      const line = before.split('\n').length;
      hits.push({ token: m[0], line });
    }
  }
  return hits;
}

const files = walk(ROOT);
const findings = [];

for (const filePath of files) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const hits = findHits(filePath);
  hits.forEach((hit) => findings.push({ file: rel, ...hit }));
}

if (findings.length > 0) {
  console.error('❌ BLOQUEADO: token real do GitHub encontrado em código');
  findings.forEach((f) => {
    const masked = f.token.slice(0, 8) + '...' + f.token.slice(-4);
    console.error(`- ${f.file}:${f.line} (${masked})`);
  });
  process.exit(1);
}

console.log('✅ Nenhum token real exposto encontrado em arquivos de código.');
