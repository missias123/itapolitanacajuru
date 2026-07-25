#!/usr/bin/env node
/**
 * migrate-data.cjs — Script de migração de dados para o Cloudflare Worker
 *
 * Importa clientes.json, encomendas.json e vinculos_clientes.json
 * para o backend seguro (Cloudflare Worker + KV).
 *
 * USO AUTORIZADO:
 *   node migrate-data.cjs --environment=staging --dry-run \
 *     --api https://staging-api.example.workers.dev \
 *     --secret <STAGING_SECRET> \
 *     --clientes dados-sinteticos/clientes.json
 *
 *   node migrate-data.cjs --environment=staging --confirm-staging \
 *     --api https://staging-api.example.workers.dev \
 *     --secret <STAGING_SECRET> \
 *     --clientes dados-sinteticos/clientes.json
 *
 * BLOQUEADO — nunca execute:
 *   --environment=production  → interrompe imediatamente
 *   NODE_ENV=production        → interrompe imediatamente
 *   ENVIRONMENT=production     → interrompe imediatamente
 *
 * FLAGS:
 *   --environment=local|staging   OBRIGATÓRIO — ambiente alvo
 *   --api <url>                   URL base do Worker (obrigatório para staging)
 *   --secret <valor>              ADMIN_SECRET do Worker (obrigatório)
 *   --dry-run                     Simula sem gravar nada
 *   --confirm-staging             Pula confirmação interativa (somente staging)
 *   --skip-clientes               Pula migração de clientes
 *   --skip-encomendas             Pula migração de encomendas
 *   --clientes <caminho>          Arquivo clientes.json
 *   --encomendas <caminho>        Arquivo encomendas.json
 *   --vinculos <caminho>          Arquivo vinculos_clientes.json
 *
 * Requer Node.js 18+ (fetch nativo).
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ─── Constantes ───────────────────────────────────────────────────────────────

const SCRIPT_VERSION = '2.0.0';

/** Domínios ou padrões que indicam produção real. */
const PRODUCTION_URL_PATTERNS = [
  /^https?:\/\/api\.itapolitanacajuru\.com\.br/i,
  /^https?:\/\/itapolitanacajuru\.com\.br/i,
  // Workers sem "staging" no nome
  /^https?:\/\/itapolitana-api\.[a-z0-9-]+\.workers\.dev/i,
  // Pages sem "staging" no nome
  /^https?:\/\/itapolitanacajuru\.[a-z0-9-]+\.pages\.dev/i,
];

/** Substrings que indicam staging — isentam da regra de URL de produção. */
const STAGING_URL_INDICATORS = ['staging', 'stg', 'homolog', 'preview', 'sandbox'];

/**
 * Padrões de campos que podem conter PII.
 * A verificação inspeciona NOMES de campos, nunca valores.
 */
const PII_FIELD_PATTERNS = [
  { label: 'nome/name',      re: /^(nome|name)$/i },
  { label: 'email',          re: /^e.?mail$/i },
  { label: 'telefone/cel',   re: /^(tel(efone)?|phone|cel(ular)?|fone)$/i },
  { label: 'CPF/CNPJ',       re: /^(cpf|cnpj)$/i },
  { label: 'endereço',       re: /^(endereco|logradouro|address|rua|bairro|cidade)$/i },
  { label: 'CEP/ZIP',        re: /^(cep|zip.*)$/i },
  { label: 'data nascimento',re: /^(data.?nasc.*|nascimento|birth.*)$/i },
  { label: 'observação',     re: /^(obs(ervac?[aã]o)?|nota|note|comentario|comment)$/i },
  { label: 'pagamento',      re: /^(pagamento|cartao|card.*)$/i },
  { label: 'senha/hash/salt',re: /^(senha|password|hash|salt|token|secret|chave|key)$/i },
];

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

/**
 * Retorna o valor do flag --flag=value ou --flag value.
 * Nunca usa defaultVal silencioso para flags de segurança.
 */
function getArg(flag, defaultVal = null) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && i + 1 < args.length && !args[i + 1].startsWith('--')) {
      return args[i + 1];
    }
    if (args[i].startsWith(flag + '=')) {
      return args[i].slice(flag.length + 1);
    }
  }
  return defaultVal;
}

function hasFlag(flag) {
  return args.some(a => a === flag || a.startsWith(flag + '='));
}

// ─── PASSO 1 — Validar --environment (OBRIGATÓRIO, sem fallback) ──────────────

const ENVIRONMENT_RAW = getArg('--environment');

if (!ENVIRONMENT_RAW) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════╗');
  console.error('║  ❌  --environment é OBRIGATÓRIO                    ║');
  console.error('╚══════════════════════════════════════════════════════╝');
  console.error('  Valores permitidos: local, staging');
  console.error('  Exemplos:');
  console.error('    node migrate-data.cjs --environment=staging --dry-run --secret <S>');
  console.error('    node migrate-data.cjs --environment=local   --dry-run --secret <S>');
  console.error('  "production", "prod", "live" e outros valores são BLOQUEADOS.');
  console.error('');
  process.exit(1);
}

const ENVIRONMENT = ENVIRONMENT_RAW.toLowerCase().trim();

const ALLOWED_ENVIRONMENTS = ['local', 'staging'];
const BLOCKED_ENVIRONMENTS = ['production', 'prod', 'live', 'prd', 'real'];

if (BLOCKED_ENVIRONMENTS.includes(ENVIRONMENT)) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════╗');
  console.error('║  🔴  BLOQUEADO — AMBIENTE DE PRODUÇÃO DETECTADO     ║');
  console.error('╚══════════════════════════════════════════════════════╝');
  console.error(`  Ambiente recusado: "${ENVIRONMENT_RAW}"`);
  console.error('  Este script NÃO pode ser executado em produção.');
  console.error('  Nenhum dado foi lido ou gravado.');
  console.error('');
  process.exit(1);
}

if (!ALLOWED_ENVIRONMENTS.includes(ENVIRONMENT)) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════╗');
  console.error('║  ❌  AMBIENTE DESCONHECIDO — INTERROMPENDO           ║');
  console.error('╚══════════════════════════════════════════════════════╝');
  console.error(`  Valor recebido: "${ENVIRONMENT_RAW}"`);
  console.error('  Valores permitidos: local, staging');
  console.error('  Interrompendo por precaução.');
  console.error('');
  process.exit(1);
}

// ─── PASSO 2 — Bloqueio multi-camada de produção ──────────────────────────────

/**
 * Verifica múltiplas camadas de indicadores de produção.
 * Interrompe se qualquer camada indicar produção.
 * Nunca imprime secrets ou URLs privadas completas.
 */
function checkProductionGuard(apiUrl) {
  const reasons = [];

  // Camada 1: variável de ambiente NODE_ENV
  const nodeEnv = (process.env.NODE_ENV ?? '').toLowerCase().trim();
  if (nodeEnv === 'production' || BLOCKED_ENVIRONMENTS.includes(nodeEnv)) {
    reasons.push('NODE_ENV indica ambiente de produção');
  }

  // Camada 2: variável de ambiente ENVIRONMENT
  const envVar = (process.env.ENVIRONMENT ?? '').toLowerCase().trim();
  if (envVar === 'production' || BLOCKED_ENVIRONMENTS.includes(envVar)) {
    reasons.push('Variável de ambiente ENVIRONMENT indica produção');
  }

  // Camada 3: variável de ambiente WORKER_ENVIRONMENT
  const workerEnv = (process.env.WORKER_ENVIRONMENT ?? '').toLowerCase().trim();
  if (workerEnv === 'production' || BLOCKED_ENVIRONMENTS.includes(workerEnv)) {
    reasons.push('Variável de ambiente WORKER_ENVIRONMENT indica produção');
  }

  // Camada 4: URL da API — verificar domínios de produção conhecidos
  if (apiUrl) {
    const urlLower = apiUrl.toLowerCase();
    const hasStaging = STAGING_URL_INDICATORS.some(s => urlLower.includes(s));
    if (!hasStaging) {
      for (const pattern of PRODUCTION_URL_PATTERNS) {
        if (pattern.test(apiUrl)) {
          // Mascarar: não imprimir a URL completa
          const masked = apiUrl.replace(/(https?:\/\/)([^/]+)(.*)/, '$1[DOMÍNIO]');
          reasons.push(`API URL sem indicador de staging — domínio bloqueado: ${masked}`);
          break;
        }
      }
    }
  }

  // Camada 5: consistência entre --environment e a URL
  if (apiUrl && ENVIRONMENT === 'staging') {
    // Extrair hostname com precisão para não confundir "localhost" com subdomínios
    let urlHostname = '';
    try { urlHostname = new URL(apiUrl).hostname; } catch (_) { urlHostname = apiUrl; }
    const isLocalhost = urlHostname === 'localhost' || urlHostname === '127.0.0.1';
    if (isLocalhost) {
      reasons.push('--environment=staging não é compatível com URL localhost');
    }
  }

  if (reasons.length > 0) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║  🔴  BLOQUEADO — INDICADORES DE PRODUÇÃO DETECTADOS ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    for (const r of reasons) {
      console.error(`  • ${r}`);
    }
    console.error('');
    console.error('  Corrija o ambiente antes de continuar.');
    console.error('  Nenhum dado foi lido ou gravado.');
    console.error('');
    process.exit(1);
  }
}

// ─── PASSO 3 — Demais argumentos ──────────────────────────────────────────────

const DEFAULT_API = ENVIRONMENT === 'local' ? 'http://localhost:8787' : null;
const API_URL         = getArg('--api', DEFAULT_API);
const ADMIN_SECRET    = getArg('--secret');
const CLIENTES_PATH   = getArg('--clientes');
const ENCOMENDAS_PATH = getArg('--encomendas');
const VINCULOS_PATH   = getArg('--vinculos');
const DRY_RUN         = hasFlag('--dry-run');
const CONFIRM_STAGING = hasFlag('--confirm-staging');
const SKIP_CLIENTES   = hasFlag('--skip-clientes');
const SKIP_ENCOMENDAS = hasFlag('--skip-encomendas');

// --api obrigatório para staging
if (!API_URL) {
  console.error('');
  console.error('❌  --api é obrigatório para --environment=staging.');
  console.error('    Exemplo: --api https://staging-api.example.workers.dev');
  console.error('');
  process.exit(1);
}

// Executar bloqueio de produção antes de verificar o secret
checkProductionGuard(API_URL);

// --confirm-staging só é permitido em staging
if (CONFIRM_STAGING && ENVIRONMENT !== 'staging') {
  console.error('');
  console.error('❌  --confirm-staging é permitido somente com --environment=staging.');
  console.error('    Para --environment=local, use confirmação interativa (sem esta flag).');
  console.error('');
  process.exit(1);
}

// --secret obrigatório
if (!ADMIN_SECRET) {
  console.error('');
  console.error('❌  --secret é obrigatório.');
  console.error('    Nunca coloque o secret diretamente em scripts automatizados visíveis.');
  console.error('    Use variável de ambiente: --secret "$STAGING_ADMIN_SECRET"');
  console.error('');
  process.exit(1);
}

// ─── Helpers: carregamento de arquivo ─────────────────────────────────────────

function loadJson(filePath, label) {
  if (!filePath) {
    console.warn(`⚠️  Caminho para ${label} não fornecido — pulando.`);
    return null;
  }
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`⚠️  Arquivo não encontrado: ${resolved} — pulando ${label}.`);
    return null;
  }
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`❌  Falha ao ler ${label}: ${e.message}`);
    return null;
  }
}

// ─── Helpers: validação de schema ─────────────────────────────────────────────

/**
 * Valida estrutura de dados de clientes.
 * Retorna lista de erros (vazia se OK).
 */
function validateClientesSchema(data) {
  const erros = [];
  if (!data || typeof data !== 'object') {
    erros.push('Dados de clientes devem ser um objeto');
    return erros;
  }
  if (!data.clientes || typeof data.clientes !== 'object' || Array.isArray(data.clientes)) {
    erros.push('Campo "clientes" ausente ou inválido (deve ser objeto)');
  }
  if (data.clientes) {
    let idx = 0;
    for (const [id, c] of Object.entries(data.clientes)) {
      idx++;
      if (idx > 5) { erros.push(`... (e outros registros — verificação parcial até 5)`); break; }
      if (!c || typeof c !== 'object') {
        erros.push(`Registro "${id}": valor inválido (não é objeto)`);
        continue;
      }
      if (!c.id_permanente) erros.push(`Registro "${id}": campo "id_permanente" ausente`);
      if (c.id_permanente && !/^USR-/.test(c.id_permanente)) {
        erros.push(`Registro "${id}": "id_permanente" não segue padrão USR-`);
      }
      if (!c.cel) erros.push(`Registro "${id}": campo "cel" ausente`);
      if (c.cel && !/^\d{10,11}$/.test(String(c.cel).replace(/\D/g, ''))) {
        erros.push(`Registro "${id}": "cel" com formato inválido`);
      }
    }
  }
  if (data.indice_celular !== undefined && (typeof data.indice_celular !== 'object' || Array.isArray(data.indice_celular))) {
    erros.push('Campo "indice_celular" deve ser objeto quando presente');
  }
  return erros;
}

/**
 * Valida estrutura de dados de encomendas.
 * Retorna lista de erros (vazia se OK).
 */
function validateEncomendasSchema(data) {
  const erros = [];
  if (!data || typeof data !== 'object') {
    erros.push('Dados de encomendas devem ser um objeto');
    return erros;
  }
  if (!Array.isArray(data.registros)) {
    erros.push('Campo "registros" ausente ou inválido (deve ser array)');
    return erros;
  }
  let idx = 0;
  for (const r of data.registros) {
    idx++;
    if (idx > 5) { erros.push(`... (verificação parcial até 5 registros)`); break; }
    if (!r || typeof r !== 'object') {
      erros.push(`Registro #${idx}: não é objeto`);
      continue;
    }
    const hasId = r.id || r.pedido_id || r.numero || r._id;
    if (!hasId) erros.push(`Registro #${idx}: sem identificador (id, pedido_id, numero ou _id)`);
  }
  return erros;
}

// ─── Helpers: detecção de PII ──────────────────────────────────────────────────

/**
 * Escaneia recursivamente as CHAVES de um objeto em busca de campos PII.
 * Nunca imprime valores. Retorna mapa { label: contagem }.
 */
function detectPiiFields(obj, depth = 0, counts = {}) {
  if (depth > 6 || !obj || typeof obj !== 'object') return counts;
  const entries = Array.isArray(obj) ? obj.map((v, i) => [i, v]) : Object.entries(obj);
  for (const [key, val] of entries) {
    if (typeof key === 'string') {
      for (const { label, re } of PII_FIELD_PATTERNS) {
        if (re.test(key)) {
          counts[label] = (counts[label] ?? 0) + 1;
        }
      }
    }
    if (val && typeof val === 'object') {
      detectPiiFields(val, depth + 1, counts);
    }
  }
  return counts;
}

// ─── Helpers: idempotência ─────────────────────────────────────────────────────

/**
 * Verifica duplicatas de ID dentro do objeto de clientes.
 * Retorna { duplicatas: string[], ids: Set }.
 */
function checkClientesDuplicates(clientesObj) {
  const ids = new Set();
  const duplicatas = [];
  for (const id of Object.keys(clientesObj)) {
    if (ids.has(id)) duplicatas.push(id);
    ids.add(id);
  }
  // Verificar duplicatas de celular
  const cels = new Map();
  for (const [id, c] of Object.entries(clientesObj)) {
    if (!c?.cel) continue;
    const cel = String(c.cel).replace(/\D/g, '');
    if (cels.has(cel)) {
      duplicatas.push(`cel ${cel} em ${id} e ${cels.get(cel)}`);
    } else {
      cels.set(cel, id);
    }
  }
  return { duplicatas, total: ids.size };
}

/**
 * Verifica duplicatas de ID dentro do array de encomendas.
 */
function checkEncomendasDuplicates(registros) {
  const ids = new Set();
  const duplicatas = [];
  for (const r of registros) {
    const id = r?.id ?? r?.pedido_id ?? r?.numero ?? r?._id;
    if (!id) continue;
    if (ids.has(String(id))) duplicatas.push(String(id));
    ids.add(String(id));
  }
  return { duplicatas, total: registros.length };
}

// ─── Helpers: API ─────────────────────────────────────────────────────────────

async function apiPut(endpoint, data) {
  if (DRY_RUN) {
    // Nunca imprimir o corpo — pode conter PII
    console.log(`  [DRY-RUN] PUT ${endpoint} — payload omitido (pode conter dados privados)`);
    return { ok: true, dryRun: true };
  }

  const url = `${API_URL}${endpoint}`;
  const resp = await fetch(url, {
    method:  'PUT',
    headers: {
      'Content-Type':        'application/json',
      'X-Itap-Admin-Secret': ADMIN_SECRET,
    },
    body: JSON.stringify(data),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // Nunca imprimir o corpo da resposta completo — pode conter dados sensíveis
    throw new Error(`HTTP ${resp.status} em ${endpoint}`);
  }
  return json;
}

async function healthCheck() {
  try {
    const resp = await fetch(`${API_URL}/api/health`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    console.log(`  ✅  Worker online — versão ${d.version ?? '?'}`);
    return true;
  } catch (e) {
    // Não imprimir URL completa (pode conter params sensíveis)
    console.error(`  ❌  Worker inacessível: ${e.message}`);
    return false;
  }
}

// ─── Helpers: confirmação ─────────────────────────────────────────────────────

/**
 * Solicita confirmação interativa ao usuário.
 * Requer digitação da frase exata — não aceita Enter, "s", "y" ou resposta vazia.
 */
function askConfirmation(prompt, expected) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() === expected);
    });
  });
}

// ─── Merge clientes + vinculos_clientes ───────────────────────────────────────

/**
 * vinculos_clientes.json tem formato { clientes: { <cel>: { nome, cel, ... } } }
 * Mescla com o formato padrão de clientes.json (chaves USR-XXXX).
 * Clientes novos (de vinculos) recebem IDs USR-2026-XXXX sequenciais.
 */
function mergeClientes(clientesData, vinculosData) {
  const merged        = { ...(clientesData?.clientes ?? {}) };
  const indiceCelular = { ...(clientesData?.indice_celular ?? {}) };

  if (!vinculosData?.clientes) return { clientes: merged, indice_celular: indiceCelular };

  let maxNum = Object.keys(merged).reduce((acc, k) => {
    const m = k.match(/USR-\d+-(\d+)$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);

  let importados  = 0;
  let ignorados   = 0;

  const vinculoClientes = vinculosData.clientes;
  for (const [chave, c] of Object.entries(vinculoClientes)) {
    if (!c) continue;
    const cel = String(c.cel ?? chave).replace(/\D/g, '');
    if (!cel) continue;

    if (indiceCelular[cel]) {
      ignorados++;
      // Nunca imprimir o número de celular nos logs
      console.log(`  ↩  Vínculo ignorado (celular já cadastrado) — id: ${indiceCelular[cel]}`);
      continue;
    }

    maxNum += 1;
    const novoId = `USR-2026-${String(maxNum).padStart(4, '0')}`;
    const agora  = new Date().toISOString();

    merged[novoId] = {
      id_permanente:        novoId,
      id_hash:              '',
      nome:                 c.nome ?? 'Sem Nome',
      dataNasc:             c.dataNasc ?? '',
      cel,
      cel_anterior:         [],
      cadastro:             c.cadastro ?? c.data ?? agora,
      saldoPontos:          c.saldoPontos ?? c.pontos ?? 0,
      codigosUsados:        c.codigosUsados ?? [],
      resgates:             c.resgates ?? [],
      totalPremios:         c.totalPremios ?? 0,
      totalCodigos:         c.totalCodigos ?? 0,
      bloqueado:            false,
      motivo_bloqueio:      null,
      tentativas_fraude:    0,
      ultimo_acesso:        agora,
      historico_alteracoes: [{ data: agora, tipo: 'importacao', descricao: 'Importado de vinculos_clientes.json', por: 'migrate-data.cjs' }],
      _origem:              'vinculos_clientes',
    };
    indiceCelular[cel] = novoId;
    importados++;
    // Nunca imprimir nome ou celular — exibir somente o ID novo
    console.log(`  ✚  Vínculo importado como ${novoId}`);
  }

  console.log(`  Vínculos: ${importados} importados, ${ignorados} ignorados.`);
  return { clientes: merged, indice_celular: indiceCelular };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = new Date().toISOString();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migração de dados — Itapolitana → Cloudflare Worker  ');
  console.log(`  Versão: ${SCRIPT_VERSION}                                    `);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Ambiente:  ${ENVIRONMENT.toUpperCase()}`);
  console.log(`  Dry-run:   ${DRY_RUN ? 'SIM (sem escrita real)' : 'NÃO'}`);
  console.log(`  Iniciado:  ${startedAt}`);
  // Nunca imprimir API_URL completa (pode conter token ou identificadores)
  const maskedApi = API_URL.replace(/(https?:\/\/)([^/]{0,10})[^/]*(\/|$)/, '$1$2…$3');
  console.log(`  API:       ${maskedApi}`);
  console.log('');

  // ── Carregar dados ────────────────────────────────────────────────────────
  const clientesRaw   = SKIP_CLIENTES   ? null : loadJson(CLIENTES_PATH,   'clientes.json');
  const encomendasRaw = SKIP_ENCOMENDAS ? null : loadJson(ENCOMENDAS_PATH, 'encomendas.json');
  const vinculosRaw   = SKIP_CLIENTES   ? null : loadJson(VINCULOS_PATH,   'vinculos_clientes.json');

  // ── Validação de schema ───────────────────────────────────────────────────
  let schemaOk = true;

  if (clientesRaw) {
    console.log('\n🔍  Validando schema de clientes…');
    const erros = validateClientesSchema(clientesRaw);
    if (erros.length > 0) {
      console.error('  ❌  Erros de schema em clientes:');
      erros.forEach(e => console.error(`     • ${e}`));
      schemaOk = false;
    } else {
      console.log('  ✅  Schema de clientes válido.');
    }
  }

  if (encomendasRaw) {
    console.log('\n🔍  Validando schema de encomendas…');
    const erros = validateEncomendasSchema(encomendasRaw);
    if (erros.length > 0) {
      console.error('  ❌  Erros de schema em encomendas:');
      erros.forEach(e => console.error(`     • ${e}`));
      schemaOk = false;
    } else {
      console.log('  ✅  Schema de encomendas válido.');
    }
  }

  if (!schemaOk) {
    console.error('\n❌  Validação de schema falhou. Corrija os dados antes de prosseguir.');
    process.exit(1);
  }

  // ── Detecção de PII ───────────────────────────────────────────────────────
  console.log('\n🔒  Detectando campos sensíveis (PII)…');
  const piiCounts = {};
  if (clientesRaw)   detectPiiFields(clientesRaw,   0, piiCounts);
  if (encomendasRaw) detectPiiFields(encomendasRaw, 0, piiCounts);
  if (vinculosRaw)   detectPiiFields(vinculosRaw,   0, piiCounts);

  const piiEntries = Object.entries(piiCounts);
  if (piiEntries.length > 0) {
    console.log('  ⚠️  Campos com potencial PII encontrados (contagem de ocorrências de campo):');
    for (const [label, count] of piiEntries) {
      console.log(`     • ${label}: ${count} ocorrência(s)`);
    }
    if (ENVIRONMENT === 'local') {
      console.warn('  ⚠️  Dados com PII em ambiente local. Confirme que são sintéticos.');
    }
    // Não bloquear — PII em staging é esperada para dados sintéticos.
    // O operador é responsável por confirmar que os dados são sintéticos.
  } else {
    console.log('  ✅  Nenhum campo PII identificado nos dados carregados.');
  }

  // ── Verificação de duplicatas (idempotência) ──────────────────────────────
  let duplicatasOk = true;

  if (clientesRaw?.clientes) {
    console.log('\n🔁  Verificando duplicatas em clientes…');
    const { duplicatas, total } = checkClientesDuplicates(clientesRaw.clientes);
    console.log(`  Total de registros: ${total}`);
    if (duplicatas.length > 0) {
      console.error(`  ❌  ${duplicatas.length} duplicata(s) encontrada(s) em clientes:`);
      duplicatas.slice(0, 5).forEach(d => console.error(`     • ${d}`));
      if (duplicatas.length > 5) console.error(`     ... e mais ${duplicatas.length - 5}`);
      duplicatasOk = false;
    } else {
      console.log('  ✅  Sem duplicatas em clientes.');
    }
  }

  if (encomendasRaw?.registros) {
    console.log('\n🔁  Verificando duplicatas em encomendas…');
    const { duplicatas, total } = checkEncomendasDuplicates(encomendasRaw.registros);
    console.log(`  Total de registros: ${total}`);
    if (duplicatas.length > 0) {
      console.error(`  ❌  ${duplicatas.length} duplicata(s) encontrada(s) em encomendas:`);
      duplicatas.slice(0, 5).forEach(d => console.error(`     • id: ${d}`));
      if (duplicatas.length > 5) console.error(`     ... e mais ${duplicatas.length - 5}`);
      duplicatasOk = false;
    } else {
      console.log('  ✅  Sem duplicatas em encomendas.');
    }
  }

  if (!duplicatasOk) {
    console.error('\n❌  Duplicatas detectadas. Corrija os dados antes de prosseguir.');
    process.exit(1);
  }

  // ── Calcular contagens para o resumo ──────────────────────────────────────
  let totalClientes  = 0;
  let totalEncomendas = 0;
  let mergedClientes  = null;

  if (!SKIP_CLIENTES && (clientesRaw || vinculosRaw)) {
    mergedClientes = mergeClientes(clientesRaw, vinculosRaw);
    totalClientes  = Object.keys(mergedClientes.clientes).length;
  }
  if (!SKIP_ENCOMENDAS && encomendasRaw?.registros) {
    totalEncomendas = encomendasRaw.registros.length;
  }

  // ── Resumo do dry-run ─────────────────────────────────────────────────────
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log('  RESUMO DE CONTAGENS');
  console.log('─────────────────────────────────────────────────────');
  console.log(`  Clientes a migrar:   ${totalClientes}`);
  console.log(`  Encomendas a migrar: ${totalEncomendas}`);
  console.log(`  Ambiente:            ${ENVIRONMENT.toUpperCase()}`);
  console.log(`  Dry-run:             ${DRY_RUN ? 'SIM' : 'NÃO'}`);
  console.log('─────────────────────────────────────────────────────');

  if (DRY_RUN) {
    console.log('');
    console.log('✅  Dry-run concluído. Nenhum dado foi gravado.');
    console.log(`  Data/hora: ${new Date().toISOString()}`);
    console.log('');
    return;
  }

  // ── Confirmação antes da escrita ──────────────────────────────────────────
  if (!CONFIRM_STAGING) {
    // Confirmação interativa — requer digitação exata
    const phrase = ENVIRONMENT === 'staging'
      ? 'CONFIRMAR_MIGRACAO_STAGING'
      : 'CONFIRMAR_MIGRACAO_LOCAL';

    console.log('');
    console.log('⚠️  ATENÇÃO: Operação de ESCRITA REAL prestes a iniciar.');
    console.log(`   Ambiente: ${ENVIRONMENT.toUpperCase()}`);
    console.log(`   Clientes:  ${totalClientes}`);
    console.log(`   Encomendas: ${totalEncomendas}`);
    console.log('');
    console.log(`   Para confirmar, digite exatamente: ${phrase}`);
    console.log('   (Apenas Enter, "s", "y" ou resposta vazia NÃO são aceitos.)');
    console.log('');

    if (!process.stdin.isTTY) {
      console.error('❌  Stdin não é um terminal interativo. Confirmação interativa impossível.');
      console.error('    Use --dry-run para simular, ou --confirm-staging (apenas em staging).');
      process.exit(1);
    }

    const confirmed = await askConfirmation(`   > `, phrase);
    if (!confirmed) {
      console.error('\n❌  Confirmação incorreta. Operação cancelada. Nenhum dado foi gravado.\n');
      process.exit(1);
    }
    console.log('   ✅  Confirmação aceita.\n');
  } else {
    // --confirm-staging foi passado (somente staging)
    console.log('  ℹ️  Confirmação automática via --confirm-staging (ambiente: staging).');
  }

  // ── Health check (após confirmação, antes de gravar) ─────────────────────
  const ok = await healthCheck();
  if (!ok) {
    console.error('Abortando — Worker indisponível.');
    process.exit(1);
  }

  // ── Migrar clientes ───────────────────────────────────────────────────────
  if (!SKIP_CLIENTES && mergedClientes) {
    console.log('\n📋  Migrando clientes…');
    console.log(`  Total: ${totalClientes} registros`);

    try {
      const r = await apiPut('/api/clientes/bulk', mergedClientes);
      if (r.ok || r.dryRun) {
        console.log(`  ✅  Clientes migrados com sucesso!`);
      } else {
        console.error(`  ❌  Falha na importação de clientes`);
      }
    } catch (e) {
      console.error(`  ❌  Erro ao importar clientes: ${e.message}`);
      process.exit(1);
    }
  } else if (SKIP_CLIENTES) {
    console.log('\n⏭️   Clientes ignorados (--skip-clientes).');
  }

  // ── Migrar encomendas ─────────────────────────────────────────────────────
  if (!SKIP_ENCOMENDAS && encomendasRaw?.registros?.length > 0) {
    console.log('\n📦  Migrando encomendas…');
    console.log(`  Total: ${totalEncomendas} registros`);

    try {
      const r = await apiPut('/api/encomendas/bulk', { registros: encomendasRaw.registros });
      if (r.ok || r.dryRun) {
        console.log(`  ✅  Encomendas migradas com sucesso!`);
      } else {
        console.error(`  ❌  Falha na importação de encomendas`);
      }
    } catch (e) {
      console.error(`  ❌  Erro ao importar encomendas: ${e.message}`);
      process.exit(1);
    }
  } else if (SKIP_ENCOMENDAS) {
    console.log('\n⏭️   Encomendas ignoradas (--skip-encomendas).');
  } else if (!encomendasRaw?.registros?.length) {
    console.log('\n  Nenhum pedido encontrado nos dados — pulando.');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migração concluída.                                  ');
  console.log('  Próximos passos:                                     ');
  console.log('  1. Verifique os dados no painel admin                ');
  console.log('  2. Faça login e confirme Fidelidade e Encomendas     ');
  console.log('  3. Execute os testes de staging                      ');
  console.log('  4. Aguarde aprovação antes de promover para produção ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Concluído: ${new Date().toISOString()}`);
  console.log('');
}

main().catch(e => {
  // Nunca imprimir o stack trace completo — pode conter dados sensíveis
  console.error(`Erro fatal: ${e.message}`);
  process.exit(1);
});
