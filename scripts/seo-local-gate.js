#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const checks = [];

const PAGE_RULES = [
  { file: 'index.html', canonical: 'https://itapolitanacajuru.com.br/' },
  { file: 'encomendas.html', canonical: 'https://itapolitanacajuru.com.br/encomendas.html' },
  { file: 'retirada.html', canonical: 'https://itapolitanacajuru.com.br/retirada.html' },
  { file: 'promocao.html', canonical: 'https://itapolitanacajuru.com.br/promocao.html' },
  { file: 'dicas.html', canonical: 'https://itapolitanacajuru.com.br/dicas.html' },
  { file: 'sobre.html', canonical: 'https://itapolitanacajuru.com.br/sobre.html' },
];

function check(name, passed, detail = '') {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function has(html, regex) {
  return regex.test(html);
}

function extractAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

function getMetaContentByName(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const metaName = extractAttr(tag, 'name').toLowerCase();
    if (metaName === name.toLowerCase()) return extractAttr(tag, 'content');
  }
  return '';
}

function hasCanonical(html, expectedHref) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  return tags.some((tag) => {
    const rel = extractAttr(tag, 'rel').toLowerCase();
    const href = extractAttr(tag, 'href');
    return rel === 'canonical' && href === expectedHref;
  });
}

for (const rule of PAGE_RULES) {
  let html = '';
  try {
    html = read(rule.file);
  } catch (error) {
    check(`${rule.file}: leitura`, false, error.message);
    continue;
  }

  check(`${rule.file}: <title> com foco local`, has(html, /<title[^>]*>[^<]*cajuru[^<]*<\/title>/i), 'Título deve incluir "Cajuru".');
  const description = getMetaContentByName(html, 'description');
  check(`${rule.file}: meta description local`, /cajuru/i.test(description), `Description atual: ${description || 'ausente'}`);
  check(`${rule.file}: canonical oficial`, hasCanonical(html, rule.canonical), rule.canonical);
}

let indexHtml = '';
try {
  indexHtml = read('index.html');
} catch (error) {
  check('index.html: leitura para schema local', false, error.message);
}

if (indexHtml) {
  const robotsContent = getMetaContentByName(indexHtml, 'robots');
  check('index.html: robots index,follow', /index\s*,\s*follow/i.test(robotsContent), `robots atual: ${robotsContent || 'ausente'}`);
  check('index.html: schema com addressLocality Cajuru', has(indexHtml, /"addressLocality"\s*:\s*"Cajuru"/i), 'Schema LocalBusiness deve conter Cajuru.');
  check('index.html: schema com addressRegion SP', has(indexHtml, /"addressRegion"\s*:\s*"SP"/i), 'Schema LocalBusiness deve conter SP.');
  check('index.html: schema com coordenadas geográficas', has(indexHtml, /"@type"\s*:\s*"GeoCoordinates"[\s\S]*"latitude"[\s\S]*"longitude"/i), 'Schema deve ter GeoCoordinates.');
  check('index.html: schema com mapas', has(indexHtml, /"sameAs"\s*:\s*\[[\s\S]*maps/i) || has(indexHtml, /"hasMap"\s*:\s*"https:\/\/www\.google\.com\/maps/i), 'Schema deve ter referência de mapa.');
  check('index.html: schema com WhatsApp/telefone local', has(indexHtml, /"telephone"\s*:\s*"\+5516/i) || has(indexHtml, /wa\.me\/5516/i), 'Schema deve expor canal local de contato.');
}

let sitemap = '';
try {
  sitemap = read('sitemap.xml');
  for (const page of ['/', '/encomendas.html', '/retirada.html', '/promocao.html', '/dicas.html', '/sobre.html']) {
    const expected = `https://itapolitanacajuru.com.br${page === '/' ? '/' : page}`;
    check(`sitemap.xml: inclui ${page}`, sitemap.includes(expected), expected);
  }
} catch (error) {
  check('sitemap.xml: leitura', false, error.message);
}

const summary = {
  generatedAt: new Date().toISOString(),
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failed: failures.length,
  failures,
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exit(1);
