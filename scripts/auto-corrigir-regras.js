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
      titulo: '🍦 Como funciona: Encontre um Picolé',
      textos: [
        'Esta é a promoção relâmpago do ItaBot. Ela é separada do sorteio mensal da torta e usa um formulário exclusivo.',
        'Quando o servidor confirmar a ativação e o LED mostrar “ENCONTRE UM PICOLÉ · CLIQUE AQUI”, a janela fica aberta por exatamente 5 segundos.',
        'O primeiro clique válido do dia abre o formulário exclusivo. Existe somente um vencedor por dia. Depois do clique, o ItaBot volta para Dúvidas.',
        'O formulário pede nome completo e WhatsApp com DDD 16. Após o envio confirmado, você recebe um código de retirada na tela. Um botão abre o WhatsApp com a mensagem de agendamento; é necessário tocar em “Enviar”.',
        'A retirada é presencial na loja, conforme a orientação da equipe. A promoção não tem delivery e não permite novo cadastro duplicado no mesmo dia. O segundo exato sorteado muda a cada dia e não se repete no ciclo de 30 dias.'
      ],
      linkTexto: 'Ver regras completas na Promoção',
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
  let updated = source;
  updated = replaceOnce(updated, 'PROMOÇÃO ROBÔ ITABOT — 1 PICOLÉ DE FRUTA GRÁTIS POR CLIQUE', 'PROMOÇÃO ITABOT — ENCONTRE UM PICOLÉ', 'título técnico do bloco');
  updated = replaceOnce(updated, '🍦 ALERTA PICOLÉ RELÂMPAGO · 1 POR DIA · 5 SEGUNDOS PARA CLICAR', '🍦 ENCONTRE UM PICOLÉ · 1 VENCEDOR POR DIA · 5 SEGUNDOS', 'badge da promoção');
  updated = replaceOnce(updated, '🍦 1 Picolé por Clique Vencedor', '🍦 ENCONTRE UM PICOLÉ', 'chamada principal');
  updated = replaceOnce(updated, 'Ganhe 1&nbsp;<span style="color:#FFD600;">Picolé de Fruta</span><br>Grátis por Cadastro!', 'Encontre 1&nbsp;<span style="color:#FFD600;">Picolé de Fruta</span><br>no chamado do ItaBot!', 'headline da promoção');
  updated = replaceOnce(updated, 'Cada clique no <strong style="color:#FFD600;">Robô ItaBot</strong> gera <strong>1 cadastro</strong>, e cada cadastro vencedor garante <strong>1 picolé de fruta grátis</strong>. Clicou, cadastrou, ganhou — simples assim!', 'Quando o servidor confirmar a ativação, o primeiro clique válido durante os <strong>5 segundos</strong> abre o formulário exclusivo. Há <strong>1 vencedor por dia</strong>; o clique sozinho não garante o prêmio.', 'descrição sem ambiguidade');
  updated = replaceOnce(updated, 'Passo 2 — Quando piscar, clique RÁPIDO!', 'Passo 2 — Quando aparecer, clique em até 5 segundos', 'passo 2 título');
  updated = replaceOnce(updated, 'Quando o LED exibir <strong>"PICOLÉ GRÁTIS · CLIQUE AQUI"</strong>, toque imediatamente: a janela dura exatamente 5 segundos.', 'Quando o LED exibir <strong>“ENCONTRE UM PICOLÉ · CLIQUE AQUI”</strong>, toque dentro da janela de <strong>exatos 5 segundos</strong>. Depois disso, o chamado desaparece.', 'passo 2 LED');
  updated = replaceOnce(updated, 'Passo 3 — Preencha nome e WhatsApp', 'Passo 3 — Use o formulário exclusivo', 'passo 3 título');
  updated = replaceOnce(updated, 'Um formulário rápido abre automaticamente. Digite seu <strong>nome completo</strong> e <strong>WhatsApp DDD 16</strong>. Leva menos de 20 segundos.', 'O clique válido abre outro formulário, separado de Dúvidas. Informe seu <strong>nome completo</strong>, <strong>WhatsApp DDD 16</strong> e aceite os termos.', 'passo 3 descrição');
  updated = replaceOnce(updated, 'Passo 4 — Confirme e retire!', 'Passo 4 — Aguarde o código e retire na loja', 'passo 4 título');
  updated = replaceOnce(updated, 'Se for o primeiro, você recebe confirmação no <strong>WhatsApp</strong>. Agende a retirada pelo WhatsApp e vá à sorveteria apenas na <strong>segunda, quarta ou sexta</strong> para retirar seu picolé de fruta grátis! 🍦', 'Se você for o vencedor do dia, o sistema confirma a reserva e mostra um código. Depois, você pode tocar no botão para abrir o <strong>WhatsApp</strong> com a mensagem de agendamento; é necessário tocar em <strong>Enviar</strong>. A retirada é <strong>presencial na loja</strong>, nas condições informadas pela equipe. Não há delivery. 🍦', 'passo 4 descrição');
  updated = replaceOnce(updated, 'ATENÇÃO: O PICOLÉ GRÁTIS APARECE NO SITE!', 'ATENÇÃO: SÓ VALE QUANDO O SERVIDOR CONFIRMAR', 'alerta de ativação');
  updated = replaceOnce(updated, 'O aviso no robô aparece por apenas <strong>alguns segundos</strong>. Assim que surgir <strong>"PICOLÉ GRÁTIS"</strong>, clique na hora para não perder sua chance!', 'A explicação abaixo mostra a mecânica prevista. A participação só aparece quando o servidor confirmar a campanha ativa e o LED mostrar <strong>“ENCONTRE UM PICOLÉ · CLIQUE AQUI”</strong> por <strong>exatos 5 segundos</strong>.', 'alerta sem tempo vago');
  const oldRules = `          <ul style="margin-left:18px;">
            <li><strong>1 clique = 1 cadastro = 1 picolé:</strong> Cada clique no robô ItaBot abre 1 cadastro. Cada cadastro vencedor garante exatamente 1 (um) Picolé de Fruta Grátis à escolha. Clicar não garante picolé todo dia — apenas o cadastro do clique vencedor é premiado.</li>
            <li><strong>Como vencer:</strong> Ser o <strong>primeiro</strong> a clicar no robô quando o LED piscar amarelo e completar o formulário com dados válidos. Apenas o primeiro clique válido de cada ativação é aceito.</li>
            <li><strong>Ativações:</strong> O robô pode ativar aleatoriamente somente entre <strong>11h e 20h</strong>. Pode não ativar todos os dias — não há garantia de ativação diária.</li>
            <li><strong>Celular DDD 16:</strong> Exclusivo para WhatsApp com DDD 16. Números de outras regiões não são aceitos.</li>
            <li><strong>Limite por número:</strong> Um mesmo número de WhatsApp pode ganhar no máximo 1 vez por semana, mesmo que clique em todas as ativações.</li>
            <li><strong>Retirada:</strong> Obrigatoriamente agendada pelo WhatsApp e realizada somente na <strong>segunda, quarta ou sexta</strong>, dentro do horário de funcionamento da sorveteria.</li>
            <li><strong>Documento:</strong> Apresente o comprovante de reserva recebido no WhatsApp ao atendente.</li>
            <li><strong>Sem transferência:</strong> A reserva é pessoal e intransferível.</li>
            <li><strong>A Itapolitana reserva o direito</strong> de alterar, pausar ou encerrar a promoção a qualquer momento, com aviso prévio no site.</li>
          </ul>`;
  const newRules = `          <ul style="margin-left:18px;">
            <li><strong>O que é:</strong> “Encontre um Picolé” é uma promoção separada do sorteio mensal da torta e do formulário de Dúvidas.</li>
            <li><strong>Quando vale:</strong> somente quando o servidor confirmar a campanha ativa e o LED mostrar <strong>“ENCONTRE UM PICOLÉ · CLIQUE AQUI”</strong>.</li>
            <li><strong>Janela exata:</strong> o chamado fica disponível por <strong>exatos 5 segundos</strong>. Fora desse intervalo, o clique volta a abrir Dúvidas.</li>
            <li><strong>Um vencedor por dia:</strong> o servidor aceita apenas o primeiro clique válido do dia. Os demais recebem a informação de que a oportunidade já terminou.</li>
            <li><strong>Um formulário exclusivo:</strong> o clique válido abre o formulário do Picolé, separado do formulário de Dúvidas. Um mesmo envio não cria outro cadastro nem outro código.</li>
            <li><strong>Dados obrigatórios:</strong> informe nome completo e celular com <strong>DDD 16</strong>, aceite os termos e envie somente uma vez.</li>
            <li><strong>Confirmação:</strong> se você for o vencedor, o sistema confirma a reserva e exibe um código. Um botão abre o WhatsApp com a mensagem de agendamento; o envio só acontece depois que você tocar em <strong>Enviar</strong>.</li>
            <li><strong>Retirada:</strong> o prêmio é retirado pessoalmente na loja, conforme data e orientação informadas pela equipe. <strong>Não há delivery.</strong></li>
            <li><strong>Horário imprevisível:</strong> cada dia recebe um segundo exato diferente dentro da faixa de 11h a 20h; a faixa se repete, mas o segundo sorteado não se repete no ciclo de 30 dias.</li>
            <li><strong>Sem garantia fora da ativação:</strong> ver a página ou clicar fora dos 5 segundos não garante prêmio. A disponibilidade depende da confirmação do servidor.</li>
          </ul>`;
  updated = replaceOnce(updated, oldRules, newRules, 'regulamento completo');
  updated = replaceOnce(updated, '<script src="scripts/itap-picole-promo.js?v=20260825-picole-led-fix1" defer></script>', '<script src="scripts/ita-bot-widget-v2027.js?v=20260825-encontre-picole1" defer></script>\n<script src="scripts/itap-picole-promo.js?v=20260825-encontre-picole1" defer></script>', 'widget na página Promoção');
  return updated;
});

// Qualquer script alterado recebe nova query para vencer Cache First do Service Worker.
patchRootHtmls((source) => source
  .replaceAll('scripts/ita-bot-widget-v2027.js?v=2027-floating-safe-20260825-cssfix1', 'scripts/ita-bot-widget-v2027.js?v=20260825-encontre-picole1')
  .replaceAll('scripts/itap-picole-promo.js?v=20260825-picole-led-fix1', 'scripts/itap-picole-promo.js?v=20260825-encontre-picole1')
  .replace(/scripts\/gaveta-navegacao-mestra\.js\?v=[^"']+/g, 'scripts/gaveta-navegacao-mestra.js?v=20260825-autofix-nav1'));

const unique = [...new Set(changes)];
console.log(`${APPLY ? 'AUTO_CORRECAO_APLICADA' : 'AUTO_CORRECAO_PREVISTA'} — ${unique.length} arquivo(s)`);
unique.forEach((file) => console.log(`- ${file}`));
if (APPLY) console.log(`BACKUPS — ${backups.length} arquivo(s)`);
if (CHECK && unique.length) process.exitCode = 1;
