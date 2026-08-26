#!/usr/bin/env node
/**
 * Auto-correção determinística das regras do site Itapolitana.
 *
 * Uso:
 *   node scripts/auto-corrigir-regras.js --check  # detecta divergências sem escrever
 *   node scripts/auto-corrigir-regras.js --fix    # aplica apenas correções catalogadas
 *
 * Segurança: não acessa APIs, não publica, não altera JSON de dados, não altera
 * Worker/bindings/secrets e aborta quando o texto esperado não aparece exatamente.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--fix');
const CHECK = process.argv.includes('--check') || !APPLY;
const changes = [];
const backups = [];

function rel(file) { return path.relative(ROOT, file); }
function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function ensureCount(source, needle, expected, label) {
  const count = source.split(needle).length - 1;
  if (count !== expected) throw new Error(`${label}: esperado ${expected}, encontrado ${count}`);
}
function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count === 0 && source.includes(to)) return source;
  if (count !== 1) throw new Error(`${label}: esperado 1, encontrado ${count}`);
  return source.replace(from, to);
}
function patchFile(relative, transform) {
  const file = path.join(ROOT, relative);
  const before = read(file);
  const after = transform(before);
  if (after === before) return;
  if (APPLY) {
    const backup = path.join(ROOT, 'alteracoes', `auto-corrigir-regras-${new Date().toISOString().slice(0, 10)}`, 'before', relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, before, 'utf8');
    backups.push(rel(backup));
    write(file, after);
  }
  changes.push(rel(file));
}
function patchRootHtmls(transform) {
  for (const name of fs.readdirSync(ROOT).filter((n) => n.endsWith('.html'))) patchFile(name, transform);
}

function patchNavigation(source) {
  const mobileStart = source.indexOf('@media (max-width: 600px) {');
  const smallStart = source.indexOf('@media (max-width: 380px) {', mobileStart);
  if (mobileStart < 0 || smallStart < 0) throw new Error('blocos mobile do cabeçalho não encontrados');
  let mobile = source.slice(mobileStart, smallStart);
  mobile = mobile.replaceAll('gap: 4px !important;', 'gap: 10px !important;');
  mobile = mobile.replaceAll('min-height: 38px !important;', 'min-height: 56px !important;');
  mobile = mobile.replaceAll('height: 38px !important;', 'height: 56px !important;');
  mobile = mobile.replaceAll('border-radius: 9px !important;', 'border-radius: 12px !important;');
  mobile = mobile.replaceAll('border-width: 1px !important;', 'border-width: 2px !important;');
  let small = source.slice(smallStart);
  small = small.replaceAll('gap: 3px !important;', 'gap: 8px !important;');
  small = small.replaceAll('min-height: 36px !important;', 'min-height: 54px !important;');
  small = small.replaceAll('height: 36px !important;', 'height: 54px !important;');
  return source.slice(0, mobileStart) + mobile + small;
}

patchFile('scripts/gaveta-navegacao-mestra.js', patchNavigation);

patchFile('scripts/ita-bot-widget-v2027.js', (source) => {
  const topic = `    picoleGratis: {
      titulo: '🍦 Como brincar de encontrar um Picolé',
      textos: [
        'Primeiro, espere aparecer “ENCONTRE UM PICOLÉ · CLIQUE AQUI”. Normalmente, o ItaBot mostra DÚVIDAS.',
        'Quando a frase especial aparecer, toque no robô dentro de 5 segundos. O primeiro toque válido do dia é conferido pelo site.',
        'Se você for o ganhador, aparece um formulário só da brincadeira. Escreva seu nome completo e WhatsApp com DDD 16; peça ajuda a um adulto se precisar.',
        'Depois, o site mostra um código. Toque no WhatsApp e depois em Enviar para combinar a retirada na loja. Não há entrega em casa.',
        'Há 1 ganhador por dia. Ver a página ou tocar fora do tempo não garante Picolé.'
      ],
      linkTexto: 'Ver o passo a passo na Promoção',
      linkUrl: 'promocao.html'
    },
`;
  let updated = source;
  if (!updated.includes('    picoleGratis: {')) {
    updated = replaceOnce(updated, '    horario: {', topic + '    horario: {', 'tema picoleGratis');
  }
  const promoMarker = "onclick=\"_itabotMostrarTema(\\'picoleGratis\\')\"";
  if (!updated.includes(promoMarker)) {
    const oldButton = `              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\\'horario\\')"><span style="font-size:18px;">⏰</span><span style="flex:1;text-align:left;font-weight:900;">Horário de Funcionamento</span><span style="font-size:18px;color:#888;">›</span></button>',\n`;
    const promoButton = `              '<button type="button" class="fale-tema-btn fale-tema-picole" onclick="_itabotMostrarTema(\\'picoleGratis\\')"><span style="font-size:18px;">🍦</span><span style="flex:1;text-align:left;font-weight:900;">Como funciona: Encontre um Picolé</span><span style="font-size:18px;color:#888;">›</span></button>',\n`;
    updated = replaceOnce(updated, oldButton, promoButton + oldButton, 'botão do tema picolé no menu');
  }
  return updated;
});

patchFile('scripts/itap-picole-promo.js', (source) => {
  let updated = replaceOnce(source, "launcher.setAttribute('aria-label', 'Abrir promoção do picolé grátis');", "launcher.setAttribute('aria-label', 'Abrir promoção Encontre um Picolé');", 'aria-label ativo');
  updated = replaceOnce(updated, "ledTrack.textContent = '🍦 PICOLÉ GRÁTIS AGORA! CLIQUE RÁPIDO!   •   ';", "ledTrack.textContent = '🍦 ENCONTRE UM PICOLÉ · CLIQUE AQUI!   •   ';", 'chamado LED ativo');
  updated = replaceOnce(updated, `  function _validPhone(v) {\n    var d = String(v).replace(/\\D/g, '');\n    return /^\\d{10,11}$/.test(d);\n  }`, `  function _validPhone(v) {\n    var d = String(v).replace(/\\D/g, '');\n    return /^169\\d{8}$/.test(d);\n  }`, 'validação DDD 16');
  return updated;
});

patchFile('promocao.html', (source) => {
  const required = [
    ['guia infantil', 'class="picole-kids-guide"'],
    ['cinco passos', 'class="picole-kids-step"'],
    ['frase normal de Dúvidas', 'DÚVIDAS · CLIQUE AQUI'],
    ['chamado especial', 'ENCONTRE UM PICOLÉ · CLIQUE AQUI'],
    ['janela de cinco segundos', 'exatos 5 segundos'],
    ['um ganhador diário', '1 ganhador por dia'],
    ['formulário exclusivo', 'formulário especial'],
    ['regulamento infantil', 'id="picole-rules-box"']
  ];
  for (const [label, needle] of required) {
    if (!source.includes(needle)) throw new Error(`Promoção: ${label} ausente`);
  }
  if (/servidor|server/i.test(source)) throw new Error('Promoção: copy pública contém servidor/server');
  return source;
});
// Qualquer script alterado recebe nova query para vencer Cache First do Service Worker.
patchRootHtmls((source) => source
  .replaceAll('scripts/ita-bot-widget-v2027.js?v=2027-floating-safe-20260825-cssfix1', 'scripts/ita-bot-widget-v2027.js?v=20260825-itabot-positioning1')
  .replaceAll('scripts/itap-picole-promo.js?v=20260825-picole-led-fix1', 'scripts/itap-picole-promo.js?v=20260825-itabot-positioning1')
  .replace(/scripts\/gaveta-navegacao-mestra\.js\?v=[^"']+/g, 'scripts/gaveta-navegacao-mestra.js?v=20260825-autofix-nav1'));

const unique = [...new Set(changes)];
console.log(`${APPLY ? 'AUTO_CORRECAO_APLICADA' : 'AUTO_CORRECAO_PREVISTA'} — ${unique.length} arquivo(s)`);
unique.forEach((file) => console.log(`- ${file}`));
if (APPLY) console.log(`BACKUPS — ${backups.length} arquivo(s)`);
if (CHECK && unique.length) process.exitCode = 1;
