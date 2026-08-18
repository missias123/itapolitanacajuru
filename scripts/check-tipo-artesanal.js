#!/usr/bin/env node
/** Bloqueia o retorno do termo proibido nas páginas públicas ativas. */
'use strict';
// O workflow legado já chama este arquivo; por compatibilidade, ele também
// dispara a auditoria de dependências e bloqueia referências 404.
require('./dependency-audit.js');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'promocao.html', 'dicas.html', 'sobre.html', 'encomendas.html', 'carrossel.html', 'offline.html'];
const forbidden = /artesanal/i;
const hits = [];
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (forbidden.test(line)) hits.push(`${page}:${index + 1}: ${line.trim()}`);
  });
}
if (hits.length) {
  console.error('❌ Termo proibido encontrado nas páginas públicas:');
  hits.forEach((hit) => console.error(`- ${hit}`));
  process.exit(1);
}
console.log('✅ Regra de linguagem aprovada: nenhum uso de “artesanal” nas páginas públicas.');
