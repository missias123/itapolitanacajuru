#!/usr/bin/env node
/**
 * Integridade do site estático.
 * Bloqueia deploy quando uma rota pública ou um recurso local referenciado
 * por HTML/CSS não existe. Evita repetir o incidente do carrossel 404.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_PAGES = [
  'index.html', 'promocao.html', 'dicas.html', 'sobre.html',
  'encomendas.html', 'carrossel.html', 'offline.html',
];
const SCRIPT_SCHEME = ['java', 'script:'].join('');
const IGNORED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', SCRIPT_SCHEME, 'data:', 'blob:']);

function isExternal(raw) {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('#') || value.startsWith('\\') || value.startsWith('//')) return true;
  try {
    const parsed = new URL(value, 'https://itapolitanacajuru.com.br/');
    return IGNORED_SCHEMES.has(parsed.protocol);
  } catch (_) {
    return false;
  }
}

function targetFor(baseFile, raw) {
  const value = String(raw || '').trim();
  if (isExternal(value)) return null;
  const clean = value.split('#', 1)[0].split('?', 1)[0].trim();
  if (!clean || clean.includes('${') || clean.includes('}') || clean.includes('<') || clean.includes('>')) return null;
  const target = path.resolve(clean.startsWith('/') ? ROOT : path.dirname(baseFile), clean.replace(/^\/+/, ''));
  const relative = path.relative(ROOT, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function extractHtmlRefs(file) {
  const text = fs.readFileSync(file, 'utf8');
  const refs = [];
  const tagRe = /<(?:script|link|img|iframe|source|video|audio|form|meta)[^>]*>/gi;
  const attrRe = /\b(?:src|href|action|poster|content)\s*=\s*["']([^"']+)["']/i;
  let tag;
  while ((tag = tagRe.exec(text)) !== null) {
    const match = tag[0].match(attrRe);
    if (!match) continue;
    if (/\bcontent\s*=/i.test(tag[0]) && !/https?:|\/\//i.test(match[1])) continue;
    refs.push({ raw: match[1], line: text.slice(0, tag.index).split('\n').length });
  }
  return refs;
}

function auditFile(file) {
  const problems = [];
  for (const ref of extractHtmlRefs(file)) {
    const target = targetFor(file, ref.raw);
    if (target && !fs.existsSync(target)) {
      problems.push(`${path.relative(ROOT, file)}:${ref.line}: referência ausente -> ${ref.raw}`);
    }
  }
  return problems;
}

function auditCss(file) {
  const text = fs.readFileSync(file, 'utf8');
  const problems = [];
  const re = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
  let match;
  while ((match = re.exec(text)) !== null) {
    const target = targetFor(file, match[2]);
    if (target && !fs.existsSync(target)) {
      const line = text.slice(0, match.index).split('\n').length;
      problems.push(`${path.relative(ROOT, file)}:${line}: referência CSS ausente -> ${match[2]}`);
    }
  }
  return problems;
}

const problems = [];
for (const page of PUBLIC_PAGES) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) problems.push(`rota pública ausente -> ${page}`);
}
for (const file of fs.readdirSync(ROOT).filter((name) => name.endsWith('.html'))) {
  problems.push(...auditFile(path.join(ROOT, file)));
}
for (const directory of ['css', 'styles']) {
  const dir = path.join(ROOT, directory);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith('.css'))) {
    problems.push(...auditCss(path.join(dir, name)));
  }
}

if (problems.length) {
  console.error('❌ AUDITORIA DE DEPENDÊNCIAS FALHOU');
  for (const problem of [...new Set(problems)].sort()) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(`✅ Integridade aprovada: ${PUBLIC_PAGES.length} rotas públicas e referências locais verificadas.`);
