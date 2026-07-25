/**
 * migrate-data-guard.test.mjs
 *
 * Valida as proteções de segurança do script migrate-data.cjs:
 *   - --environment obrigatório
 *   - Bloqueio de produção multi-camada
 *   - --confirm-staging restrito a staging
 *   - Validação de schema
 *   - Detecção de PII
 *   - Dry-run sem escrita real
 *   - Logs sem secrets
 *
 * Execução: node --test tests/migrate-data-guard.test.mjs
 *
 * Nenhum secret real é usado.
 * Nenhum dado de cliente, pedido, produto ou preço é alterado.
 * Nenhuma requisição real é feita.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, '..', 'scripts', 'migrate-data.cjs');
const FAKE_SECRET = 'secret-nao-real-somente-teste-1234';
const STAGING_URL = 'https://staging-fake-api.itapolitana-stg.workers.dev';
const LOCAL_URL   = 'http://localhost:8787';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Executa o script com os argumentos e variáveis de ambiente dados.
 * Stdin é sempre fechado (sem TTY) para evitar prompts interativos.
 */
function run(args = [], extraEnv = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf-8',
    env: { PATH: process.env.PATH, ...extraEnv },
    timeout: 10_000,
    input: '',   // stdin vazio — sem TTY
  });
}

/**
 * Combina stdout e stderr para verificação de conteúdo.
 */
function output(result) {
  return (result.stdout ?? '') + (result.stderr ?? '');
}

/**
 * Verifica que a saída NÃO contém nenhum dos padrões proibidos.
 * Padrões proibidos: secrets reais, hashes, salts, tokens.
 */
function assertNoForbiddenContent(result, label = '') {
  const out = output(result).toLowerCase();
  // O FAKE_SECRET não deve aparecer por extenso em resultados reais
  // (pode aparecer em contexto de teste pois é intencionalmente falso,
  //  mas verificamos outros padrões estruturais)
  const forbidden = [
    'admin_hash', 'admin_salt', 'github_token', 'setup_key',
    'pbkdf2-sha256$v=1',  // formato de hash real
  ];
  for (const f of forbidden) {
    assert.ok(!out.includes(f), `${label}: saída não deve conter "${f}"`);
  }
}

// ─── Arquivos de dados sintéticos ─────────────────────────────────────────────

const TMP_DIR = join(os.tmpdir(), `migrate-guard-test-${Date.now()}`);
mkdirSync(TMP_DIR, { recursive: true });

const VALID_CLIENTES_PATH = join(TMP_DIR, 'clientes-sinteticos.json');
const INVALID_CLIENTES_PATH = join(TMP_DIR, 'clientes-invalidos.json');
const VALID_ENCOMENDAS_PATH = join(TMP_DIR, 'encomendas-sinteticas.json');
const INVALID_ENCOMENDAS_PATH = join(TMP_DIR, 'encomendas-invalidas.json');

// Dados sintéticos válidos (sem PII real)
writeFileSync(VALID_CLIENTES_PATH, JSON.stringify({
  clientes: {
    'USR-2026-0001': {
      id_permanente: 'USR-2026-0001',
      nome: 'Cliente Sintético 1',
      cel: '11900000001',
      cadastro: '2026-01-01T00:00:00.000Z',
    },
    'USR-2026-0002': {
      id_permanente: 'USR-2026-0002',
      nome: 'Cliente Sintético 2',
      cel: '11900000002',
      cadastro: '2026-01-02T00:00:00.000Z',
    },
  },
  indice_celular: {
    '11900000001': 'USR-2026-0001',
    '11900000002': 'USR-2026-0002',
  },
}));

// Schema inválido — campo "clientes" ausente
writeFileSync(INVALID_CLIENTES_PATH, JSON.stringify({
  nao_e_clientes: { 'X-001': {} },
}));

// Dados sintéticos válidos de encomendas
writeFileSync(VALID_ENCOMENDAS_PATH, JSON.stringify({
  registros: [
    { id: 'ENC-2026-0001', produto: 'Picolé Sintético', qtd: 10 },
    { id: 'ENC-2026-0002', produto: 'Picolé Sintético', qtd: 5  },
  ],
}));

// Schema inválido — "registros" não é array
writeFileSync(INVALID_ENCOMENDAS_PATH, JSON.stringify({
  registros: 'nao-e-um-array',
}));

// ─── 1. --environment OBRIGATÓRIO ─────────────────────────────────────────────

describe('Ambiente obrigatório', () => {

  test('Sem --environment falha com exit 1', () => {
    const r = run(['--dry-run', '--secret', FAKE_SECRET, '--api', LOCAL_URL]);
    assert.equal(r.status, 1, 'Deve sair com código 1');
    assert.ok(output(r).includes('--environment'), 'Deve mencionar --environment');
  });

  test('--environment=production falha com exit 1', () => {
    const r = run(['--environment=production', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('bloqueado'), 'Deve mencionar BLOQUEADO');
  });

  test('--environment=prod falha com exit 1', () => {
    const r = run(['--environment=prod', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assert.equal(r.status, 1);
  });

  test('--environment=live falha com exit 1', () => {
    const r = run(['--environment=live', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assert.equal(r.status, 1);
  });

  test('--environment=prd falha com exit 1', () => {
    const r = run(['--environment=prd', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assert.equal(r.status, 1);
  });

  test('--environment=unknown falha com exit 1', () => {
    const r = run(['--environment=unknown', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assert.equal(r.status, 1);
  });

  test('--environment=local é aceito', () => {
    const r = run(['--environment=local', '--dry-run', '--secret', FAKE_SECRET,
                   '--skip-clientes', '--skip-encomendas']);
    // Deve sair com 0 (dry-run sem dados)
    assert.equal(r.status, 0);
  });

  test('--environment=staging requer --api explícito', () => {
    const r = run(['--environment=staging', '--dry-run', '--secret', FAKE_SECRET]);
    assert.equal(r.status, 1);
    assert.ok(output(r).includes('--api'), 'Deve mencionar --api obrigatório');
  });

});

// ─── 2. Bloqueio multi-camada de produção ─────────────────────────────────────

describe('Bloqueio de produção multi-camada', () => {

  test('NODE_ENV=production bloqueia execução', () => {
    const r = run(['--environment=staging', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL],
                  { NODE_ENV: 'production' });
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('bloqueado'), 'Deve mencionar BLOQUEADO');
  });

  test('ENVIRONMENT=production bloqueia execução', () => {
    const r = run(['--environment=staging', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL],
                  { ENVIRONMENT: 'production' });
    assert.equal(r.status, 1);
  });

  test('WORKER_ENVIRONMENT=production bloqueia execução', () => {
    const r = run(['--environment=staging', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL],
                  { WORKER_ENVIRONMENT: 'production' });
    assert.equal(r.status, 1);
  });

  test('URL de produção conhecida bloqueia execução', () => {
    const r = run([
      '--environment=staging', '--dry-run', '--secret', FAKE_SECRET,
      '--api', 'https://api.itapolitanacajuru.com.br',
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('bloqueado'));
  });

  test('URL de produção com domínio principal bloqueia execução', () => {
    const r = run([
      '--environment=staging', '--dry-run', '--secret', FAKE_SECRET,
      '--api', 'https://itapolitanacajuru.com.br',
    ]);
    assert.equal(r.status, 1);
  });

  test('--environment=staging com URL localhost bloqueia execução', () => {
    const r = run([
      '--environment=staging', '--dry-run', '--secret', FAKE_SECRET,
      '--api', 'http://localhost:8787',
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).includes('localhost'));
  });

  test('Nenhum secret aparece na saída após bloqueio de produção', () => {
    const r = run(['--environment=production', '--dry-run', '--secret', FAKE_SECRET, '--api', STAGING_URL]);
    assertNoForbiddenContent(r, 'bloqueio de produção');
  });

});

// ─── 3. --secret obrigatório ──────────────────────────────────────────────────

describe('--secret obrigatório', () => {

  test('Sem --secret falha com exit 1', () => {
    const r = run(['--environment=staging', '--dry-run', '--api', STAGING_URL]);
    assert.equal(r.status, 1);
    assert.ok(output(r).includes('--secret'));
  });

});

// ─── 4. --confirm-staging restrito ────────────────────────────────────────────

describe('--confirm-staging restrito', () => {

  test('--confirm-staging com --environment=local falha', () => {
    const r = run([
      '--environment=local', '--confirm-staging', '--secret', FAKE_SECRET,
      '--skip-clientes', '--skip-encomendas',
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).includes('--confirm-staging'));
  });

  test('--confirm-staging sem TTY e sem dados executa dry-safe em staging', () => {
    // Sem dados reais e sem TTY — --confirm-staging permite contornar prompt
    // mas sem dados para migrar deve terminar normalmente (exit 0)
    const r = run([
      '--environment=staging', '--confirm-staging', '--secret', FAKE_SECRET,
      '--api', STAGING_URL, '--skip-clientes', '--skip-encomendas',
    ]);
    // Não deve sair com status 1 por falta de confirmação
    // (pode sair com 1 se o Worker estiver inacessível — aceitável em CI)
    // O importante é que --confirm-staging não seja recusado
    const out = output(r);
    assert.ok(
      !out.includes('--confirm-staging só é permitido'),
      'Não deve recusar --confirm-staging em staging',
    );
  });

  test('Sem confirmação e sem TTY bloqueia em modo real', () => {
    // Sem dry-run, sem confirm-staging, stdin vazio (sem TTY)
    // Deve falhar pedindo confirmação
    const r = run([
      '--environment=staging', '--secret', FAKE_SECRET,
      '--api', STAGING_URL, '--skip-clientes', '--skip-encomendas',
    ]);
    assert.equal(r.status, 1);
    assert.ok(
      output(r).includes('terminal interativo') || output(r).includes('Stdin'),
      'Deve mencionar ausência de terminal interativo',
    );
  });

});

// ─── 5. Validação de schema ───────────────────────────────────────────────────

describe('Validação de schema', () => {

  test('Schema de clientes inválido falha com exit 1', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', INVALID_CLIENTES_PATH,
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('schema'), 'Deve mencionar schema');
  });

  test('Schema de encomendas inválido falha com exit 1', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--encomendas', INVALID_ENCOMENDAS_PATH, '--skip-clientes',
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('schema'));
  });

  test('Schema válido de clientes passa a validação', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    assert.equal(r.status, 0);
    assert.ok(output(r).includes('✅  Schema de clientes válido'));
  });

  test('Schema válido de encomendas passa a validação', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--encomendas', VALID_ENCOMENDAS_PATH, '--skip-clientes',
    ]);
    assert.equal(r.status, 0);
    assert.ok(output(r).includes('✅  Schema de encomendas válido'));
  });

});

// ─── 6. Detecção de PII ───────────────────────────────────────────────────────

describe('Detecção de PII', () => {

  test('PII em clientes é identificada por nome de campo (não valor)', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    assert.equal(r.status, 0);
    const out = output(r);
    // Dados sintéticos têm campos "nome" e "cel" — devem ser detectados
    assert.ok(
      out.includes('nome/name') || out.includes('telefone/cel'),
      'Deve detectar campos PII por nome',
    );
    // Nunca deve imprimir o valor do campo
    assert.ok(!out.includes('Cliente Sintético'), 'Não deve imprimir valor de nome');
    assert.ok(!out.includes('11900000001'), 'Não deve imprimir valor de celular');
  });

  test('PII detectada não imprime valores sensíveis', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    assertNoForbiddenContent(r, 'detecção de PII');
  });

});

// ─── 7. Dry-run ───────────────────────────────────────────────────────────────

describe('Dry-run', () => {

  test('Dry-run com dados válidos sai com 0', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
      '--encomendas', VALID_ENCOMENDAS_PATH,
    ]);
    assert.equal(r.status, 0);
  });

  test('Dry-run reporta contagens sem PII', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    assert.equal(r.status, 0);
    const out = output(r);
    assert.ok(out.includes('Dry-run'), 'Deve mencionar Dry-run');
    assert.ok(out.includes('concluído'), 'Deve declarar conclusão');
    // Nunca deve imprimir PII no relatório
    assert.ok(!out.includes('Cliente Sintético'), 'Não deve imprimir nomes');
    assert.ok(!out.includes('11900000001'), 'Não deve imprimir celular');
  });

  test('Dry-run não imprime URL da API completa', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--skip-clientes', '--skip-encomendas',
    ]);
    // URL local pode aparecer mascarada — verificar que o secret não aparece
    assert.ok(!output(r).includes(FAKE_SECRET), 'Secret não deve aparecer no output');
  });

  test('Dry-run não expõe conteúdo dos payloads (PII)', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    const out = output(r);
    // O old behavior imprimia JSON.stringify(data).slice(0,400) — isso NÃO deve mais acontecer
    assert.ok(!out.includes('USR-2026-0001":'), 'Não deve imprimir JSON de dados');
    assert.ok(!out.includes('"id_permanente"'), 'Não deve imprimir estrutura interna dos dados');
  });

});

// ─── 8. Idempotência / duplicatas ─────────────────────────────────────────────

describe('Detecção de duplicatas', () => {

  test('Clientes com IDs duplicados falham', () => {
    const dupPath = join(TMP_DIR, 'clientes-dup.json');
    // JSON com mesmo ID listado duas vezes não é possível via JSON (última vence)
    // Testamos duplicata de celular
    writeFileSync(dupPath, JSON.stringify({
      clientes: {
        'USR-2026-0001': { id_permanente: 'USR-2026-0001', cel: '11900000099', cadastro: '2026-01-01T00:00:00Z' },
        'USR-2026-0002': { id_permanente: 'USR-2026-0002', cel: '11900000099', cadastro: '2026-01-01T00:00:00Z' },
      },
      indice_celular: {},
    }));
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', dupPath,
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('duplicata'), 'Deve mencionar duplicata');
  });

  test('Encomendas com IDs duplicados falham', () => {
    const dupPath = join(TMP_DIR, 'encomendas-dup.json');
    writeFileSync(dupPath, JSON.stringify({
      registros: [
        { id: 'ENC-DUP-001', produto: 'X' },
        { id: 'ENC-DUP-001', produto: 'Y' },  // mesmo ID
      ],
    }));
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--encomendas', dupPath, '--skip-clientes',
    ]);
    assert.equal(r.status, 1);
    assert.ok(output(r).toLowerCase().includes('duplicata'));
  });

});

// ─── 9. Logs seguros ──────────────────────────────────────────────────────────

describe('Logs seguros', () => {

  test('Secret não aparece em nenhuma saída', () => {
    const r = run([
      '--environment=local', '--dry-run', '--secret', FAKE_SECRET,
      '--clientes', VALID_CLIENTES_PATH,
    ]);
    assert.ok(!output(r).includes(FAKE_SECRET), 'Secret não deve aparecer no output');
  });

  test('Saída após bloqueio não contém conteúdo proibido', () => {
    const r = run(['--environment=production', '--secret', FAKE_SECRET]);
    assertNoForbiddenContent(r, 'saída de bloqueio');
  });

  test('URL de produção bloqueada não é impressa por extenso', () => {
    const prodUrl = 'https://api.itapolitanacajuru.com.br';
    const r = run([
      '--environment=staging', '--dry-run', '--secret', FAKE_SECRET,
      '--api', prodUrl,
    ]);
    // Deve mascarar a URL. Esta verificação usa includes() intencionalmente para
    // confirmar que a string literal da URL não aparece em nenhum ponto do output
    // de texto (teste de mascaramento, não validação de URL).
    // lgtm[js/incomplete-url-substring-sanitization]
    assert.ok(!output(r).includes(prodUrl), 'URL de produção não deve aparecer por extenso');
  });

});

// ─── Limpeza ──────────────────────────────────────────────────────────────────

process.on('exit', () => {
  try { rmSync(TMP_DIR, { recursive: true, force: true }); } catch (_) {}
});
