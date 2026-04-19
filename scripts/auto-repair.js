#!/usr/bin/env node
/**
 * AUTO-REPAIR.JS — Sorveteria Itapolitana Cajuru
 * ═══════════════════════════════════════════════
 * Ferramenta automática que detecta erros de JavaScript
 * em páginas HTML e restaura automaticamente a última
 * versão boa a partir do histórico do Git.
 *
 * Uso:
 *   node scripts/auto-repair.js           # verifica e corrige
 *   node scripts/auto-repair.js --dry-run # só verifica, não corrige
 *   node scripts/auto-repair.js --check   # só verifica, retorna código de saída 1 se houver erros
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const CHECK_ONLY = process.argv.includes('--check');

// Arquivos HTML a verificar (excluir backups)
const IGNORAR = ['admin-painel.bak2.html', 'admin-painel.bak3.html', 'index.html.bak-scroll-fix'];

// ─────────────────────────────────────────────
// DETECTAR ERROS DE JS EM UM HTML
// ─────────────────────────────────────────────
function verificarJS(conteudo) {
  // Regex que captura <script> de JS real, ignorando application/ld+json,
  // text/template, module inline e similares
  const reScript = /<script(?![^>]*type\s*=\s*['"](?:application\/ld\+json|text\/template|text\/x-template|application\/json)['"]) ?[^>]*>([\s\S]*?)<\/script>/gi;
  const erros = [];
  let match;
  let idx = 0;
  while ((match = reScript.exec(conteudo)) !== null) {
    idx++;
    const codigo = match[1].trim();
    if (!codigo) continue;
    try {
      // eslint-disable-next-line no-new-func
      new Function(codigo);
    } catch (e) {
      erros.push({ script: idx, mensagem: e.message });
    }
  }
  return erros;
}

// ─────────────────────────────────────────────
// ENCONTRAR ÚLTIMO COMMIT BOM PARA UM ARQUIVO
// ─────────────────────────────────────────────
function encontrarUltimaVersaoBoaDoGit(arquivo) {
  let log;
  try {
    log = execSync(`git log --oneline origin/main -- "${arquivo}"`, { cwd: ROOT, encoding: 'utf8' });
  } catch {
    try {
      log = execSync(`git log --oneline -- "${arquivo}"`, { cwd: ROOT, encoding: 'utf8' });
    } catch {
      return null;
    }
  }

  const commits = log.trim().split('\n').map(l => l.split(' ')[0]).filter(Boolean);

  for (const sha of commits) {
    let conteudo;
    try {
      conteudo = execSync(`git show ${sha}:"${arquivo}"`, { cwd: ROOT, encoding: 'utf8' });
    } catch {
      continue;
    }
    const erros = verificarJS(conteudo);
    if (erros.length === 0) {
      return { sha, conteudo };
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// LISTAR TODOS OS HTMLs DO PROJETO
// ─────────────────────────────────────────────
function listarHTMLs() {
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !IGNORAR.includes(f))
    .map(f => path.join(ROOT, f));
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
function main() {
  console.log('🔍 Auto-Repair Itapolitana — iniciando varredura...\n');

  const arquivos = listarHTMLs();
  const comErro = [];

  for (const fullPath of arquivos) {
    const nome = path.basename(fullPath);
    const conteudo = fs.readFileSync(fullPath, 'utf8');
    const erros = verificarJS(conteudo);

    if (erros.length > 0) {
      console.log(`❌ ${nome} — ${erros.length} erro(s) de JavaScript:`);
      erros.forEach(e => console.log(`   script#${e.script}: ${e.mensagem}`));
      comErro.push({ nome, fullPath });
    } else {
      console.log(`✅ ${nome} — OK`);
    }
  }

  console.log(`\n📊 Resultado: ${arquivos.length - comErro.length} OK, ${comErro.length} com erro(s)\n`);

  if (comErro.length === 0) {
    console.log('🎉 Tudo certo! Nenhum reparo necessário.');
    process.exit(0);
  }

  if (CHECK_ONLY) {
    console.log('⚠️  Modo --check: erros encontrados, saindo com código 1.');
    process.exit(1);
  }

  // ─── REPARAR ───────────────────────────────
  let reparados = 0;
  let falhas = 0;

  for (const { nome, fullPath } of comErro) {
    const relativo = path.relative(ROOT, fullPath);
    console.log(`🔧 Reparando ${nome}...`);

    const resultado = encontrarUltimaVersaoBoaDoGit(relativo);

    if (!resultado) {
      console.log(`   ⚠️  Não encontrei versão boa no histórico Git para ${nome}. Pulando.\n`);
      falhas++;
      continue;
    }

    console.log(`   📌 Restaurando versão do commit ${resultado.sha}`);

    if (DRY_RUN) {
      console.log(`   🟡 [dry-run] Arquivo não foi modificado.\n`);
      reparados++;
      continue;
    }

    fs.writeFileSync(fullPath, resultado.conteudo, 'utf8');

    // Verificar se o reparo funcionou
    const errosApos = verificarJS(resultado.conteudo);
    if (errosApos.length === 0) {
      console.log(`   ✅ Reparado com sucesso!\n`);
      reparados++;
    } else {
      console.log(`   ❌ Reparo falhou — versão restaurada ainda tem erros. Revertendo.\n`);
      // Reverter para não deixar arquivo pior
      const original = execSync(`git show HEAD:"${relativo}"`, { cwd: ROOT, encoding: 'utf8' });
      fs.writeFileSync(fullPath, original, 'utf8');
      falhas++;
    }
  }

  console.log(`\n📋 Reparo concluído: ${reparados} arquivo(s) reparado(s), ${falhas} falha(s).`);

  if (reparados > 0 && !DRY_RUN) {
    console.log('\n💡 Dica: faça commit das correções:');
    console.log('   git add -A && git commit -m "fix: auto-repair corrigiu erros de JS"');
  }

  process.exit(falhas > 0 ? 1 : 0);
}

main();
