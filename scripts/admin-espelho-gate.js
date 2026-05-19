/* eslint-env node */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'dados', 'admin_espelho_matrix.json');
const ADMIN_PATH = path.join(ROOT, 'admin-painel.html');
const REPORT_PATH = path.join(ROOT, 'docs', 'relatorios', 'admin-espelho-gate.md');

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function readFile(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

function uniqueViolations(items, field) {
  const seen = new Map();
  const out = [];
  for (const item of items) {
    const key = item[field];
    if (!key) continue;
    const prev = seen.get(key);
    if (prev) out.push(`${field} duplicado: ${key} (${prev.id} e ${item.id})`);
    else seen.set(key, item);
  }
  return out;
}

function ensure(cond, message, failures) {
  if (!cond) failures.push(message);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

const matrix = readJson(MATRIX_PATH);
const rows = Array.isArray(matrix.campos) ? matrix.campos : [];
const adminHtml = readFile(ADMIN_PATH);
const failures = [];
const warnings = [];

if (rows.length === 0) failures.push('Matriz sem campos.');

failures.push(...uniqueViolations(rows, 'id'));
failures.push(...uniqueViolations(rows, 'adminId'));
failures.push(...uniqueViolations(rows, 'configKey'));

function collectDataConfigKeysFromHtml(absPath) {
  const content = readFile(absPath);
  const keys = new Set();
  const re = /data-config(?:-href|-alt|-collection)?="([^"]+)"/g;
  let match = null;
  while ((match = re.exec(content))) {
    const key = String(match[1] || '').trim();
    if (!key) continue;
    keys.add(key);
  }
  return keys;
}

function buildMatrixKey(sourceFile, configKey) {
  return `${sourceFile}::${configKey}`;
}

function assertSiteKeysAreInMatrix() {
  const matrixKeys = new Set(
    rows
      .filter((r) => r && typeof r.sourceFile === 'string' && typeof r.configKey === 'string')
      .map((r) => buildMatrixKey(r.sourceFile, r.configKey))
  );

  const pagesToScan = [
    'index.html',
    'sobre.html',
    'galeria.html',
    'carrossel.html',
    'encomendas.html',
    'fidelidade.html',
    'dicas.html',
    'promocao.html'
  ];

  const missing = [];
  pagesToScan.forEach((page) => {
    const abs = path.join(ROOT, page);
    if (!fs.existsSync(abs)) return;
    const keys = collectDataConfigKeysFromHtml(abs);
    for (const rawKey of keys) {
      if (rawKey.startsWith('promo.')) {
        const promoKey = rawKey.slice('promo.'.length);
        const mk = buildMatrixKey('dados/promo.json', promoKey);
        if (!matrixKeys.has(mk)) missing.push(`${page}: ${rawKey} -> dados/promo.json:${promoKey}`);
        continue;
      }
      const mk = buildMatrixKey('dados/config.json', rawKey);
      if (!matrixKeys.has(mk)) missing.push(`${page}: ${rawKey} -> dados/config.json:${rawKey}`);
    }
  });

  if (missing.length) {
    missing.forEach((m) => failures.push(`[scan] chave do site sem matriz: ${m}`));
  }
}

assertSiteKeysAreInMatrix();

rows.forEach((row) => {
  const prefix = `[${row.id || 'sem-id'}]`;
  const targetAbs = path.join(ROOT, row.targetFile || '');
  const sourceAbs = path.join(ROOT, row.sourceFile || '');

  ensure(typeof row.sourceFile === 'string' && row.sourceFile, `${prefix} sourceFile ausente`, failures);
  ensure(typeof row.targetFile === 'string' && row.targetFile, `${prefix} targetFile ausente`, failures);
  ensure(typeof row.configKey === 'string' && row.configKey, `${prefix} configKey ausente`, failures);
  ensure(typeof row.adminId === 'string' && row.adminId, `${prefix} adminId ausente`, failures);
  ensure(typeof row.siteNeedle === 'string' && row.siteNeedle, `${prefix} siteNeedle ausente`, failures);

  if (!fs.existsSync(sourceAbs)) {
    failures.push(`${prefix} sourceFile inexistente: ${row.sourceFile}`);
    return;
  }
  if (!fs.existsSync(targetAbs)) {
    failures.push(`${prefix} targetFile inexistente: ${row.targetFile}`);
    return;
  }

  const sourceJson = readJson(sourceAbs);
  const configValue = getNestedValue(sourceJson, row.configKey);
  ensure(
    configValue !== undefined,
    `${prefix} configKey não encontrado em ${row.sourceFile}: ${row.configKey}`,
    failures
  );

  const adminIdRegex = new RegExp(`id\\s*=\\s*(["'])?${escapeRegExp(row.adminId)}\\1?(?=[\\s>])`);
  if (!adminIdRegex.test(adminHtml)) {
    failures.push(`${prefix} adminId não encontrado em admin-painel.html: ${row.adminId}`);
  }

  const targetContent = readFile(targetAbs);
  if (!targetContent.includes(row.siteNeedle)) {
    failures.push(`${prefix} siteNeedle não encontrado em ${row.targetFile}: ${row.siteNeedle}`);
  }
});

const stamp = new Date().toISOString();
const lines = [];
lines.push('# Gate Admin ↔ Site (Matriz Espelho)');
lines.push('');
lines.push(`Gerado em: ${stamp}`);
lines.push('');
lines.push(`- Campos avaliados: **${rows.length}**`);
lines.push(`- Falhas: **${failures.length}**`);
lines.push(`- Avisos: **${warnings.length}**`);
lines.push('');

if (failures.length) {
  lines.push('## Falhas');
  lines.push('');
  failures.forEach((f) => lines.push(`- ${f}`));
  lines.push('');
} else {
  lines.push('✅ Nenhuma falha na matriz espelho.');
  lines.push('');
}

if (warnings.length) {
  lines.push('## Avisos');
  lines.push('');
  warnings.forEach((w) => lines.push(`- ${w}`));
  lines.push('');
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');

if (failures.length > 0) {
  console.error(`❌ Gate Admin ↔ Site falhou com ${failures.length} problema(s).`);
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('✅ Gate Admin ↔ Site aprovado.');
