/* eslint-env node */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT = [];

function log(categoria, problema, severidade, detalhes) {
  REPORT.push({ categoria, problema, severidade, detalhes });
}

function getNestedValue(obj, pathStr) {
  if (!pathStr) return undefined;
  const parts = String(pathStr).split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

console.log('🔍 AUDITORIA ROBUSTA: Problemas que Impedem Exibição/Edição do Site no Admin\n');

// 1. PROBLEMAS DE CONECTIVIDADE E CARREGAMENTO
console.log('1️⃣  CONECTIVIDADE E CARREGAMENTO DO ADMIN');

// 1.1 Verificar se admin-painel.html existe
const adminPath = path.join(ROOT, 'admin-painel.html');
if (!fs.existsSync(adminPath)) {
  log('1.1', 'admin-painel.html não encontrado', 'CRÍTICA', `Arquivo ausente: ${adminPath}`);
  console.log('  ❌ 1.1 admin-painel.html AUSENTE');
} else {
  console.log('  ✅ 1.1 admin-painel.html existe');
}

// 1.2 Verificar recursos (verificação básica de referências)
const adminHtml = fs.readFileSync(adminPath, 'utf8');
const cssRefs = adminHtml.match(/<link[^>]+href=["']([^"']+\.css)["']/gi) || [];
const jsRefs = adminHtml.match(/<script[^>]+src=["']([^"']+\.js)["']/gi) || [];
console.log(`  ℹ️  1.2 Recursos CSS: ${cssRefs.length}, JS: ${jsRefs.length}`);

// 1.3 Verificar lógica de autenticação
const hasPasswordValidation = adminHtml.includes('senhaAdmin') && adminHtml.includes('SHA-256');
const hasPATValidation = adminHtml.includes('api.github.com') || adminHtml.includes('GITHUB_PAT');
const hasWorkerSecret = adminHtml.includes('Worker Secret') || adminHtml.includes('ADMIN_SECRET');

if (!hasPasswordValidation) {
  log('1.3', 'Validação de senha ausente ou incorreta', 'CRÍTICA', 'Não encontrada lógica de validação SHA-256 da senha');
  console.log('  ❌ 1.3 Validação de senha AUSENTE');
} else {
  console.log('  ✅ 1.3 Validação de senha presente');
}

if (!hasPATValidation) {
  log('1.3', 'Validação de PAT GitHub ausente', 'ALTA', 'Não encontrada validação de token GitHub');
  console.log('  ⚠️  1.3 Validação PAT GitHub ausente');
} else {
  console.log('  ✅ 1.3 Validação PAT GitHub presente');
}

// 2. PROBLEMAS DE RENDERIZAÇÃO E EXIBIÇÃO
console.log('\n2️⃣  RENDERIZAÇÃO E EXIBIÇÃO DO CONTEÚDO');

// 2.1 Verificar se config.json carrega
const configPath = path.join(ROOT, 'dados/config.json');
let config = null;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`  ✅ 2.1 config.json carrega (${Object.keys(config).length} chaves)`);
} catch (e) {
  log('2.1', 'config.json inválido ou ausente', 'CRÍTICA', e.message);
  console.log('  ❌ 2.1 config.json INVÁLIDO');
}

// 2.2 Verificar blocos de edição
const matrixPath = path.join(ROOT, 'dados/admin_espelho_matrix.json');
let matrix = null;
try {
  matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const camposMatriz = matrix.campos || [];
  console.log(`  ✅ 2.2 Matriz espelho: ${camposMatriz.length} campos`);

  // Verificar se adminIds existem no admin-painel.html
  let adminIdsMissing = 0;
  camposMatriz.forEach(campo => {
    const regex = new RegExp(`id\\s*=\\s*["']${campo.adminId}["']`);
    if (!regex.test(adminHtml)) {
      adminIdsMissing++;
      log('2.2', `adminId ausente no admin-painel.html`, 'ALTA', `Campo: ${campo.id}, adminId esperado: ${campo.adminId}`);
    }
  });

  if (adminIdsMissing > 0) {
    console.log(`  ⚠️  2.2 ${adminIdsMissing} adminIds AUSENTES no HTML`);
  } else {
    console.log(`  ✅ 2.2 Todos adminIds presentes no HTML`);
  }
} catch (e) {
  log('2.2', 'admin_espelho_matrix.json inválido', 'CRÍTICA', e.message);
  console.log('  ❌ 2.2 Matriz espelho INVÁLIDA');
}

// 2.3 Verificar erros JavaScript potenciais
const hasConsoleTryCatch = adminHtml.includes('console.error') || (adminHtml.match(/try\s*\{/g) || []).length > 5;
console.log(`  ℹ️  2.3 Tratamento de erros JS: ${hasConsoleTryCatch ? 'presente' : 'limitado'}`);

// 3. PROBLEMAS DE FUNCIONALIDADE
console.log('\n3️⃣  FUNCIONALIDADE DE EDIÇÃO E SALVAMENTO');

// 3.1 Verificar funções de salvamento
const saveFunctions = [
  'salvarConfig',
  'salvarCardápio',
  'salvarDepoimentos',
  'salvarProduto',
  'salvarPromocaoItem'
];

let missingSaveFunctions = 0;
saveFunctions.forEach(fn => {
  if (!adminHtml.includes(`function ${fn}(`)) {
    missingSaveFunctions++;
    log('3.1', `Função de salvamento ausente`, 'ALTA', `Função: ${fn}`);
  }
});

if (missingSaveFunctions > 0) {
  console.log(`  ⚠️  3.1 ${missingSaveFunctions}/${saveFunctions.length} funções de salvamento AUSENTES`);
} else {
  console.log(`  ✅ 3.1 Todas as funções de salvamento presentes`);
}

// 3.2 Verificar GH_WRITE_ALLOWED
const hasWriteCheck = adminHtml.includes('GH_WRITE_ALLOWED');
if (!hasWriteCheck) {
  log('3.2', 'Verificação GH_WRITE_ALLOWED ausente', 'CRÍTICA', 'Sem proteção contra edição sem permissão');
  console.log('  ❌ 3.2 GH_WRITE_ALLOWED AUSENTE');
} else {
  console.log('  ✅ 3.2 GH_WRITE_ALLOWED presente');
}

// 4. PROBLEMAS DE MAPEAMENTO
console.log('\n4️⃣  MAPEAMENTO (admin_espelho_matrix.json)');

if (config && matrix) {
  const camposMatriz = matrix.campos || [];

  // 4.1 Verificar configKeys ausentes
  let configKeysMissing = 0;
  const cacheSource = new Map();
  camposMatriz.forEach(campo => {
    const sourceRel = String(campo.sourceFile || 'dados/config.json');
    const sourceAbs = path.join(ROOT, sourceRel);
    let sourceJson = cacheSource.get(sourceRel);
    if (!sourceJson) {
      try {
        sourceJson = JSON.parse(fs.readFileSync(sourceAbs, 'utf8'));
      } catch (e) {
        sourceJson = null;
      }
      cacheSource.set(sourceRel, sourceJson);
    }
    const valor = sourceJson ? getNestedValue(sourceJson, campo.configKey) : undefined;
    if (valor === undefined) {
      configKeysMissing++;
      log('4.1', `configKey ausente em ${sourceRel}`, 'ALTA', `Campo: ${campo.id}, configKey: ${campo.configKey}`);
    }
  });

  if (configKeysMissing > 0) {
    console.log(`  ⚠️  4.1 ${configKeysMissing} configKeys AUSENTES em config.json`);
  } else {
    console.log(`  ✅ 4.1 Todas configKeys presentes em config.json`);
  }

  // 4.2 Campos críticos não na matriz
  const camposCriticos = [
    'whatsapp', 'heroTitulo', 'heroDescricao', 'seoTitulo', 'seoDescricao',
    'cardapioTitulo', 'footerCopy', 'horario', 'endereco'
  ];

  const configKeysNaMatriz = camposMatriz.map(c => c.configKey);
  const criticosFaltando = camposCriticos.filter(c => !configKeysNaMatriz.includes(c));

  if (criticosFaltando.length > 0) {
    criticosFaltando.forEach(campo => {
      log('4.2', `Campo crítico não mapeado na matriz`, 'MÉDIA', `Campo: ${campo}`);
    });
    console.log(`  ⚠️  4.2 ${criticosFaltando.length} campos críticos NÃO MAPEADOS: ${criticosFaltando.join(', ')}`);
  } else {
    console.log(`  ✅ 4.2 Todos campos críticos mapeados`);
  }
}

// 5. COBERTURA GERAL
console.log('\n5️⃣  COBERTURA GERAL');

// Páginas que devem ter seção dedicada no admin (espelho)
const paginasEsperadas = [
  { pagina: 'index.html', secoes: ['sec-home'] },
  { pagina: 'sobre.html', secoes: ['sec-sobre'] },
  { pagina: 'galeria.html', secoes: ['sec-galeria'] },
  { pagina: 'carrossel.html', secoes: ['sec-carrossel-config'] },
  { pagina: 'encomendas.html', secoes: ['sec-encomendas-config'] },
  { pagina: '', secoes: ['sec-clientes'] },
  { pagina: 'dicas.html', secoes: ['sec-depoimentos'] },
  { pagina: 'promocao.html', secoes: ['sec-promoção'] }
];

let paginasSemSecao = [];

paginasEsperadas.forEach(({ pagina, secoes }) => {
  const ok = secoes.some((secaoId) => adminHtml.includes(`id="${secaoId}"`));
  if (!ok) paginasSemSecao.push(pagina);
});

if (paginasSemSecao.length > 0) {
  log('5.1', 'Páginas sem seção dedicada no admin', 'MÉDIA', `Páginas: ${paginasSemSecao.join(', ')}`);
  console.log(`  ⚠️  5.1 ${paginasSemSecao.length} páginas SEM SEÇÃO no admin: ${paginasSemSecao.join(', ')}`);
} else {
  console.log(`  ✅ 5.1 Todas páginas têm seção no admin`);
}

// RESUMO
console.log('\n' + '='.repeat(70));
console.log('📊 RESUMO DA AUDITORIA');
console.log('='.repeat(70));

const porSeveridade = {
  'CRÍTICA': REPORT.filter(r => r.severidade === 'CRÍTICA').length,
  'ALTA': REPORT.filter(r => r.severidade === 'ALTA').length,
  'MÉDIA': REPORT.filter(r => r.severidade === 'MÉDIA').length,
  'BAIXA': REPORT.filter(r => r.severidade === 'BAIXA').length
};

console.log(`Total de problemas encontrados: ${REPORT.length}`);
console.log(`  🔴 CRÍTICA: ${porSeveridade.CRÍTICA}`);
console.log(`  🟠 ALTA: ${porSeveridade.ALTA}`);
console.log(`  🟡 MÉDIA: ${porSeveridade.MÉDIA}`);
console.log(`  🟢 BAIXA: ${porSeveridade.BAIXA}`);

if (REPORT.length > 0) {
  console.log('\n📋 DETALHES DOS PROBLEMAS:\n');
  REPORT.forEach((r, i) => {
    const emoji = r.severidade === 'CRÍTICA' ? '🔴' : r.severidade === 'ALTA' ? '🟠' : r.severidade === 'MÉDIA' ? '🟡' : '🟢';
    console.log(`${i + 1}. ${emoji} [${r.categoria}] ${r.problema}`);
    console.log(`   ${r.detalhes}`);
  });
}

// Salvar relatório JSON
const reportPath = path.join(ROOT, 'docs/relatorios/auditoria-robusta-admin.json');
const nextComparable = JSON.stringify(
  {
    total: REPORT.length,
    porSeveridade,
    problemas: REPORT
  },
  null,
  2
);

let shouldWrite = true;
if (fs.existsSync(reportPath)) {
  try {
    const current = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const currentComparable = JSON.stringify(
      {
        total: current.total,
        porSeveridade: current.porSeveridade,
        problemas: current.problemas
      },
      null,
      2
    );
    shouldWrite = currentComparable !== nextComparable;
  } catch {
    shouldWrite = true;
  }
}

if (shouldWrite) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: REPORT.length,
        porSeveridade,
        problemas: REPORT
      },
      null,
      2
    )
  );
  console.log(`\n✅ Relatório atualizado em: docs/relatorios/auditoria-robusta-admin.json`);
} else {
  console.log(`\nℹ️  Relatório inalterado: docs/relatorios/auditoria-robusta-admin.json`);
}

process.exit(REPORT.filter(r => r.severidade === 'CRÍTICA').length > 0 ? 1 : 0);
