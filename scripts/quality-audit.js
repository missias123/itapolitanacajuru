#!/usr/bin/env node
/**
 * QUALITY-AUDIT.JS — Sorveteria Itapolitana Cajuru
 * ══════════════════════════════════════════════════
 * Análise estática de qualidade: Performance, Responsividade e Código.
 * Inspirado nas diretrizes do Google Core Web Vitals e padrões iFood/Rappi.
 *
 * Uso:
 *   node scripts/quality-audit.js            # auditar todas as páginas
 *   node scripts/quality-audit.js --fail     # retornar exit 1 se houver críticos
 *   node scripts/quality-audit.js --md       # gerar relatório Markdown
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const FAIL_MODE = process.argv.includes('--fail');
const MD_MODE   = process.argv.includes('--md');

// Páginas auditadas
const PAGINAS = [
  'index.html',
  'encomendas.html',
  '',
  'promocao.html',
  'carrossel.html',
  'dicas.html',
  'offline.html',
];

// Páginas utilitárias: não precisam de SEO/PWA completo (slideshows, embeds, etc.)
const PAGINAS_UTILITARIAS = new Set(['carrossel.html']);

// Limite de tamanho: 600 KB (aviso), 1 MB (crítico)
const KB_AVISO   = 600;
const KB_CRITICO = 1024;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function lerArquivo(nome) {
  const p = path.join(ROOT, nome);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

/** Extrai ocorrências de uma regex com named groups ou lista de matches */
function extrairTags(html, re) {
  const resultados = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(html)) !== null) resultados.push(m);
  return resultados;
}

// ─────────────────────────────────────────────────────────────
// REGRAS DE AUDITORIA
// ─────────────────────────────────────────────────────────────
/**
 * Cada regra retorna { ok: bool, nivel: 'critico'|'aviso'|'ok', msg: string }
 */
const REGRAS = [

  // ── CÓDIGO / META ──────────────────────────────────────────
  {
    id: 'meta-charset',
    label: 'Meta charset declarado',
    categoria: 'Código',
    critico: true,
    verificar(html) {
      const ok = /<meta\s[^>]*charset/i.test(html);
      return { ok, msg: ok ? 'charset presente' : 'Faltando <meta charset="utf-8">' };
    },
  },
  {
    id: 'meta-viewport',
    label: 'Meta viewport (responsivo)',
    categoria: 'Código',
    critico: true,
    verificar(html) {
      const ok = /<meta\s[^>]*name=["']viewport["']/i.test(html);
      return { ok, msg: ok ? 'viewport presente' : 'Faltando <meta name="viewport"> — layout pode quebrar no mobile' };
    },
  },
  {
    id: 'h1-presente',
    label: 'H1 na página',
    categoria: 'Código',
    critico: true,
    verificar(html) {
      // Extrair apenas conteúdo real da página (fora de scripts/estilos/noscript).
      // Usamos um split simples por blocos para evitar regex greedy que pode
      // falhar em edge cases de tags com espaços (ex: </script >) — CodeQL safe.
      const stripBlock = (src, openTag, closeTag) => {
        const parts = [];
        let pos = 0;
        while (pos < src.length) {
          const start = src.toLowerCase().indexOf(openTag, pos);
          if (start === -1) { parts.push(src.slice(pos)); break; }
          parts.push(src.slice(pos, start));
          const end = src.toLowerCase().indexOf(closeTag, start + openTag.length);
          pos = end === -1 ? src.length : end + closeTag.length;
        }
        return parts.join('');
      };
      let semScript = stripBlock(html,   '<script',  '</script>');
      semScript      = stripBlock(semScript, '<style',   '</style>');
      semScript      = stripBlock(semScript, '<noscript','</noscript>');
      const ok = /<h1[\s>]/i.test(semScript);
      return { ok, msg: ok ? 'H1 presente' : 'Nenhum <h1> encontrado — prejudica SEO e acessibilidade' };
    },
  },
  {
    id: 'meta-description',
    label: 'Meta description',
    categoria: 'SEO',
    critico: false,
    verificar(html) {
      const ok = /<meta\s[^>]*name=["']description["']/i.test(html);
      return { ok, msg: ok ? 'description presente' : 'Faltando <meta name="description"> — impacta CTR no Google' };
    },
  },
  {
    id: 'canonical',
    label: 'Link canonical',
    categoria: 'SEO',
    critico: false,
    verificar(html) {
      const ok = /<link\s[^>]*rel=["']canonical["']/i.test(html);
      return { ok, msg: ok ? 'canonical presente' : 'Faltando <link rel="canonical"> — risco de conteúdo duplicado' };
    },
  },
  {
    id: 'open-graph',
    label: 'Open Graph (og:title / og:image)',
    categoria: 'SEO',
    critico: false,
    verificar(html) {
      const ok = /<meta\s[^>]*property=["']og:title["']/i.test(html) && /<meta\s[^>]*property=["']og:image["']/i.test(html);
      return { ok, msg: ok ? 'og:title e og:image presentes' : 'Faltando og:title ou og:image — preview ruim no WhatsApp/Facebook' };
    },
  },
  {
    id: 'schema-org',
    label: 'Schema.org (ld+json)',
    categoria: 'SEO',
    critico: false,
    verificar(html) {
      const ok = /<script\s[^>]*type=["']application\/ld\+json["']/i.test(html);
      return { ok, msg: ok ? 'schema.org presente' : 'Faltando application/ld+json — Google não lê dados estruturados' };
    },
  },

  // ── PERFORMANCE ────────────────────────────────────────────
  {
    id: 'lazy-loading',
    label: 'Lazy loading em imagens secundárias',
    categoria: 'Performance',
    critico: false,
    verificar(html) {
      // Encontra todas as tags <img> e checa se têm loading="lazy"
      const imgs = extrairTags(html, /<img\s[^>]*>/i);
      if (imgs.length <= 1) return { ok: true, msg: 'Apenas 1 imagem — lazy loading não obrigatório' };
      // Pula a primeira imagem (pode ser o hero com loading="eager")
      const secundarias = imgs.slice(1);
      const semLazy = secundarias.filter(m => !/loading=["']lazy["']/i.test(m[0])).length;
      const ok = semLazy === 0;
      return {
        ok,
        msg: ok
          ? `${imgs.length} imagem(ns) — todas secundárias com lazy loading`
          : `${semLazy} imagem(ns) secundária(s) sem loading="lazy" — impacta performance`,
      };
    },
  },
  {
    id: 'preload-hero',
    label: 'Preload da imagem hero (LCP)',
    categoria: 'Performance',
    critico: false,
    verificar(html) {
      // Aceita qualquer ordem de atributos (rel antes ou depois de as)
      const ok = /<link\s[^>]*rel=["']preload["'][^>]*as=["']image["']/i.test(html)
              || /<link\s[^>]*as=["']image["'][^>]*rel=["']preload["']/i.test(html);
      return { ok, msg: ok ? 'Preload de imagem hero encontrado' : 'Nenhum <link rel="preload" as="image"> — LCP pode ser lento' };
    },
  },
  {
    id: 'tamanho-pagina',
    label: 'Tamanho da página',
    categoria: 'Performance',
    critico: false,
    verificar(html, nome) {
      const kb = Buffer.byteLength(html, 'utf8') / 1024;
      if (kb > KB_CRITICO) return { ok: false, msg: `${Math.round(kb)}KB — acima de ${KB_CRITICO}KB (crítico)` };
      if (kb > KB_AVISO)   return { ok: false, msg: `${Math.round(kb)}KB — acima de ${KB_AVISO}KB (aviso)` };
      return { ok: true, msg: `${Math.round(kb)}KB — dentro do limite` };
    },
  },
  {
    id: 'imagens-webp',
    label: 'Imagens em formato WebP',
    categoria: 'Performance',
    critico: false,
    verificar(html) {
      // Strip <script> blocks to avoid false positives from JS template literals
      const stripBlock = (src, openTag, closeTag) => {
        const parts = [];
        let pos = 0;
        while (pos < src.length) {
          const start = src.toLowerCase().indexOf(openTag, pos);
          if (start === -1) { parts.push(src.slice(pos)); break; }
          parts.push(src.slice(pos, start));
          const end = src.toLowerCase().indexOf(closeTag, start + openTag.length);
          pos = end === -1 ? src.length : end + closeTag.length;
        }
        return parts.join('');
      };
      const semScript = stripBlock(html, '<script', '</script>');
      const imgs = extrairTags(semScript, /<img\s[^>]*src=["'][^"']+["']/i);
      if (imgs.length === 0) return { ok: true, msg: 'Nenhuma imagem <img src> encontrada' };
      const semWebp = imgs.filter(m => !/\.webp["']/i.test(m[0])).length;
      const ok = semWebp === 0;
      return {
        ok,
        msg: ok
          ? `Todas as ${imgs.length} imagem(ns) usam WebP`
          : `${semWebp} imagem(ns) não usam WebP — JPEG/PNG são maiores`,
      };
    },
  },

  // ── RESPONSIVIDADE / UX MOBILE ─────────────────────────────
  {
    id: 'pwa-manifest',
    label: 'PWA Manifest',
    categoria: 'Mobile / PWA',
    critico: false,
    verificar(html) {
      const ok = /<link\s[^>]*rel=["']manifest["']/i.test(html);
      return { ok, msg: ok ? 'manifest.json referenciado' : 'Faltando <link rel="manifest"> — site não é instalável como app' };
    },
  },
  {
    id: 'theme-color',
    label: 'Meta theme-color',
    categoria: 'Mobile / PWA',
    critico: false,
    verificar(html) {
      const ok = /<meta\s[^>]*name=["']theme-color["']/i.test(html);
      return { ok, msg: ok ? 'theme-color presente' : 'Faltando <meta name="theme-color"> — barra do navegador sem cor no mobile' };
    },
  },
  {
    id: 'apple-touch-icon',
    label: 'Apple Touch Icon',
    categoria: 'Mobile / PWA',
    critico: false,
    verificar(html) {
      const ok = /<link\s[^>]*rel=["']apple-touch-icon["']/i.test(html);
      return { ok, msg: ok ? 'apple-touch-icon presente' : 'Faltando apple-touch-icon — ícone ruim no iOS' };
    },
  },
  {
    id: 'https-seguro',
    label: 'Nenhum link http:// (mixed content)',
    categoria: 'Segurança',
    critico: true,
    verificar(html) {
      // Detectar src/href com http:// apontando para domínios externos
      // (excluímos localhost, 127.0.0.1 e o próprio domínio do site).
      // Não fazemos strip de comentários para evitar problemas de sanitização parcial —
      // apenas usamos um padrão restrito que já filtra contextos válidos.
      const mixedRe = /(?:src|href|action)\s*=\s*["']http:\/\/(?!localhost|127\.0\.0\.1|itapolitanacajuru)[^"']+["']/gi;
      const encontrados = html.match(mixedRe) || [];
      const ok = encontrados.length === 0;
      return {
        ok,
        msg: ok ? 'Nenhum recurso http:// encontrado' : `${encontrados.length} recurso(s) com http:// — risco de mixed content`,
      };
    },
  },
  {
    id: 'token-exposto',
    label: 'Sem tokens GitHub hardcoded',
    categoria: 'Segurança',
    critico: true,
    verificar(html) {
      const ok = !/ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]+|ghs_[A-Za-z0-9]+/.test(html);
      return { ok, msg: ok ? 'Nenhum token exposto' : '⚠️  Token GitHub encontrado no código — REMOVER IMEDIATAMENTE' };
    },
  },

  // ── ACESSIBILIDADE ─────────────────────────────────────────
  {
    id: 'lang-html',
    label: 'Atributo lang no <html>',
    categoria: 'Acessibilidade',
    critico: false,
    verificar(html) {
      const ok = /<html[^>]*\slang=["']/i.test(html);
      return { ok, msg: ok ? 'lang presente no <html>' : 'Faltando lang= no <html> — leitores de tela não sabem o idioma' };
    },
  },
  {
    id: 'imagens-alt',
    label: 'Todas as imagens com alt',
    categoria: 'Acessibilidade',
    critico: false,
    verificar(html) {
      // Usar o mesmo stripBlock (split seguro) para remover blocos de script/template
      // antes de analisar tags <img> — evita falsos positivos de imagens em templates.
      const stripBlock = (src, openTag, closeTag) => {
        const parts = [];
        let pos = 0;
        while (pos < src.length) {
          const start = src.toLowerCase().indexOf(openTag, pos);
          if (start === -1) { parts.push(src.slice(pos)); break; }
          parts.push(src.slice(pos, start));
          const end = src.toLowerCase().indexOf(closeTag, start + openTag.length);
          pos = end === -1 ? src.length : end + closeTag.length;
        }
        return parts.join('');
      };
      let semScript = stripBlock(html,      '<script',   '</script>');
      semScript      = stripBlock(semScript, '<template', '</template>');
      const imgs = extrairTags(semScript, /<img\s[^>]*>/i);
      const semAlt = imgs.filter(m => !/\balt=["'][^"']/i.test(m[0])).length;
      const ok = semAlt === 0;
      return {
        ok,
        msg: ok
          ? `${imgs.length} imagem(ns) com alt`
          : `${semAlt} imagem(ns) sem alt — falha de acessibilidade e SEO`,
      };
    },
  },
];

// Regras que não se aplicam a páginas utilitárias (slideshows, embeds)
const REGRAS_SKIP_UTILITARIA = new Set([
  'meta-description', 'canonical', 'open-graph', 'schema-org',
  'pwa-manifest', 'theme-color', 'apple-touch-icon',
  'preload-hero', 'lazy-loading',
]);

// ─────────────────────────────────────────────────────────────
// AUDITAR UMA PÁGINA
// ─────────────────────────────────────────────────────────────
function auditarPagina(nome) {
  const html = lerArquivo(nome);
  if (!html) return null;

  const ehUtilitaria = PAGINAS_UTILITARIAS.has(nome);

  const resultados = REGRAS
    .filter(regra => !(ehUtilitaria && REGRAS_SKIP_UTILITARIA.has(regra.id)))
    .map(regra => {
    let resultado;
    try {
      resultado = regra.verificar(html, nome);
    } catch (e) {
      resultado = { ok: false, msg: 'Erro interno ao verificar: ' + e.message };
    }
    const nivel = resultado.ok ? 'ok' : (regra.critico ? 'critico' : 'aviso');
    return {
      id:        regra.id,
      label:     regra.label,
      categoria: regra.categoria,
      nivel,
      ok:        resultado.ok,
      msg:       resultado.msg,
    };
  });

  const criticos  = resultados.filter(r => r.nivel === 'critico').length;
  const avisos    = resultados.filter(r => r.nivel === 'aviso').length;
  const aprovados = resultados.filter(r => r.ok).length;
  const total     = resultados.length;
  const score     = total > 0 ? Math.round((aprovados / total) * 100) : 100;

  return { nome, score, criticos, avisos, aprovados, total, resultados };
}

// ─────────────────────────────────────────────────────────────
// RELATÓRIO MARKDOWN
// ─────────────────────────────────────────────────────────────
function gerarMarkdown(relatorios) {
  const data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const linhas = [
    `# 🔍 Relatório de Qualidade Estática — ${data}`,
    '',
    '_Gerado automaticamente por `scripts/quality-audit.js`_',
    '',
  ];

  for (const r of relatorios) {
    if (!r) continue;
    const emoji = r.score >= 90 ? '🟢' : r.score >= 70 ? '🟡' : '🔴';
    linhas.push(`## ${emoji} ${r.nome} — Score ${r.score}/100`);
    linhas.push('');
    linhas.push('| Categoria | Item | Status | Detalhe |');
    linhas.push('|-----------|------|--------|---------|');
    for (const item of r.resultados) {
      const e = item.ok ? '✅' : (item.nivel === 'critico' ? '❌' : '⚠️');
      linhas.push(`| ${item.categoria} | ${item.label} | ${e} | ${item.msg} |`);
    }
    linhas.push('');
    if (r.criticos > 0) linhas.push(`> ⚠️  **${r.criticos} item(ns) crítico(s)** — correção urgente necessária.`);
    linhas.push('');
  }

  return linhas.join('\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
function main() {
  console.log('\n🔍 Quality Audit — Sorveteria Itapolitana Cajuru\n');

  const relatorios = PAGINAS.map(auditarPagina);
  let totalCriticos = 0;

  for (const r of relatorios) {
    if (!r) continue;
    totalCriticos += r.criticos;
    const emoji = r.score >= 90 ? '🟢' : r.score >= 70 ? '🟡' : '🔴';
    console.log(`${emoji} ${r.nome.padEnd(22)} Score: ${String(r.score).padStart(3)}/100  ✅ ${r.aprovados}/${r.total}  ${r.criticos > 0 ? '❌ ' + r.criticos + ' crítico(s)' : ''}  ${r.avisos > 0 ? '⚠️  ' + r.avisos + ' aviso(s)' : ''}`);
    for (const item of r.resultados.filter(i => !i.ok)) {
      const e = item.nivel === 'critico' ? '  ❌' : '  ⚠️ ';
      console.log(`${e} [${item.categoria}] ${item.label}: ${item.msg}`);
    }
    if (r.criticos === 0 && r.avisos === 0) console.log('     Tudo certo nesta página!');
    console.log('');
  }

  if (MD_MODE) {
    const md = gerarMarkdown(relatorios);
    const saida = path.join(ROOT, 'docs', 'relatorios', 'quality-audit.md');
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, md, 'utf8');
    console.log(`📄 Relatório salvo em: docs/relatorios/quality-audit.md\n`);
  }

  // Sumário final
  const scores = relatorios.filter(Boolean).map(r => r.score);
  const mediaScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const globalEmoji = mediaScore >= 90 ? '🟢' : mediaScore >= 70 ? '🟡' : '🔴';
  console.log(`${globalEmoji} Score médio: ${mediaScore}/100  |  ${totalCriticos} item(ns) crítico(s) no total`);

  if (FAIL_MODE && totalCriticos > 0) {
    console.error('\n❌ Auditoria falhou: item(ns) crítico(s) encontrado(s). Corrija antes de fazer push para main.\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
