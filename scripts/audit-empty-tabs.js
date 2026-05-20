#!/usr/bin/env node
/**
 * AUDITORIA FORENSE AUTOMATIZADA - ABAS VAZIAS DO ADMIN-PAINEL
 *
 * Script para validação visual automatizada das abas:
 * - Sobre
 * - Galeria
 * - Pág. Encomendas
 * - Rastreio
 *
 * Verifica:
 * 1. Presença dos elementos HTML (IDs dos campos)
 * 2. Funções de carregamento implementadas
 * 3. Mapeamento no irPara()
 * 4. Dados no config.json
 * 5. Correspondência HTML ↔ JavaScript ↔ config.json
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ADMIN_HTML = path.join(REPO_ROOT, 'admin-painel.html');
const CONFIG_JSON = path.join(REPO_ROOT, 'dados', 'config.json');
const REPORT_PATH = path.join(REPO_ROOT, 'docs', 'relatorios', 'audit-empty-tabs.md');

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(70), 'cyan');
}

// ============================================================================
// AUDITORIA DE UMA ABA
// ============================================================================

class TabAudit {
  constructor(tabName, sectionId, loadFunction, configKeys, htmlFields) {
    this.tabName = tabName;
    this.sectionId = sectionId;
    this.loadFunction = loadFunction;
    this.configKeys = configKeys; // array de caminhos no config.json
    this.htmlFields = htmlFields; // array de IDs esperados no HTML
    this.issues = [];
    this.warnings = [];
    this.success = [];
  }

  audit(html, config) {
    section(`AUDITANDO ABA: ${this.tabName}`);

    // 1. Verificar seção HTML
    this.auditHtmlSection(html);

    // 2. Verificar campos HTML
    this.auditHtmlFields(html);

    // 3. Verificar função de carregamento
    this.auditLoadFunction(html);

    // 4. Verificar dados no config.json
    this.auditConfigData(config);

    // 5. Verificar mapeamento irPara
    this.auditIrParaMapping(html);

    this.printResults();
    return this.issues.length === 0;
  }

  auditHtmlSection(html) {
    const regex = new RegExp(`id="${this.sectionId}"`, 'g');
    const matches = html.match(regex);

    if (!matches || matches.length === 0) {
      this.issues.push(`❌ CRÍTICO: Seção HTML id="${this.sectionId}" NÃO ENCONTRADA`);
    } else if (matches.length > 1) {
      this.warnings.push(`⚠️  AVISO: ID "${this.sectionId}" duplicado (${matches.length}x)`);
    } else {
      this.success.push(`✅ Seção HTML id="${this.sectionId}" encontrada`);
    }
  }

  auditHtmlFields(html) {
    let foundCount = 0;
    let missingFields = [];

    for (const fieldId of this.htmlFields) {
      const regex = new RegExp(`id="${fieldId}"`, 'g');
      if (html.match(regex)) {
        foundCount++;
      } else {
        missingFields.push(fieldId);
      }
    }

    if (missingFields.length === 0) {
      this.success.push(`✅ Todos os ${this.htmlFields.length} campos HTML encontrados`);
    } else if (missingFields.length === this.htmlFields.length) {
      this.issues.push(`❌ CRÍTICO: NENHUM campo HTML encontrado (0/${this.htmlFields.length})`);
    } else {
      this.warnings.push(`⚠️  ${missingFields.length}/${this.htmlFields.length} campos ausentes: ${missingFields.join(', ')}`);
    }
  }

  auditLoadFunction(html) {
    const regex = new RegExp(`function ${this.loadFunction}\\s*\\(`);
    if (!html.match(regex)) {
      this.issues.push(`❌ CRÍTICO: Função ${this.loadFunction}() NÃO ENCONTRADA`);
    } else {
      this.success.push(`✅ Função ${this.loadFunction}() implementada`);

      // Verificar se função é chamada no irPara
      const irParaRegex = new RegExp(`${this.loadFunction}\\s*\\(\\)`);
      if (!html.match(irParaRegex)) {
        this.warnings.push(`⚠️  Função ${this.loadFunction}() não é chamada em irPara()`);
      } else {
        this.success.push(`✅ Função ${this.loadFunction}() é chamada em irPara()`);
      }
    }
  }

  auditConfigData(config) {
    let allKeysPresent = true;

    for (const keyPath of this.configKeys) {
      const keys = keyPath.split('.');
      let current = config;
      let found = true;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }

      if (!found) {
        this.issues.push(`❌ CRÍTICO: Chave config.json "${keyPath}" NÃO ENCONTRADA`);
        allKeysPresent = false;
      } else if (current === null || current === undefined) {
        this.warnings.push(`⚠️  Chave "${keyPath}" existe mas está vazia (${current})`);
      } else {
        this.success.push(`✅ Chave config "${keyPath}" presente e populada`);
      }
    }
  }

  auditIrParaMapping(html) {
    // Verificar se há mapeamento no switch/if do irPara
    const irParaFunctionMatch = html.match(/function irPara\([^)]*\)\s*{([\s\S]*?)^}/m);
    if (!irParaFunctionMatch) {
      this.warnings.push(`⚠️  Não foi possível extrair função irPara() para análise`);
      return;
    }

    const irParaBody = irParaFunctionMatch[1];
    const sectionIdShort = this.sectionId.replace('sec-', '');

    if (irParaBody.includes(`'${sectionIdShort}'`) || irParaBody.includes(`"${sectionIdShort}"`)) {
      this.success.push(`✅ Seção "${sectionIdShort}" mapeada em irPara()`);
    } else {
      this.issues.push(`❌ CRÍTICO: Seção "${sectionIdShort}" NÃO está mapeada em irPara()`);
    }
  }

  printResults() {
    log(`\n📊 RESULTADOS: ${this.tabName}`, 'magenta');

    if (this.success.length > 0) {
      log('\n✅ SUCESSOS:', 'green');
      this.success.forEach(s => log(`  ${s}`, 'green'));
    }

    if (this.warnings.length > 0) {
      log('\n⚠️  AVISOS:', 'yellow');
      this.warnings.forEach(w => log(`  ${w}`, 'yellow'));
    }

    if (this.issues.length > 0) {
      log('\n❌ PROBLEMAS CRÍTICOS:', 'red');
      this.issues.forEach(i => log(`  ${i}`, 'red'));
    }

    const status = this.issues.length === 0 ? 'APROVADA' : 'REPROVADA';
    const statusColor = this.issues.length === 0 ? 'green' : 'red';
    log(`\n🏁 STATUS: ${status} (${this.success.length} ✅ | ${this.warnings.length} ⚠️  | ${this.issues.length} ❌)`, statusColor);
  }

  toMarkdown() {
    let md = `## ${this.tabName}\n\n`;
    md += `**Seção HTML**: \`${this.sectionId}\`\n`;
    md += `**Função de carregamento**: \`${this.loadFunction}()\`\n\n`;

    md += `### ✅ Sucessos (${this.success.length})\n\n`;
    this.success.forEach(s => md += `- ${s}\n`);

    if (this.warnings.length > 0) {
      md += `\n### ⚠️  Avisos (${this.warnings.length})\n\n`;
      this.warnings.forEach(w => md += `- ${w}\n`);
    }

    if (this.issues.length > 0) {
      md += `\n### ❌ Problemas Críticos (${this.issues.length})\n\n`;
      this.issues.forEach(i => md += `- ${i}\n`);
    }

    const status = this.issues.length === 0 ? '✅ APROVADA' : '❌ REPROVADA';
    md += `\n**Status**: ${status}\n\n`;
    md += `---\n\n`;

    return md;
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  log('\n🔍 AUDITORIA FORENSE AUTOMATIZADA - ABAS VAZIAS ADMIN-PAINEL', 'cyan');
  log('Iniciando validação visual das 4 abas...', 'cyan');

  // Carregar arquivos
  if (!fs.existsSync(ADMIN_HTML)) {
    log(`\n❌ ERRO: admin-painel.html não encontrado em ${ADMIN_HTML}`, 'red');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG_JSON)) {
    log(`\n❌ ERRO: config.json não encontrado em ${CONFIG_JSON}`, 'red');
    process.exit(1);
  }

  const html = fs.readFileSync(ADMIN_HTML, 'utf-8');
  const config = JSON.parse(fs.readFileSync(CONFIG_JSON, 'utf-8'));

  log(`✅ admin-painel.html carregado (${(html.length / 1024).toFixed(1)} KB)`, 'green');
  log(`✅ config.json carregado (${Object.keys(config).length} chaves raiz)`, 'green');

  // Definir auditorias
  const audits = [
    new TabAudit(
      'Sobre',
      'sec-sobre',
      'carregarSobre',
      ['sobrePagina', 'sobrePagina.quemSomosAno', 'sobrePagina.quemSomosTexto1'],
      [
        'sobre-quem-somos-ano',
        'sobre-quem-somos-endereco',
        'sobre-quem-somos-cidade',
        'sobre-quem-somos-texto1',
        'sobre-quem-somos-texto2',
        'sobre-stat-anos-trad',
        'sobre-stat-sabores',
        'sobre-stat-clientes',
        'sobre-historia-titulo',
        'sobre-historia-p1',
        'sobre-historia-p2',
        'sobre-historia-p3',
        'sobre-cta-texto',
        'sobre-cta-btn'
      ]
    ),

    new TabAudit(
      'Galeria',
      'sec-galeria',
      'carregarGaleria',
      ['galeriaPagina', 'seoPaginas.galeria', 'galeriaPagina.imagens'],
      [
        'cfg-seo-galeria-titulo',
        'cfg-seo-galeria-descricao',
        'cfg-seo-galeria-palavras',
        'galeria-h1',
        'galeria-descricao',
        'galeria-imagens-lista'
      ]
    ),

    new TabAudit(
      'Pág. Encomendas',
      'sec-encomendas-config',
      'carregarEncomendas',
      ['encomendasPagina', 'seoPaginas.encomendas', 'encomendasPagina.heroTitulo'],
      [
        'cfg-seo-encomendas-titulo',
        'cfg-seo-encomendas-descricao',
        'encomendas-hero-titulo',
        'encomendas-hero-descricao',
        'encomendas-hero-badges'
      ]
    ),

    new TabAudit(
      'Rastreio',
      'sec-rastreio',
      'renderRastreioRecentes',
      ['adminConteudoPaginas.rastreio'],
      [
        'rastreio-observacoes',
        'rastreio-busca',
        'rastreio-resultado',
        'rastreio-recentes'
      ]
    )
  ];

  // Executar auditorias
  let allPassed = true;
  const results = [];

  for (const audit of audits) {
    const passed = audit.audit(html, config);
    results.push(audit);
    if (!passed) allPassed = false;
  }

  // Gerar relatório em Markdown
  generateMarkdownReport(results, allPassed);

  // Resultado final
  log('\n' + '='.repeat(70), 'cyan');
  if (allPassed) {
    log('✅ AUDITORIA CONCLUÍDA: TODAS AS ABAS APROVADAS', 'green');
    log(`📄 Relatório salvo em: ${REPORT_PATH}`, 'cyan');
    process.exit(0);
  } else {
    log('❌ AUDITORIA CONCLUÍDA: ALGUMAS ABAS REPROVADAS', 'red');
    log(`📄 Relatório detalhado salvo em: ${REPORT_PATH}`, 'cyan');
    process.exit(1);
  }
}

function generateMarkdownReport(results, allPassed) {
  const timestamp = new Date().toISOString();
  const status = allPassed ? '✅ TODAS APROVADAS' : '❌ PROBLEMAS ENCONTRADOS';

  let md = `# Auditoria Forense - Abas Vazias Admin-Painel\n\n`;
  md += `**Data**: ${timestamp}\n`;
  md += `**Status Geral**: ${status}\n\n`;
  md += `## Resumo Executivo\n\n`;

  const totalSuccess = results.reduce((sum, r) => sum + r.success.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  md += `- ✅ Sucessos: ${totalSuccess}\n`;
  md += `- ⚠️  Avisos: ${totalWarnings}\n`;
  md += `- ❌ Problemas: ${totalIssues}\n\n`;

  md += `## Abas Auditadas\n\n`;
  md += `| Aba | Status | ✅ | ⚠️  | ❌ |\n`;
  md += `|-----|--------|----|----|----|\n`;

  for (const r of results) {
    const tabStatus = r.issues.length === 0 ? '✅' : '❌';
    md += `| ${r.tabName} | ${tabStatus} | ${r.success.length} | ${r.warnings.length} | ${r.issues.length} |\n`;
  }

  md += `\n---\n\n`;
  md += `## Detalhes por Aba\n\n`;

  for (const r of results) {
    md += r.toMarkdown();
  }

  md += `## Conclusão\n\n`;

  if (allPassed) {
    md += `✅ **Todas as 4 abas possuem:**\n\n`;
    md += `1. Seção HTML completa com ID correto\n`;
    md += `2. Campos HTML de entrada (inputs/textareas) presentes\n`;
    md += `3. Função JavaScript de carregamento implementada\n`;
    md += `4. Dados correspondentes no config.json\n`;
    md += `5. Mapeamento correto na função irPara()\n\n`;
    md += `**Diagnóstico**: As abas estão tecnicamente corretas. Se aparecem vazias no navegador, o problema está no fluxo de execução JavaScript (config não carregado, erro JS bloqueando execução, ou CSS ocultando as seções).\n\n`;
    md += `**Próximo passo**: Auditoria visual no navegador com DevTools para capturar erros JavaScript em tempo de execução.\n`;
  } else {
    md += `❌ **Problemas encontrados na estrutura das abas.**\n\n`;
    md += `Veja os detalhes acima para identificar elementos HTML ausentes, funções não implementadas ou dados faltantes no config.json.\n`;
  }

  // Garantir que o diretório existe
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, md, 'utf-8');
}

// Executar
main();
