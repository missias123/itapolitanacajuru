#!/usr/bin/env node
/**
 * migrate-data.js — Script de migração de dados para o Cloudflare Worker
 *
 * Importa clientes.json, encomendas.json e vinculos_clientes.json
 * para o backend seguro (Cloudflare Worker + KV).
 *
 * Uso:
 *   node migrate-data.js \
 *     --api   https://api.itapolitanacajuru.com.br \
 *     --secret SEU_ADMIN_SECRET \
 *     --clientes    caminho/para/backup/clientes.json \
 *     --encomendas  caminho/para/backup/encomendas.json \
 *     --vinculos    caminho/para/backup/vinculos_clientes.json
 *
 * Flags opcionais:
 *   --dry-run   Exibe o que seria enviado sem fazer requisições reais
 *   --skip-clientes / --skip-encomendas  Pula a migração do recurso correspondente
 *
 * Requer Node.js 18+ (fetch nativo).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(flag, defaultVal = null) {
  const idx = args.indexOf(flag);
  return idx > -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

function hasFlag(flag) {
  return args.includes(flag);
}

const API_URL        = getArg('--api',         'http://localhost:8787');
const ADMIN_SECRET   = getArg('--secret');
const CLIENTES_PATH  = getArg('--clientes');
const ENCOMENDAS_PATH= getArg('--encomendas');
const VINCULOS_PATH  = getArg('--vinculos');
const DRY_RUN        = hasFlag('--dry-run');
const SKIP_CLIENTES  = hasFlag('--skip-clientes');
const SKIP_ENCOMENDAS= hasFlag('--skip-encomendas');

if (!ADMIN_SECRET) {
  console.error('❌  --secret é obrigatório. Use: node migrate-data.js --secret <ADMIN_SECRET>');
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    console.error(`❌  Falha ao ler ${resolved}: ${e.message}`);
    return null;
  }
}

async function apiPut(endpoint, data) {
  const url = `${API_URL}${endpoint}`;
  if (DRY_RUN) {
    console.log(`[DRY-RUN] PUT ${url}`);
    console.log(JSON.stringify(data, null, 2).slice(0, 400) + '…');
    return { ok: true, dryRun: true };
  }

  const resp = await fetch(url, {
    method:  'PUT',
    headers: {
      'Content-Type':       'application/json',
      'X-Itap-Admin-Secret': ADMIN_SECRET,
    },
    body: JSON.stringify(data),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${json.error ?? JSON.stringify(json)}`);
  }
  return json;
}

async function healthCheck() {
  try {
    const resp = await fetch(`${API_URL}/api/health`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    console.log(`✅  Worker online — versão ${d.version ?? '?'} (${new Date(d.ts).toISOString()})`);
    return true;
  } catch (e) {
    console.error(`❌  Worker não acessível em ${API_URL}: ${e.message}`);
    return false;
  }
}

// ─── Merge clientes + vinculos_clientes ───────────────────────────────────────
/**
 * vinculos_clientes.json tem formato { clientes: { <cel>: { nome, cel, ... } } }
 * Mescla com o formato padrão de clientes.json (chaves USR-XXXX).
 * Clientes novos (de vinculos) recebem IDs USR-2026-XXXX sequenciais.
 */
function mergeClientes(clientesData, vinculosData) {
  const merged       = { ...(clientesData?.clientes ?? {}) };
  const indiceCelular= { ...(clientesData?.indice_celular ?? {}) };

  if (!vinculosData?.clientes) return { clientes: merged, indice_celular: indiceCelular };

  // Find max existing counter
  let maxNum = Object.keys(merged).reduce((acc, k) => {
    const m = k.match(/USR-\d+-(\d+)$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);

  const vinculoClientes = vinculosData.clientes;
  for (const [chave, c] of Object.entries(vinculoClientes)) {
    if (!c) continue;
    const cel = String(c.cel ?? chave).replace(/\D/g, '');
    if (!cel) continue;

    // Skip if already present by cel
    if (indiceCelular[cel]) {
      console.log(`  ↩  Vínculo ignorado (cel já existe): ${cel}`);
      continue;
    }

    maxNum += 1;
    const novoId = `USR-2026-${String(maxNum).padStart(4, '0')}`;
    const agora  = new Date().toISOString();

    merged[novoId] = {
      id_permanente:        novoId,
      id_hash:              '',           // sem hash — será regenerado pelo Worker se necessário
      nome:                 c.nome  ?? 'Sem Nome',
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
      historico_alteracoes: [{ data: agora, tipo: 'importacao', descricao: 'Importado de vinculos_clientes.json', por: 'migrate-data.js' }],
      _origem:              'vinculos_clientes',
    };
    indiceCelular[cel] = novoId;
    console.log(`  ✚  Vínculo importado como ${novoId}: ${c.nome ?? '?'} (${cel})`);
  }

  return { clientes: merged, indice_celular: indiceCelular };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migração de dados — Itapolitana → Cloudflare Worker  ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API:      ${API_URL}`);
  console.log(`  Dry-run:  ${DRY_RUN ? 'SIM (sem escrita real)' : 'NÃO'}`);
  console.log('');

  if (!DRY_RUN) {
    const ok = await healthCheck();
    if (!ok) {
      console.error('Abortando — Worker indisponível.');
      process.exit(1);
    }
  }

  // ── Migrar clientes ──────────────────────────────────────────────────────
  if (!SKIP_CLIENTES) {
    console.log('\n📋  Migrando clientes…');
    const clientesRaw = loadJson(CLIENTES_PATH, 'clientes.json');
    const vinculosRaw = loadJson(VINCULOS_PATH, 'vinculos_clientes.json');

    if (clientesRaw || vinculosRaw) {
      const merged = mergeClientes(clientesRaw, vinculosRaw);
      const total  = Object.keys(merged.clientes).length;
      console.log(`  Total de clientes a importar: ${total}`);

      try {
        const r = await apiPut('/api/clientes/bulk', merged);
        if (r.ok) {
          console.log(`  ✅  Clientes importados com sucesso! (${r.total ?? total} registros)`);
        } else {
          console.error(`  ❌  Falha na importação de clientes: ${JSON.stringify(r)}`);
        }
      } catch (e) {
        console.error(`  ❌  Erro ao importar clientes: ${e.message}`);
      }
    } else {
      console.log('  Nenhum dado de clientes fornecido — pulando.');
    }
  } else {
    console.log('\n⏭️   Clientes ignorados (--skip-clientes).');
  }

  // ── Migrar encomendas ────────────────────────────────────────────────────
  if (!SKIP_ENCOMENDAS) {
    console.log('\n📦  Migrando encomendas…');
    const encomendasRaw = loadJson(ENCOMENDAS_PATH, 'encomendas.json');

    if (encomendasRaw?.registros && encomendasRaw.registros.length > 0) {
      const total = encomendasRaw.registros.length;
      console.log(`  Total de pedidos a importar: ${total}`);

      try {
        const r = await apiPut('/api/encomendas/bulk', { registros: encomendasRaw.registros });
        if (r.ok) {
          console.log(`  ✅  Pedidos importados com sucesso! (${r.total ?? total} registros)`);
        } else {
          console.error(`  ❌  Falha na importação de pedidos: ${JSON.stringify(r)}`);
        }
      } catch (e) {
        console.error(`  ❌  Erro ao importar pedidos: ${e.message}`);
      }
    } else {
      console.log('  Nenhum pedido encontrado no arquivo — pulando.');
    }
  } else {
    console.log('\n⏭️   Encomendas ignoradas (--skip-encomendas).');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Migração concluída.                                  ');
  console.log('  Próximos passos:                                     ');
  console.log('  1. Verifique os dados no painel admin                ');
  console.log('  2. Faça login no painel com o Segredo Worker         ');
  console.log('  3. Confirme que Fidelidade e Encomendas carregam     ');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
