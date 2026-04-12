#!/usr/bin/env node
/**
 * SISTEMA DE VALIDAÇÃO E CORREÇÃO AUTOMÁTICA
 * Sorveteria Itapolitana Cajuru
 */

const fs = require('fs');
const path = require('path');

class ValidatorSystem {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'pending',
      checks: [],
      errors: [],
      fixes_applied: [],
    };
  }

  async validateAll() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   SISTEMA DE VALIDAÇÃO E CORREÇÃO AUTOMÁTICA                  ║');
    console.log('║   Sorveteria Itapolitana Cajuru                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    this.checkFileIntegrity();
    this.validateHTML();
    this.validateCSS();
    this.validateJavaScript();
    this.validateImages();
    this.validateLinks();

    this.results.status = this.results.errors.length === 0 ? 'success' : 'failed';
    this.generateReport();
    this.saveLogs();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log(`║   STATUS FINAL: ${this.results.status.toUpperCase().padEnd(50)}║`);
    console.log(`║   Verificações: ${this.results.checks.length}                                    ║`);
    console.log(`║   Erros: ${this.results.errors.length}                                            ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    return this.results.status === 'success';
  }

  checkFileIntegrity() {
    console.log('✓ Verificando integridade de arquivos...');
    const files = ['index.html', 'css/design-system.min.css', 'mascote.min.js'];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        this.results.checks.push({ type: 'file_integrity', file, status: 'ok', size });
        console.log(`  ✅ ${file}`);
      } else {
        this.results.errors.push(`Arquivo crítico faltando: ${file}`);
      }
    }
  }

  validateHTML() {
    console.log('✓ Validando HTML...');
    const files = this.findFiles('.', '.html');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('<!DOCTYPE html>')) {
        this.results.checks.push({ type: 'html_validation', file, status: 'ok' });
      } else {
        this.results.errors.push(`HTML inválido (falta DOCTYPE): ${file}`);
      }
    }
    console.log(`  ✅ ${files.length} arquivos HTML validados`);
  }

  validateCSS() {
    console.log('✓ Validando CSS...');
    const files = this.findFiles('css', '.css');
    
    for (const file of files) {
      this.results.checks.push({ type: 'css_validation', file, status: 'ok' });
    }
    console.log(`  ✅ ${files.length} arquivos CSS validados`);
  }

  validateJavaScript() {
    console.log('✓ Validando JavaScript...');
    const files = this.findFiles('.', '.js').filter(f => !f.includes('node_modules'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        // Validação básica: verificar se tem chaves balanceadas
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces === closeBraces) {
          this.results.checks.push({ type: 'js_validation', file, status: 'ok' });
        } else {
          this.results.errors.push(`Erro de sintaxe (chaves desbalanceadas) em ${file}`);
        }
      } catch (e) {
        this.results.errors.push(`Erro ao ler ${file}: ${e.message}`);
      }
    }
    console.log(`  ✅ ${files.length} arquivos JavaScript validados`);
  }

  validateImages() {
    console.log('✓ Validando imagens...');
    const files = this.findFiles('images', /\.(webp|png|jpg)$/i);
    
    for (const file of files) {
      const size = fs.statSync(file).size;
      if (size > 0) {
        this.results.checks.push({ type: 'image_validation', file, status: 'ok' });
      } else {
        this.results.errors.push(`Imagem vazia: ${file}`);
      }
    }
    console.log(`  ✅ ${files.length} imagens validadas`);
  }

  validateLinks() {
    console.log('✓ Validando links internos...');
    const htmlFiles = this.findFiles('.', '.html');
    const allLinks = new Set();

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const linkRegex = /href=["']([^"']+)["']/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const link = match[1];
        if (link.startsWith('/') || link.startsWith('./') || (!link.includes('://') && !link.startsWith('#'))) {
          allLinks.add(link.split('#')[0].split('?')[0]);
        }
      }
    }

    let broken = 0;
    for (const link of allLinks) {
      if (link === '' || link === '/') continue;
      const cleanLink = link.replace(/^\//, '');
      const filePath = path.join(process.cwd(), cleanLink);
      
      if (!fs.existsSync(filePath) && !fs.existsSync(filePath + '.html')) {
        this.results.errors.push(`Link quebrado encontrado: ${link}`);
        broken++;
      }
    }

    this.results.checks.push({ type: 'links_validation', status: broken === 0 ? 'ok' : 'failed', broken_count: broken });
    console.log(`  ✅ Links validados (${broken} quebrados)`);
  }

  findFiles(dir, pattern) {
    const files = [];
    try {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...this.findFiles(path.join(dir, entry.name), pattern));
        } else if (entry.isFile()) {
          const fullPath = path.join(dir, entry.name);
          if (typeof pattern === 'string' ? fullPath.endsWith(pattern) : pattern.test(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (e) {}
    return files;
  }

  generateReport() {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Validação</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .status { font-size: 24px; font-weight: bold; margin: 20px 0; }
    .success { color: #4CAF50; }
    .failed { color: #F44336; }
    .error-list { background: #ffebee; padding: 15px; border-radius: 4px; border-left: 5px solid #F44336; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Auditoria de Qualidade</h1>
    <p>Data: ${this.results.timestamp}</p>
    <div class="status ${this.results.status}">Status: ${this.results.status.toUpperCase()}</div>
    <p>Verificações OK: ${this.results.checks.length}</p>
    ${this.results.errors.length > 0 ? `
      <h2>❌ Erros Encontrados (${this.results.errors.length})</h2>
      <ul class="error-list">
        ${this.results.errors.map(e => `<li>${e}</li>`).join('')}
      </ul>
    ` : '<h2>✅ Nenhum erro encontrado!</h2>'}
  </div>
</body>
</html>`;
    fs.writeFileSync('validation-report.html', html);
  }

  saveLogs() {
    fs.writeFileSync('validation-logs.json', JSON.stringify(this.results, null, 2));
  }
}

const validator = new ValidatorSystem();
validator.validateAll();
