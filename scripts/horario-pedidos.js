/* Regra central: retirada liberada de segunda a sexta, 11h–20h (exceto feriados nacionais e municipais de Cajuru). Encomendas 10h–20h. */
(function () {
  'use strict';

  const TIMEZONE = 'America/Sao_Paulo';
  const DIAS_UTEIS = new Set([1, 2, 3, 4, 5]);
  const FERIADOS_NACIONAIS_FIXOS = new Set(['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25']);
  // Feriados municipais de Cajuru/SP: São Sebastião, Nossa Senhora de Fátima, São Bento, Aniversário da cidade.
  const FERIADOS_MUNICIPAIS_CAJURU = new Set(['01-20', '05-13', '07-11', '08-18']);
  const FERIADOS_MOVEIS_CACHE = new Map();

  const JANELAS = Object.freeze({
    retirada: { inicio: 11 * 60, fim: 20 * 60, mensagem: 'Pedidos para retirada disponíveis de segunda a sexta, das 11h00 às 20h00, exceto feriados (incluindo os regionais de Cajuru). Volte nesse horário para montar seu pedido.' },
    encomendas: { inicio: 10 * 60, fim: 20 * 60, mensagem: 'Encomendas disponíveis todos os dias, das 10h00 às 20h00. Volte nesse período para enviar sua encomenda.' }
  });

  const parametros = new URLSearchParams(location.search);
  const demonstracaoAberta = location.hostname.includes('.manus.computer') && (parametros.get('demo-retirada') === 'aberta' || location.hash.includes('demo-retirada=aberta'));
  // Liberação solicitada para testes. Ao chegar neste instante, a regra diária de 11h–20h volta a valer automaticamente.
  const RETORNO_HORARIO_NORMAL = new Date(2026, 7, 22, 11, 0, 0, 0);

  const estilo = document.createElement('style');
  estilo.textContent = '@keyframes itap-retirada-pulse{0%,100%{box-shadow:0 0 0 0 rgba(237,28,52,.34);transform:translateY(0)}50%{box-shadow:0 0 0 7px rgba(237,28,52,0);transform:translateY(-1px)}}[data-order-window]:not(.is-order-closed){animation:itap-retirada-pulse 1.8s ease-in-out infinite}[data-order-window].is-order-closed{background:#8f878b!important;color:#fff!important;filter:grayscale(1);cursor:pointer!important;box-shadow:none!important;transform:none!important;opacity:.78!important;animation:none!important}@media (prefers-reduced-motion:reduce){[data-order-window]:not(.is-order-closed){animation:none!important}}';
  document.head.appendChild(estilo);

  function partesBrasilia(data) {
    const valores = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(data || new Date()).filter((parte) => parte.type !== 'literal').map((parte) => [parte.type, parte.value]));
    const year = Number(valores.year);
    const month = String(valores.month);
    const day = String(valores.day);
    const weekday = new Date(Date.parse(`${year}-${month}-${day}T12:00:00-03:00`)).getUTCDay();
    return { year, month, day, weekday, mmdd: `${month}-${day}`, isoDate: `${year}-${month}-${day}`, minutes: Number(valores.hour) * 60 + Number(valores.minute) };
  }
  function domingoDePascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(ano, mes - 1, dia));
  }
  function toIsoDate(dataUtc) { return dataUtc.toISOString().slice(0, 10); }
  function feriadosMoveisDoAno(ano) {
    if (!FERIADOS_MOVEIS_CACHE.has(ano)) {
      const pascoa = domingoDePascoa(ano);
      const diaMs = 24 * 60 * 60 * 1000;
      const set = new Set([
        toIsoDate(new Date(pascoa.getTime() - 48 * diaMs)), // Carnaval (segunda)
        toIsoDate(new Date(pascoa.getTime() - 47 * diaMs)), // Carnaval (terça)
        toIsoDate(new Date(pascoa.getTime() - 2 * diaMs)), // Sexta-feira Santa
        toIsoDate(new Date(pascoa.getTime() + 60 * diaMs)) // Corpus Christi
      ]);
      FERIADOS_MOVEIS_CACHE.set(ano, set);
    }
    return FERIADOS_MOVEIS_CACHE.get(ano);
  }
  function ehFeriadoRetirada(partes) {
    return FERIADOS_NACIONAIS_FIXOS.has(partes.mmdd) || FERIADOS_MUNICIPAIS_CAJURU.has(partes.mmdd) || feriadosMoveisDoAno(partes.year).has(partes.isoDate);
  }
  function liberacaoTemporariaAtiva(data) { return (data || new Date()).getTime() < RETORNO_HORARIO_NORMAL.getTime(); }
  function estaAberto(tipo, data) {
    if (tipo === 'retirada' && (demonstracaoAberta || liberacaoTemporariaAtiva(data))) return true;
    const janela = JANELAS[tipo];
    const partes = partesBrasilia(data);
    if (!janela) return false;
    if (tipo === 'retirada') {
      if (!DIAS_UTEIS.has(partes.weekday)) return false;
      if (ehFeriadoRetirada(partes)) return false;
    }
    return partes.minutes >= janela.inicio && partes.minutes < janela.fim;
  }
  function textoAviso(tipo) { return JANELAS[tipo]?.mensagem || 'Pedidos indisponíveis neste momento.'; }

  function aviso(tipo) {
    let elemento = document.getElementById('itap-horario-aviso');
    if (!elemento) {
      elemento = document.createElement('div'); elemento.id = 'itap-horario-aviso'; elemento.setAttribute('role', 'alert'); elemento.setAttribute('aria-live', 'assertive');
      elemento.style.cssText = 'position:fixed;left:16px;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:560px;margin:auto;padding:14px 16px;border:2px solid #8a1f2d;border-radius:14px;background:#fff7f6;color:#5c1020;box-shadow:0 18px 45px rgba(50,10,25,.28);font:800 15px/1.35 Arial,sans-serif;text-align:center;';
      document.body.appendChild(elemento);
    }
    elemento.textContent = textoAviso(tipo); elemento.hidden = false; clearTimeout(aviso.timer); aviso.timer = setTimeout(() => { elemento.hidden = true; }, 6500);
  }

  function atualizarEstado() {
    document.querySelectorAll('[data-order-window]').forEach((elemento) => {
      const tipo = elemento.dataset.orderWindow; const aberto = estaAberto(tipo); const ehLink = elemento.tagName === 'A';
      elemento.classList.toggle('is-order-closed', !aberto); elemento.setAttribute('aria-disabled', String(!aberto));
      elemento.dataset.orderStatus = aberto ? 'open' : 'closed';
      if (ehLink) elemento.tabIndex = 0;
      else elemento.disabled = false;
      if (!aberto) elemento.title = textoAviso(tipo); else elemento.removeAttribute('title');
    });
    document.querySelectorAll('[data-order-status-copy]').forEach((elemento) => {
      const tipo = elemento.dataset.orderStatusCopy; const aberto = estaAberto(tipo); elemento.hidden = aberto; elemento.textContent = aberto ? '' : textoAviso(tipo);
    });
    window.dispatchEvent(new CustomEvent('itap:horario-pedidos-atualizado', { detail: { retirada: estaAberto('retirada'), encomendas: estaAberto('encomendas') } }));
  }

  function impedirForaDoHorario(evento, tipo) {
    if (estaAberto(tipo)) return true;
    if (evento) { evento.preventDefault(); evento.stopPropagation(); }
    aviso(tipo); return false;
  }

  window.ItapHorarioPedidos = Object.freeze({ estaAberto, textoAviso, aviso, atualizarEstado, impedirForaDoHorario });
  document.addEventListener('click', (evento) => {
    const controle = evento.target.closest('[data-order-window]');
    if (controle && !estaAberto(controle.dataset.orderWindow)) impedirForaDoHorario(evento, controle.dataset.orderWindow);
  }, true);
  document.addEventListener('DOMContentLoaded', atualizarEstado);
  setInterval(atualizarEstado, 30000);
}());
