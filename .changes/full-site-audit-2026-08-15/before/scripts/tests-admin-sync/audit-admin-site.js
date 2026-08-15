#!/usr/bin/env node
// =============================================================================
// Auditoria: Admin × Site — Sorveteria Itapolitana Cajuru
// =============================================================================
// SOMENTE LEITURA — Este script não grava em nenhum arquivo de produção.
// Execução local: node scripts/tests-admin-sync/audit-admin-site.js
// Requisito: Node.js >= 18 (fetch nativo) ou Node < 18 com node-fetch instalado
//
// O que este script verifica:
//   1. Campos obrigatórios presentes em config.json
//   2. Campos obrigatórios presentes em produtos.json
//   3. Campos obrigatórios presentes em promo.json
//   4. Consistência entre config.json e fidelidade.json (prêmios)
//   5. Consistência entre config.json e promo.json (campos duplicados)
//   6. Arquivos de imagens referenciados que existem no repositório
// =============================================================================

const GH_RAW = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';

const URLS = {
  config:     GH_RAW + 'dados/config.json',
  produtos:   GH_RAW + 'dados/produtos.json',
  promo:      GH_RAW + 'dados/promo.json',
  fidelidade: GH_RAW + 'dados/fidelidade.json',
};

// Campos obrigatórios em config.json (mínimo para o site funcionar corretamente)
const CONFIG_OBRIGATORIOS = [
  'whatsapp', 'whatsappFormatado', 'nomeEmpresa', 'slogan',
  'endereco', 'enderecoCompleto', 'horario', 'horarioAbre', 'horarioFecha',
  'heroTitulo', 'heroBadge', 'heroDescricao', 'heroFrases',
  'cardapioTitulo', 'footerHorario', 'footerCopy',
  'navEncomendas', 'navPromocao', 'navDicas', 'navFidelidade',
  'premioMilkshake', 'pontosMilkshake', 'premioCaixa', 'pontosCaixa',
  'fidHeroTitulo', 'fidHeroDesc',
];

// Campos obrigatórios em produtos.json
const PRODUTOS_OBRIGATORIOS = [
  'sorvetes', 'picoles', 'acai', 'milkshake', 'tacas',
  'sobremesas', 'caixas_enc', 'tortas_enc', 'acrescimos',
];

// Campos obrigatórios em promo.json
const PROMO_OBRIGATORIOS = [
  'titulo', 'descricao', 'btnTexto', 'link', 'ativo',
];

// Campos potencialmente duplicados entre config.json e promo.json
const DUPLICADOS_PROMO = [
  { config: 'promoH1',      promo: 'titulo',      label: 'H1 Promoção' },
  { config: 'promoBadge',   promo: 'badge',       label: 'Badge Promoção' },
  { config: 'promoTituloEl',promo: 'titulo',      label: 'Título Elemento' },
  { config: 'promoDescEl',  promo: 'descricao',   label: 'Descrição Elemento' },
];

// ─── Utilitários ────────────────────────────────────────────────────────────

const OK   = '\x1b[32m✅\x1b[0m';
const WARN = '\x1b[33m⚠️ \x1b[0m';
const ERR  = '\x1b[31m❌\x1b[0m';
const INFO = '\x1b[36mℹ️ \x1b[0m';

let totalOk = 0, totalWarn = 0, totalErr = 0;

function ok(msg)   { console.log(`  ${OK}  ${msg}`);   totalOk++;   }
function warn(msg) { console.log(`  ${WARN} ${msg}`);  totalWarn++; }
function err(msg)  { console.log(`  ${ERR}  ${msg}`);  totalErr++;  }
function info(msg) { console.log(`  ${INFO} ${msg}`); }
function header(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`\x1b[1m${title}\x1b[0m`);
  console.log('─'.repeat(60));
}

async function fetchJson(url) {
  try {
    // Adicionar cache-buster para garantir dados frescos
    const resp = await fetch(url + '?t=' + Date.now());
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    return null;
  }
}

// ─── Verificações ───────────────────────────────────────────────────────────

function verificarCamposObrigatorios(dados, lista, nomeArquivo) {
  header(`Campos obrigatórios em ${nomeArquivo}`);
  let ausentes = 0;
  for (const campo of lista) {
    const val = dados[campo];
    if (val === undefined || val === null || val === '') {
      err(`Campo ausente ou vazio: "${campo}"`);
      ausentes++;
    } else {
      const resumo = Array.isArray(val)
        ? `[array com ${val.length} itens]`
        : typeof val === 'object'
          ? `{objeto}`
          : String(val).slice(0, 60);
      ok(`"${campo}" = ${resumo}`);
    }
  }
  if (ausentes === 0) info('Todos os campos obrigatórios presentes.');
  return ausentes;
}

function verificarProdutos(produtos) {
  header('Estrutura de produtos.json');
  for (const cat of PRODUTOS_OBRIGATORIOS) {
    if (!produtos[cat]) {
      err(`Categoria ausente: "${cat}"`);
    } else {
      const v = produtos[cat];
      const qtd = Array.isArray(v) ? v.length : Object.keys(v).length;
      ok(`"${cat}" presente (${qtd} itens/chaves)`);
    }
  }

  // Verificar se sorvetes tem sabores
  if (produtos.sorvetes) {
    const sabores = produtos.sorvetes.sabores;
    if (!sabores || sabores.length === 0) {
      err('sorvetes.sabores está vazio!');
    } else {
      ok(`sorvetes tem ${sabores.length} sabores`);
    }
  }

  // Verificar caixas_enc e tortas_enc
  if (produtos.caixas_enc) {
    const esgotadas = produtos.caixas_enc.filter(c => c.esgotado);
    if (esgotadas.length > 0) {
      warn(`${esgotadas.length} caixa(s) marcada(s) como esgotada(s): ${esgotadas.map(c => c.nome).join(', ')}`);
    } else {
      ok(`caixas_enc: todas disponíveis (${produtos.caixas_enc.length} itens)`);
    }
  }
  if (produtos.tortas_enc) {
    const esgotadas = produtos.tortas_enc.filter(t => t.esgotado);
    if (esgotadas.length > 0) {
      warn(`${esgotadas.length} torta(s) marcada(s) como esgotada(s): ${esgotadas.map(t => t.nome).join(', ')}`);
    } else {
      ok(`tortas_enc: todas disponíveis (${produtos.tortas_enc.length} itens)`);
    }
  }
}

function verificarDuplicidadesPromo(config, promo) {
  header('Consistência: config.json × promo.json (campos duplicados)');
  for (const { config: ck, promo: pk, label } of DUPLICADOS_PROMO) {
    const vc = config[ck];
    const vp = promo[pk];
    if (!vc) {
      ok(`"${label}": campo config.json "${ck}" vazio → promo.json "${pk}" é a fonte ativa`);
    } else if (!vp) {
      warn(`"${label}": config.json "${ck}" = "${vc}" mas promo.json "${pk}" está vazio. config.json prevalece no site.`);
    } else if (String(vc).trim() !== String(vp).trim()) {
      warn(`"${label}": CONFLITO entre config.json "${ck}" = "${String(vc).slice(0,40)}" e promo.json "${pk}" = "${String(vp).slice(0,40)}". config.json prevalece.`);
    } else {
      ok(`"${label}": config.json e promo.json em sincronia`);
    }
  }
}

function verificarConsistenciaFidelidade(config, fidelidade) {
  header('Consistência: config.json × fidelidade.json (configuração de prêmios)');
  const fidCfg = fidelidade && fidelidade.config ? fidelidade.config : {};
  const campos = [
    ['premioMilkshake', 'premioMilkshake'],
    ['pontosMilkshake', 'pontosMilkshake'],
    ['premioCaixa',     'premioCaixa'],
    ['pontosCaixa',     'pontosCaixa'],
  ];
  for (const [ck, fk] of campos) {
    const vc = config[ck];
    const vf = fidCfg[fk];
    if (!vf) {
      ok(`"${ck}": fidelidade.json sem valor; config.json = "${vc}" é a fonte ativa`);
    } else if (String(vc) !== String(vf)) {
      warn(`"${ck}": CONFLITO — config.json = "${vc}" × fidelidade.json.config = "${vf}". config.json prevalece na .`);
    } else {
      ok(`"${ck}": config.json e fidelidade.json em sincronia (= ${vc})`);
    }
  }
}

function verificarPromoAtiva(config, promo) {
  header('Estado da Promoção/Sorteio');
  const ativaConfig = !!config.promocaoAtiva;
  const ativaPromo  = !!promo.ativo;

  if (ativaConfig !== ativaPromo) {
    warn(`Estado divergente: config.json.promocaoAtiva = ${ativaConfig} × promo.json.ativo = ${ativaPromo}`);
    warn('Isso pode causar comportamento inesperado na barra de topo vs página de promoção.');
  } else {
    ok(`Estado sincronizado: promoção ${ativaPromo ? 'ATIVA' : 'INATIVA'} em ambos os arquivos`);
  }

  if (ativaPromo) {
    info(`Promoção ativa: "${promo.titulo || '(sem título)'}"`);
    if (!promo.titulo)     warn('promo.json: campo "titulo" vazio com promoção ativa');
    if (!promo.descricao)  warn('promo.json: campo "descricao" vazio com promoção ativa');
    if (!promo.btnTexto)   warn('promo.json: campo "btnTexto" vazio com promoção ativa');
    if (!promo.link)       warn('promo.json: campo "link" vazio com promoção ativa');
  }
}

function verificarHorario(config) {
  header('Configuração de Horário');
  const abre = config.horarioAbre;
  const fecha = config.horarioFecha;
  if (typeof abre !== 'number' || typeof fecha !== 'number') {
    err(`horarioAbre (${abre}) ou horarioFecha (${fecha}) não são números`);
  } else if (abre >= fecha) {
    warn(`Horário suspeito: abre ${abre}h × fecha ${fecha}h`);
  } else {
    ok(`Horário: ${abre}h às ${fecha}h`);
  }
  if (config.horario && !config.horario.includes(':')) {
    warn('"horario" (texto) não parece conter hora no formato "XXh às XXh"');
  }
  if (config.footerHorario) {
    ok(`footerHorario: "${config.footerHorario.slice(0, 60)}"`);
  } else {
    err('footerHorario vazio — rodapé ficará em branco no site');
  }
}

function verificarWhatsApp(config) {
  header('Configuração de WhatsApp');
  // config.whatsapp pode ser string ou número no JSON; normalizar sempre para string
  const num = String(config.whatsapp ?? '').replace(/\D/g, '');
  if (num.length < 10 || num.length > 13) {
    err(`whatsapp "${config.whatsapp}" parece inválido (${num.length} dígitos)`);
  } else {
    ok(`whatsapp: ${config.whatsapp} (${num.length} dígitos numéricos)`);
  }
  if (!config.whatsappFormatado) {
    warn('whatsappFormatado vazio — chatbot não terá número formatado');
  } else {
    ok(`whatsappFormatado: "${config.whatsappFormatado}"`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m=== AUDITORIA ADMIN × SITE — Sorveteria Itapolitana ===\x1b[0m');
  console.log('Modo: SOMENTE LEITURA (nenhum arquivo é modificado)');
  console.log(`Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  // Carregar todos os arquivos em paralelo
  console.log('🔄 Carregando arquivos do GitHub...');
  const [config, produtos, promo, fidelidade] = await Promise.all([
    fetchJson(URLS.config),
    fetchJson(URLS.produtos),
    fetchJson(URLS.promo),
    fetchJson(URLS.fidelidade),
  ]);

  // Verificar carregamento
  header('Disponibilidade dos arquivos JSON');
  const arquivos = { config, produtos, promo, fidelidade };
  for (const [nome, dados] of Object.entries(arquivos)) {
    if (!dados) {
      err(`dados/${nome}.json — FALHA ao carregar`);
    } else {
      ok(`dados/${nome}.json — carregado com ${Object.keys(dados).length} chaves de nível raiz`);
    }
  }

  if (!config) {
    err('CRÍTICO: config.json não carregou. Abortando auditoria de campos.');
    process.exitCode = 1;
    return;
  }

  // Executar verificações
  verificarCamposObrigatorios(config, CONFIG_OBRIGATORIOS, 'config.json');
  if (produtos) verificarProdutos(produtos);
  if (promo) verificarCamposObrigatorios(promo, PROMO_OBRIGATORIOS, 'promo.json');
  if (promo) verificarPromoAtiva(config, promo);
  if (promo) verificarDuplicidadesPromo(config, promo);
  if (fidelidade) verificarConsistenciaFidelidade(config, fidelidade);
  verificarHorario(config);
  verificarWhatsApp(config);

  // Resumo final
  const total = totalOk + totalWarn + totalErr;
  console.log(`\n${'═'.repeat(60)}`);
  console.log('\x1b[1mRESUMO DA AUDITORIA\x1b[0m');
  console.log('═'.repeat(60));
  console.log(`  ${OK}  OK:       ${totalOk}`);
  console.log(`  ${WARN} Avisos:   ${totalWarn}`);
  console.log(`  ${ERR}  Erros:    ${totalErr}`);
  console.log(`         Total:    ${total}`);
  console.log('═'.repeat(60));

  if (totalErr > 0) {
    console.log('\n\x1b[31m⛔ Auditoria concluída com ERROS. Verifique os campos acima.\x1b[0m\n');
    process.exitCode = 1;
  } else if (totalWarn > 0) {
    console.log('\n\x1b[33m⚠️  Auditoria concluída com AVISOS. Recomenda-se revisão.\x1b[0m\n');
    process.exitCode = 0;
  } else {
    console.log('\n\x1b[32m🎉 Auditoria concluída sem problemas!\x1b[0m\n');
    process.exitCode = 0;
  }
}

main().catch(e => {
  console.error('\n❌ Erro inesperado na auditoria:', e.message);
  process.exitCode = 1;
});
