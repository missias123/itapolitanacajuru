#!/usr/bin/env node
/**
 * Auditoria semanal World Class — Itapolitana Cajuru.
 *
 * Este coletor é somente leitura: não publica, não altera dados e não envia
 * formulários reais. Ele orquestra os gates existentes e verifica a superfície
 * pública que o navegador realmente acessa.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'docs', 'relatorios');
const SITE = process.env.AUDIT_SITE_URL || 'https://itapolitanacajuru.com.br';
const API_STATUS = process.env.AUDIT_PICOLE_STATUS_URL || 'https://api.itapolitanacajuru.com.br/api/promocao/picole/status';
const CI = process.argv.includes('--ci');
const generatedAt = new Date().toISOString();

const results = [];

function add({ id, domain, severity = 'warning', status, detail, evidence = [] }) {
  results.push({ id, domain, severity, status, detail, evidence });
}

function run(label, command, args) {
  const proc = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const output = `${proc.stdout || ''}${proc.stderr || ''}`.trim();
  const ok = proc.status === 0;
  add({
    id: label,
    domain: 'Gates locais',
    severity: ok ? 'info' : 'critical',
    status: ok ? 'APROVADO' : 'BLOQUEADO',
    detail: ok ? 'Processo concluído sem erro.' : `Processo retornou código ${proc.status ?? 'desconhecido'}.`,
    evidence: output ? output.split('\n').slice(-40) : [],
  });
  return ok;
}

function checkLocalFiles() {
  const required = [
    'RULES.md',
    'index.html',
    'encomendas.html',
    'promocao.html',
    'dicas.html',
    'sobre.html',
    'admin-painel.html',
    'dados/config.json',
    'dados/produtos.json',
    'dados/admin_espelho_matrix.json',
    'scripts/ita-bot-widget-v2027.js',
    'scripts/itap-picole-promo.js',
    'scripts/gaveta-navegacao-mestra.js',
    'scripts/auditoria-duplicacoes.js',
    'scripts/catalogo-mestre-gate.js',
  ];
  const missing = required.filter((file) => !fs.existsSync(path.join(ROOT, file)));
  add({
    id: 'arquivos-criticos',
    domain: 'Integridade do projeto',
    severity: missing.length ? 'critical' : 'info',
    status: missing.length ? 'BLOQUEADO' : 'APROVADO',
    detail: missing.length ? `Arquivos ausentes: ${missing.join(', ')}` : `${required.length} arquivos críticos presentes.`,
    evidence: required,
  });

  const jsFiles = [];
  for (const dir of ['scripts', 'cloudflare-worker']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (name.endsWith('.js')) jsFiles.push(path.join(dir, name));
    }
  }
  let syntaxOk = true;
  for (const file of jsFiles.sort()) {
    const proc = spawnSync(process.execPath, ['--check', file], { cwd: ROOT, encoding: 'utf8' });
    if (proc.status !== 0) syntaxOk = false;
  }
  add({
    id: 'javascript-sintaxe',
    domain: 'Código',
    severity: syntaxOk ? 'info' : 'critical',
    status: syntaxOk ? 'APROVADO' : 'BLOQUEADO',
    detail: syntaxOk ? `${jsFiles.length} arquivos JavaScript passaram em node --check.` : 'Um ou mais arquivos JavaScript falharam em node --check.',
    evidence: jsFiles,
  });
}

async function request(url, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      ...options,
    });
    const body = await response.text();
    return {
      ok: true,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      ms: Date.now() - started,
      finalUrl: response.url,
    };
  } catch (error) {
    return { ok: false, error: error.message, ms: Date.now() - started };
  }
}

async function checkPublicSurface() {
  const pages = [
    '', 'encomendas.html', 'promocao.html', 'dicas.html', 'sobre.html',
    'carrossel.html', 'offline.html', 'retirada.html',
    'politica-privacidade.html', 'admin-painel.html', 'admin-catalogo.html', 'admin-picole.html',
  ];
  for (const page of pages) {
    const url = `${SITE}/${page}`;
    const result = await request(url);
    const ok = result.ok && result.status === 200;
    add({
      id: `public-${page || 'home'}`,
      domain: 'Site público e rotas',
      severity: ok ? 'info' : 'critical',
      status: ok ? 'APROVADO' : 'BLOQUEADO',
      detail: result.ok ? `HTTP ${result.status}; ${result.ms} ms; URL final ${result.finalUrl}` : `Falha de rede: ${result.error}`,
      evidence: [url],
    });
  }

  const root = await request(`${SITE}/`);
  if (root.ok) {
    const requiredHeaders = [
      ['strict-transport-security', 'HSTS'],
      ['x-content-type-options', 'X-Content-Type-Options'],
      ['referrer-policy', 'Referrer-Policy'],
      ['content-security-policy', 'Content-Security-Policy'],
    ];
    for (const [header, label] of requiredHeaders) {
      const present = Boolean(root.headers[header]);
      add({
        id: `header-${header}`,
        domain: 'Segurança HTTP',
        severity: present ? 'info' : 'warning',
        status: present ? 'APROVADO' : 'AVISO',
        detail: present ? `${label} presente.` : `${label} não foi observado na resposta pública; confirmar configuração no Cloudflare antes de considerar seguro.`,
        evidence: [`${SITE}/`, root.headers[header] || 'ausente'],
      });
    }
    const mixed = [...root.body.matchAll(/(?:src|href|action)=["']http:\/\/([^"']+)["']/gi)];
    add({
      id: 'public-mixed-content',
      domain: 'Segurança HTTP',
      severity: mixed.length ? 'critical' : 'info',
      status: mixed.length ? 'BLOQUEADO' : 'APROVADO',
      detail: mixed.length ? `${mixed.length} referência(s) http:// encontrada(s) na home.` : 'Nenhuma referência http:// encontrada na home.',
      evidence: mixed.map((match) => match[0]),
    });
  }

  const promo = await request(API_STATUS, { headers: { accept: 'application/json' } });
  let json = null;
  try { json = promo.body ? JSON.parse(promo.body) : null; } catch (_) { /* tratado abaixo */ }
  const promoHttpOk = promo.ok && promo.status === 200 && json && typeof json === 'object';
  const camposObrigatorios = ['campaign_configured', 'campaign_active', 'activation_explicit', 'paused', 'schedule_created', 'safeToAnnounce'];
  const contratoOk = promoHttpOk && camposObrigatorios.every((campo) => typeof json[campo] === 'boolean');
  const ativoSeguro = !promoHttpOk || json.status !== 'ativo' || (
    json.campaign_active === true
    && json.activation_explicit === true
    && json.paused === false
    && json.schedule_created === true
    && json.safeToAnnounce === true
  );
  const promoOk = promoHttpOk && contratoOk && ativoSeguro;
  const promoBlocked = promo.ok && promo.status === 404;
  const promoDetail = promoOk
    ? `Endpoint respondeu JSON HTTP 200 em ${promo.ms} ms; contrato server-authoritative válido; nenhuma mutação foi realizada.`
    : promoHttpOk && !contratoOk
      ? `Endpoint respondeu HTTP 200, mas faltam campos booleanos do contrato: ${camposObrigatorios.filter((campo) => typeof json[campo] !== 'boolean').join(', ')}. Não anunciar premiação ativa.`
      : promoHttpOk && !ativoSeguro
        ? 'Endpoint declarou status ativo sem ativação explícita e safeToAnnounce completo. Não anunciar premiação.'
        : `Endpoint não está validado como operacional: ${promo.ok ? `HTTP ${promo.status}` : promo.error}. Não anunciar premiação ativa.`;
  add({
    id: 'promocao-status-publico',
    domain: 'Promoção e integridade operacional',
    severity: promoOk ? 'info' : 'critical',
    status: promoOk ? 'APROVADO' : promoBlocked ? 'BLOQUEADO' : 'PENDENTE',
    detail: promoDetail,
    evidence: [API_STATUS, promo.body ? promo.body.slice(0, 500) : 'sem corpo'],
  });
}

function summarize() {
  const critical = results.filter((r) => r.severity === 'critical' && r.status === 'BLOQUEADO').length;
  const pending = results.filter((r) => r.status === 'PENDENTE').length;
  const warnings = results.filter((r) => r.status === 'AVISO').length;
  const approved = results.filter((r) => r.status === 'APROVADO').length;
  const overall = critical ? 'BLOQUEADO' : pending ? 'PENDENTE' : warnings ? 'APROVADO COM AVISOS' : 'APROVADO';
  return { overall, critical, pending, warnings, approved, total: results.length };
}

function writeReports(summary) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const payload = {
    generatedAt,
    site: SITE,
    apiStatus: API_STATUS,
    mode: CI ? 'ci' : 'local',
    summary,
    results,
    safety: {
      readOnly: true,
      noRealFormsSubmitted: true,
      noPromotionActivated: true,
      noDataMutated: true,
    },
  };
  fs.writeFileSync(path.join(REPORT_DIR, 'auditoria-semanal-latest.json'), JSON.stringify(payload, null, 2) + '\n');

  const lines = [
    '# Auditoria semanal World Class — Itapolitana Cajuru',
    '',
    `Gerado em: ${generatedAt}`,
    `Site auditado: ${SITE}`,
    `Modo: ${CI ? 'CI' : 'local'}`,
    '',
    `> **Status global: ${summary.overall}** — ${summary.approved}/${summary.total} aprovados, ${summary.warnings} avisos, ${summary.pending} pendências e ${summary.critical} bloqueios críticos.`,
    '',
    'A coleta é somente leitura. Não publica código, não altera dados, não ativa premiação e não envia formulários reais.',
    '',
    '| Domínio | Check | Status | Severidade | Detalhe |',
    '|---|---|---|---|---|',
  ];
  for (const item of results) {
    const detail = String(item.detail).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${item.domain} | ${item.id} | ${item.status} | ${item.severity} | ${detail} |`);
  }
  lines.push('', '## Evidências selecionadas', '');
  for (const item of results.filter((r) => r.status !== 'APROVADO' || r.severity === 'warning')) {
    lines.push(`### ${item.id}`, '', `**${item.status}** — ${item.detail}`, '');
    for (const evidence of item.evidence.slice(0, 8)) lines.push('- ' + String(evidence).replace(/`/g, "'"));
    lines.push('');
  }
  fs.writeFileSync(path.join(REPORT_DIR, 'auditoria-semanal-latest.md'), lines.join('\n') + '\n');
}

(async () => {
  checkLocalFiles();
  run('quality-audit', process.execPath, ['scripts/quality-audit.js', '--fail']);
  run('dependency-audit', process.execPath, ['scripts/dependency-audit.js']);
  run('catalogo-mestre-gate', process.execPath, ['scripts/catalogo-mestre-gate.js']);
  run('auditoria-duplicacoes', process.execPath, ['scripts/auditoria-duplicacoes.js', '--ci']);
  if (fs.existsSync(path.join(ROOT, 'scripts', 'auto-corrigir-regras.js'))) {
    run('auto-correcoes-regras-check', process.execPath, ['scripts/auto-corrigir-regras.js', '--check']);
  }
  run('admin-espelho-gate', process.execPath, ['scripts/admin-espelho-gate.js']);
  run('auditoria-robusta-admin', process.execPath, ['scripts/auditoria-robusta-admin.js']);
  if (fs.existsSync(path.join(ROOT, 'scripts', 'check-exposed-tokens.js'))) {
    run('check-exposed-tokens', process.execPath, ['scripts/check-exposed-tokens.js']);
  }
  await checkPublicSurface();
  const summary = summarize();
  writeReports(summary);
  console.log(`AUDITORIA_SEMANAL ${summary.overall} — ${summary.approved}/${summary.total} aprovados; ${summary.warnings} avisos; ${summary.pending} pendências; ${summary.critical} bloqueios.`);
  if (CI && summary.critical > 0) process.exitCode = 1;
})();
