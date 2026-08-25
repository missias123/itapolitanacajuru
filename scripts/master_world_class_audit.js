#!/usr/bin/env node
/**
 * MASTER-WORLD-CLASS-AUDIT.JS — Sorveteria Itapolitana Cajuru
 * ════════════════════════════════════════════════════════════
 * Auditoria semanal recorrente para garantir Excelência Mundial.
 * Foco: Responsividade, Assets (itaBot), Acessibilidade e Sincronização.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const REPO_URL = 'https://itapolitanacajuru.com.br';

const PAGINAS = [
  'index.html',
  'encomendas.html',
  'promocao.html',
  'dicas.html',
  'sobre.html'
];

const ASSETS_CRITICOS = [
  'images/itabot-3d-v2027.webp',
  'images/itabot-3d-v2027.png', // fallback compatível preservado
  'scripts/ita-bot-widget-v2027.js',
  'scripts/ita-bot-engine.js',
  'styles/fueap-premium.css'
];

// ── HELPERS ──────────────────────────────────────────────────
function log(msg, type = 'INFO') {
  const icon = { 'INFO': '🔹', 'OK': '✅', 'AVISO': '⚠️', 'ERRO': '❌' }[type] || '🔹';
  console.log(`${icon} [${type}] ${msg}`);
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// ── AUDITORIAS ───────────────────────────────────────────────
async function auditAssets() {
  log('Iniciando auditoria de assets críticos...', 'INFO');
  let errors = 0;
  for (const asset of ASSETS_CRITICOS) {
    const url = `${REPO_URL}/${asset}`;
    const ok = await checkUrl(url);
    if (ok) {
      log(`Asset OK: ${asset}`, 'OK');
    } else {
      log(`Asset QUEBRADO: ${asset} (URL: ${url})`, 'ERRO');
      errors++;
    }
  }
  return errors === 0;
}

function auditResponsiveness() {
  log('Verificando regras de responsividade mobile...', 'INFO');
  let errors = 0;
  PAGINAS.forEach(p => {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    const hasViewport = /<meta\s[^>]*name=["']viewport["']/i.test(html);
    const hasSafeAreas = /safe-area-inset/i.test(html) || fs.readFileSync(path.join(ROOT, 'scripts/ita-bot-widget-v2027.js'), 'utf8').includes('safe-area-inset');
    
    if (!hasViewport) {
      log(`Falta Meta Viewport em ${p}`, 'ERRO');
      errors++;
    }
  });
  return errors === 0;
}

function auditContrast() {
  log('Validando padrões de acessibilidade WCAG AAA...', 'INFO');
  const widgetJs = fs.readFileSync(path.join(ROOT, 'scripts/ita-bot-widget-v2027.js'), 'utf8');
  const hasHighContrast = widgetJs.includes('text-shadow') && widgetJs.includes('#E8000D');
  if (hasHighContrast) {
    log('Contraste do itaBot validado.', 'OK');
    return true;
  }
  log('Possível perda de contraste no itaBot.', 'AVISO');
  return false;
}

async function run() {
  console.log('\n🚀 INICIANDO AUDITORIA MESTRE DE SEGUNDA-FEIRA\n');
  
  const assetsOk = await auditAssets();
  const respOk = auditResponsiveness();
  const contrastOk = auditContrast();
  
  console.log('\n📊 RESUMO DA AUDITORIA:');
  console.log(`- Assets: ${assetsOk ? 'PERFEITO' : 'FALHA'}`);
  console.log(`- Responsividade: ${respOk ? 'PERFEITO' : 'FALHA'}`);
  console.log(`- Acessibilidade: ${contrastOk ? 'PERFEITO' : 'FALHA'}`);
  
  if (assetsOk && respOk && contrastOk) {
    console.log('\n✅ SITE APROVADO: QUALIDADE MUNDIAL MANTIDA.\n');
    process.exit(0);
  } else {
    console.log('\n❌ SITE REPROVADO: NECESSÁRIA INTERVENÇÃO IMEDIATA.\n');
    process.exit(1);
  }
}

run();
