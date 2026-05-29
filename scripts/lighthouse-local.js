#!/usr/bin/env node
/**
 * LIGHTHOUSE-LOCAL.JS — Sorveteria Itapolitana Cajuru
 * ════════════════════════════════════════════════════════
 * Auditoria estilo Lighthouse com análise de Performance, Acessibilidade,
 * Boas Práticas, SEO e PWA - compatível com ambiente local sem Chrome.
 *
 * Gera relatórios compatíveis com o painel-qualidade.html
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs', 'relatorios');

// Páginas para auditar
const PAGINAS = [
  { nome: 'index.html', titulo: 'Página Inicial', icon: '🏠' },
  { nome: 'encomendas.html', titulo: 'Encomendas', icon: '🛒' },
  { nome: '', titulo: 'Fidelidade', icon: '⭐' },
  { nome: 'promocao.html', titulo: 'Promoção', icon: '🎁' },
  { nome: 'dicas.html', titulo: 'Dicas', icon: '💡' },
  { nome: 'sobre.html', titulo: 'Sobre', icon: 'ℹ️' },
];

// ══════════════════════════════════════════════════════════════
// ANÁLISE DE PERFORMANCE
// ══════════════════════════════════════════════════════════════
function analisarPerformance(html, nome) {
  let score = 100;
  const audits = [];

  // Tamanho do HTML
  const sizeKB = Buffer.byteLength(html, 'utf8') / 1024;
  if (sizeKB > 1024) {
    score -= 15;
    audits.push({ id: 'html-size', title: 'Tamanho do HTML', score: 0.7, displayValue: `${Math.round(sizeKB)} KB` });
  } else if (sizeKB > 600) {
    score -= 5;
    audits.push({ id: 'html-size', title: 'Tamanho do HTML', score: 0.9, displayValue: `${Math.round(sizeKB)} KB` });
  } else {
    audits.push({ id: 'html-size', title: 'Tamanho do HTML', score: 1, displayValue: `${Math.round(sizeKB)} KB` });
  }

  // Scripts inline (devem ser mínimos)
  const scriptsInline = (html.match(/<script(?![^>]*\ssrc=)[^>]*>/gi) || []).length;
  if (scriptsInline > 3) {
    score -= 5;
    audits.push({ id: 'inline-scripts', title: 'Scripts Inline', score: 0.8, displayValue: `${scriptsInline} scripts` });
  }

  // Recursos externos
  const externalScripts = (html.match(/<script[^>]*\ssrc=/gi) || []).length;
  const externalStyles = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;

  if (externalScripts > 5 || externalStyles > 3) {
    score -= 5;
  }

  // Lazy loading
  const imgs = (html.match(/<img[^>]*>/gi) || []);
  const lazyImgs = imgs.filter(img => /loading=["']lazy["']/i.test(img)).length;
  if (imgs.length > 1 && lazyImgs < imgs.length - 1) {
    score -= 8;
    audits.push({ id: 'lazy-loading', title: 'Lazy Loading de Imagens', score: 0.7, displayValue: `${lazyImgs}/${imgs.length} com lazy` });
  } else if (imgs.length > 0) {
    audits.push({ id: 'lazy-loading', title: 'Lazy Loading de Imagens', score: 1, displayValue: 'Otimizado' });
  }

  // Preload de recursos críticos
  const hasPreload = /<link[^>]*rel=["']preload["']/i.test(html);
  if (!hasPreload && nome === 'index.html') {
    score -= 3;
    audits.push({ id: 'preload', title: 'Preload de Recursos Críticos', score: 0.85, displayValue: 'Não encontrado' });
  } else if (hasPreload) {
    audits.push({ id: 'preload', title: 'Preload de Recursos Críticos', score: 1, displayValue: 'Configurado' });
  }

  // WebP
  const webpImages = (html.match(/\.webp["']/gi) || []).length;
  if (imgs.length > 0 && webpImages < imgs.length * 0.8) {
    score -= 5;
    audits.push({ id: 'webp', title: 'Imagens em WebP', score: 0.75, displayValue: `${webpImages}/${imgs.length}` });
  } else if (imgs.length > 0) {
    audits.push({ id: 'webp', title: 'Imagens em WebP', score: 1, displayValue: 'Otimizado' });
  }

  return { score: Math.max(score, 0), audits };
}

// ══════════════════════════════════════════════════════════════
// ANÁLISE DE ACESSIBILIDADE
// ══════════════════════════════════════════════════════════════
function analisarAcessibilidade(html) {
  let score = 100;
  const audits = [];

  // Lang no HTML
  if (!/<html[^>]*\slang=["']/i.test(html)) {
    score -= 8;
    audits.push({ id: 'html-lang', title: 'Atributo lang no HTML', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'html-lang', title: 'Atributo lang no HTML', score: 1, displayValue: 'Presente' });
  }

  // Alt em imagens
  const imgs = (html.match(/<img[^>]*>/gi) || []);
  const imgsComAlt = imgs.filter(img => /\balt=["'][^"']/i.test(img)).length;
  if (imgs.length > 0 && imgsComAlt < imgs.length) {
    const faltando = imgs.length - imgsComAlt;
    score -= Math.min(faltando * 5, 20);
    audits.push({ id: 'image-alt', title: 'Alt text em imagens', score: imgsComAlt / imgs.length, displayValue: `${faltando} sem alt` });
  } else if (imgs.length > 0) {
    audits.push({ id: 'image-alt', title: 'Alt text em imagens', score: 1, displayValue: 'Todas ok' });
  }

  // Contraste (simulado - verifica se há cores hardcoded)
  const hasColorStyle = /<style[^>]*>[\s\S]*?color\s*:/i.test(html);
  if (hasColorStyle) {
    audits.push({ id: 'color-contrast', title: 'Contraste de cores', score: 0.95, displayValue: 'Verificar manualmente' });
  }

  // Botões e links com texto
  const buttons = (html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []);
  const emptyButtons = buttons.filter(btn => !/>[^<]+</i.test(btn)).length;
  if (emptyButtons > 0) {
    score -= 10;
    audits.push({ id: 'button-text', title: 'Botões com texto', score: 0.7, displayValue: `${emptyButtons} sem texto` });
  }

  // ARIA labels
  const ariaLabels = (html.match(/aria-label=/gi) || []).length;
  if (ariaLabels > 0) {
    audits.push({ id: 'aria-labels', title: 'ARIA Labels', score: 1, displayValue: `${ariaLabels} encontrados` });
  }

  return { score: Math.max(score, 0), audits };
}

// ══════════════════════════════════════════════════════════════
// ANÁLISE DE BOAS PRÁTICAS
// ══════════════════════════════════════════════════════════════
function analisarBoasPraticas(html) {
  let score = 100;
  const audits = [];

  // HTTPS (mixed content)
  const mixedContent = (html.match(/(?:src|href)=["']http:\/\/(?!localhost)/gi) || []).length;
  if (mixedContent > 0) {
    score -= 15;
    audits.push({ id: 'mixed-content', title: 'Mixed Content (HTTP)', score: 0, displayValue: `${mixedContent} encontrados` });
  } else {
    audits.push({ id: 'mixed-content', title: 'Mixed Content', score: 1, displayValue: 'Nenhum' });
  }

  // Tokens expostos
  if (/ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]+/.test(html)) {
    score -= 25;
    audits.push({ id: 'exposed-tokens', title: 'Tokens Expostos', score: 0, displayValue: 'CRÍTICO' });
  } else {
    audits.push({ id: 'exposed-tokens', title: 'Segurança de Tokens', score: 1, displayValue: 'Seguro' });
  }

  // DOCTYPE
  if (!/<!DOCTYPE html>/i.test(html)) {
    score -= 5;
    audits.push({ id: 'doctype', title: 'DOCTYPE HTML5', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'doctype', title: 'DOCTYPE HTML5', score: 1, displayValue: 'Presente' });
  }

  // Charset
  if (!/<meta[^>]*charset/i.test(html)) {
    score -= 5;
    audits.push({ id: 'charset', title: 'Meta Charset', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'charset', title: 'Meta Charset', score: 1, displayValue: 'UTF-8' });
  }

  // Console logs (bad practice em produção)
  const consoleLogs = (html.match(/console\.(log|warn|error)/gi) || []).length;
  if (consoleLogs > 5) {
    score -= 4;
    audits.push({ id: 'console-logs', title: 'Console logs em produção', score: 0.8, displayValue: `${consoleLogs} encontrados` });
  }

  return { score: Math.max(score, 0), audits };
}

// ══════════════════════════════════════════════════════════════
// ANÁLISE DE SEO
// ══════════════════════════════════════════════════════════════
function analisarSEO(html, nome) {
  let score = 100;
  const audits = [];

  // Meta description
  if (!/<meta[^>]*name=["']description["']/i.test(html)) {
    score -= 10;
    audits.push({ id: 'meta-description', title: 'Meta Description', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'meta-description', title: 'Meta Description', score: 1, displayValue: 'Presente' });
  }

  // Title
  const hasTitle = /<title>(.+?)<\/title>/i.test(html);
  if (!hasTitle) {
    score -= 10;
    audits.push({ id: 'title', title: 'Tag Title', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'title', title: 'Tag Title', score: 1, displayValue: 'Presente' });
  }

  // H1
  if (!/<h1[\s>]/i.test(html)) {
    score -= 8;
    audits.push({ id: 'h1', title: 'Heading H1', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'h1', title: 'Heading H1', score: 1, displayValue: 'Presente' });
  }

  // Canonical
  if (!/<link[^>]*rel=["']canonical["']/i.test(html)) {
    score -= 5;
    audits.push({ id: 'canonical', title: 'Link Canonical', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'canonical', title: 'Link Canonical', score: 1, displayValue: 'Presente' });
  }

  // Open Graph
  const hasOG = /<meta[^>]*property=["']og:title["']/i.test(html) &&
                /<meta[^>]*property=["']og:image["']/i.test(html);
  if (!hasOG) {
    score -= 5;
    audits.push({ id: 'open-graph', title: 'Open Graph', score: 0, displayValue: 'Incompleto' });
  } else {
    audits.push({ id: 'open-graph', title: 'Open Graph', score: 1, displayValue: 'Completo' });
  }

  // Schema.org
  if (!/<script[^>]*type=["']application\/ld\+json["']/i.test(html)) {
    score -= 5;
    audits.push({ id: 'schema', title: 'Schema.org JSON-LD', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'schema', title: 'Schema.org JSON-LD', score: 1, displayValue: 'Presente' });
  }

  // Viewport
  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) {
    score -= 10;
    audits.push({ id: 'viewport', title: 'Meta Viewport', score: 0, displayValue: 'Ausente' });
  } else {
    audits.push({ id: 'viewport', title: 'Meta Viewport', score: 1, displayValue: 'Mobile-friendly' });
  }

  return { score: Math.max(score, 0), audits };
}

// ══════════════════════════════════════════════════════════════
// ANÁLISE PWA
// ══════════════════════════════════════════════════════════════
function analisarPWA(html) {
  let score = 0;
  const audits = [];

  // Manifest
  const hasManifest = /<link[^>]*rel=["']manifest["']/i.test(html);
  if (hasManifest) {
    score += 30;
    audits.push({ id: 'manifest', title: 'Web App Manifest', score: 1, displayValue: 'Presente' });
  } else {
    audits.push({ id: 'manifest', title: 'Web App Manifest', score: 0, displayValue: 'Ausente' });
  }

  // Service Worker (detectar registro)
  const hasSW = /navigator\.serviceWorker\.register/i.test(html);
  if (hasSW) {
    score += 30;
    audits.push({ id: 'service-worker', title: 'Service Worker', score: 1, displayValue: 'Registrado' });
  } else {
    audits.push({ id: 'service-worker', title: 'Service Worker', score: 0, displayValue: 'Não encontrado' });
  }

  // Theme color
  if (/<meta[^>]*name=["']theme-color["']/i.test(html)) {
    score += 15;
    audits.push({ id: 'theme-color', title: 'Theme Color', score: 1, displayValue: 'Configurado' });
  } else {
    audits.push({ id: 'theme-color', title: 'Theme Color', score: 0, displayValue: 'Ausente' });
  }

  // Apple touch icon
  if (/<link[^>]*rel=["']apple-touch-icon["']/i.test(html)) {
    score += 15;
    audits.push({ id: 'apple-icon', title: 'Apple Touch Icon', score: 1, displayValue: 'Presente' });
  } else {
    audits.push({ id: 'apple-icon', title: 'Apple Touch Icon', score: 0, displayValue: 'Ausente' });
  }

  // Viewport
  if (/<meta[^>]*name=["']viewport["']/i.test(html)) {
    score += 10;
  }

  return { score: Math.min(score, 100), audits };
}

// ══════════════════════════════════════════════════════════════
// AUDITAR PÁGINA
// ══════════════════════════════════════════════════════════════
function auditarPagina(pagina) {
  const filepath = path.join(ROOT, pagina.nome);
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${pagina.nome} não encontrado`);
    return null;
  }

  const html = fs.readFileSync(filepath, 'utf8');

  const performance = analisarPerformance(html, pagina.nome);
  const accessibility = analisarAcessibilidade(html);
  const bestPractices = analisarBoasPraticas(html);
  const seo = analisarSEO(html, pagina.nome);
  const pwa = analisarPWA(html);

  const resultado = {
    nome: pagina.nome,
    titulo: pagina.titulo,
    icon: pagina.icon,
    timestamp: new Date().toISOString(),
    scores: {
      performance: Math.round(performance.score),
      accessibility: Math.round(accessibility.score),
      'best-practices': Math.round(bestPractices.score),
      seo: Math.round(seo.score),
      pwa: Math.round(pwa.score),
    },
    audits: {
      performance: performance.audits,
      accessibility: accessibility.audits,
      'best-practices': bestPractices.audits,
      seo: seo.audits,
      pwa: pwa.audits,
    }
  };

  return resultado;
}

// ══════════════════════════════════════════════════════════════
// GERAR RELATÓRIO MARKDOWN
// ══════════════════════════════════════════════════════════════
function gerarMarkdown(resultados) {
  const data = new Date().toLocaleDateString('pt-BR');
  const hora = new Date().toLocaleTimeString('pt-BR');

  let md = `# 🔦 Relatório Lighthouse — ${data}\n\n`;
  md += `_Gerado automaticamente em ${data} às ${hora}_\n\n`;
  md += `**Ferramenta:** lighthouse-local.js (análise estática)\n\n`;
  md += `---\n\n`;

  for (const r of resultados) {
    if (!r) continue;

    const avgScore = Math.round(
      (r.scores.performance + r.scores.accessibility + r.scores['best-practices'] + r.scores.seo) / 4
    );
    const emoji = avgScore >= 90 ? '🟢' : avgScore >= 70 ? '🟡' : '🔴';

    md += `## ${emoji} ${r.titulo} (${r.nome})\n\n`;
    md += `**Score médio:** ${avgScore}/100\n\n`;
    md += `| Categoria | Score | Status |\n`;
    md += `|-----------|-------|--------|\n`;

    for (const [cat, score] of Object.entries(r.scores)) {
      const e = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
      const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
      md += `| ${label} | ${score} | ${e} |\n`;
    }

    md += `\n`;

    // Audits com problemas
    const problemas = [];
    for (const [cat, audits] of Object.entries(r.audits)) {
      for (const audit of audits) {
        if (audit.score < 1) {
          problemas.push(`- **${audit.title}**: ${audit.displayValue || 'Verificar'}`);
        }
      }
    }

    if (problemas.length > 0) {
      md += `### ⚠️ Oportunidades de Melhoria:\n\n`;
      md += problemas.join('\n') + '\n\n';
    } else {
      md += `✅ **Nenhuma oportunidade de melhoria detectada.**\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

// ══════════════════════════════════════════════════════════════
// GERAR RELATÓRIO JSON
// ══════════════════════════════════════════════════════════════
function gerarJSON(resultado) {
  // Formato compatível com Lighthouse real
  return {
    lighthouseVersion: '12.0.0',
    requestedUrl: `http://localhost:8080/${resultado.nome}`,
    finalUrl: `http://localhost:8080/${resultado.nome}`,
    fetchTime: resultado.timestamp,
    categories: {
      performance: {
        id: 'performance',
        title: 'Performance',
        score: resultado.scores.performance / 100,
      },
      accessibility: {
        id: 'accessibility',
        title: 'Accessibility',
        score: resultado.scores.accessibility / 100,
      },
      'best-practices': {
        id: 'best-practices',
        title: 'Best Practices',
        score: resultado.scores['best-practices'] / 100,
      },
      seo: {
        id: 'seo',
        title: 'SEO',
        score: resultado.scores.seo / 100,
      },
      pwa: {
        id: 'pwa',
        title: 'PWA',
        score: resultado.scores.pwa / 100,
      },
    },
    audits: resultado.audits,
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
function main() {
  console.log('\n🔦 Lighthouse Local Audit — Itapolitana Cajuru\n');
  console.log('Auditando páginas...\n');

  const resultados = [];

  for (const pagina of PAGINAS) {
    const resultado = auditarPagina(pagina);
    if (resultado) {
      resultados.push(resultado);

      const avg = Math.round(
        (resultado.scores.performance + resultado.scores.accessibility +
         resultado.scores['best-practices'] + resultado.scores.seo) / 4
      );
      const emoji = avg >= 90 ? '🟢' : avg >= 70 ? '🟡' : '🔴';

      console.log(`${emoji} ${pagina.titulo.padEnd(20)} Perf: ${resultado.scores.performance}  Acess: ${resultado.scores.accessibility}  BP: ${resultado.scores['best-practices']}  SEO: ${resultado.scores.seo}  PWA: ${resultado.scores.pwa}`);

      // Salvar JSON individual
      const jsonPath = path.join(DOCS_DIR, `lighthouse-${pagina.nome.replace('.html', '')}.report.json`);
      fs.mkdirSync(DOCS_DIR, { recursive: true });
      fs.writeFileSync(jsonPath, JSON.stringify(gerarJSON(resultado), null, 2), 'utf8');
    }
  }

  console.log('');

  // Gerar relatório Markdown consolidado
  const md = gerarMarkdown(resultados);
  const data = new Date().toISOString().split('T')[0];
  const mdPath = path.join(DOCS_DIR, `lighthouse-${data}.md`);
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`✅ Relatórios salvos em docs/relatorios/`);
  console.log(`   - ${resultados.length} arquivos JSON`);
  console.log(`   - 1 relatório Markdown: lighthouse-${data}.md\n`);

  // Calcular média geral
  const mediaGeral = Math.round(
    resultados.reduce((sum, r) => {
      return sum + (r.scores.performance + r.scores.accessibility + r.scores['best-practices'] + r.scores.seo) / 4;
    }, 0) / resultados.length
  );

  const emojiGeral = mediaGeral >= 90 ? '🟢' : mediaGeral >= 70 ? '🟡' : '🔴';
  console.log(`${emojiGeral} Score médio geral: ${mediaGeral}/100\n`);

  process.exit(0);
}

main();
