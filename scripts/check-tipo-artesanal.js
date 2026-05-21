#!/usr/bin/env node
/**
 * check-tipo-artesanal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * REGRA OBRIGATÓRIA: "artesanal/artesanais" só pode aparecer no site
 * precedido de "tipo". Exemplo correto: "sorvete tipo artesanal".
 *
 * Uso: node scripts/check-tipo-artesanal.js
 * Retorna código 1 se encontrar violações, 0 se tudo estiver OK.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

// Extensões a verificar
const EXTENSIONS = ['.html', '.js', '.json', '.md', '.css', '.txt'];

// Diretórios e arquivos a ignorar
const IGNORE = ['.git', 'node_modules', 'tests', 'check-tipo-artesanal.js'];

// Padrão: "artesanal/artesanais" sem "tipo" imediatamente antes (até 20 chars)
const BAD_PATTERN = /\bartesanai?s?\b/gi;

function hasTipoBefore(content, matchStart) {
  const prefix = content.slice(Math.max(0, matchStart - 20), matchStart);
  return /tipo\s*$/i.test(prefix);
}

function scanFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const violations = [];
  let m;
  BAD_PATTERN.lastIndex = 0;

  while ((m = BAD_PATTERN.exec(content)) !== null) {
    if (!hasTipoBefore(content, m.index)) {
      const lineNum = content.slice(0, m.index).split('\n').length;
      const lineText = content.split('\n')[lineNum - 1].trim().slice(0, 110);
      violations.push({ line: lineNum, match: m[0], text: lineText });
    }
  }
  return violations;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

const root = path.resolve(__dirname, '..');
const files = walkDir(root);
let totalViolations = 0;

for (const file of files) {
  const violations = scanFile(file);
  if (violations.length > 0) {
    const rel = path.relative(root, file);
    for (const v of violations) {
      console.error(`❌ [tipo-artesanal] ${rel}:${v.line} [${v.match}]`);
      console.error(`   ${v.text}`);
      totalViolations++;
    }
  }
}

if (totalViolations === 0) {
  console.log('✅ [tipo-artesanal] Nenhuma violação encontrada — regra OK.');
  process.exit(0);
} else {
  console.error(`\n❌ [tipo-artesanal] ${totalViolations} violação(ões) encontrada(s).`);
  console.error('   "artesanal/artesanais" deve SEMPRE ser precedido de "tipo".');
  process.exit(1);
}
