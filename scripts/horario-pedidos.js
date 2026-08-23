/* Regra central: retirada liberada todos os dias, 11h–20h. Encomendas 10h–20h. */
(function () {
  'use strict';

  const TIMEZONE = 'America/Sao_Paulo';
  const JANELAS = Object.freeze({
    retirada: { inicio: 11 * 60, fim: 20 * 60, mensagem: 'Retirada somente neste período: todos os dias, das 11h00 às 20h00. Volte nesse horário para montar seu pedido.' },
    encomendas: { inicio: 10 * 60, fim: 20 * 60, mensagem: 'Encomendas disponíveis todos os dias, das 10h00 às 20h00. Volte nesse período para enviar sua encomenda.' }
  });

  const parametros = new URLSearchParams(location.search);
  const demonstracaoAberta = location.hostname.includes('.manus.computer') && (parametros.get('demo-retirada') === 'aberta' || location.hash.includes('demo-retirada=aberta'));
  const SELETOR_ACIONAVEL_PEDIDO = 'a,button,[role="button"],input[type="submit"],input[type="button"],input[type="image"]';

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
  function estaAberto(tipo, data) {
    if (tipo === 'retirada' && demonstracaoAberta) return true;
    const janela = JANELAS[tipo];
    const partes = partesBrasilia(data);
    if (!janela) return false;
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
    if (evento) evento.preventDefault();
    aviso(tipo); return false;
  }

  window.ItapHorarioPedidos = Object.freeze({ estaAberto, textoAviso, aviso, atualizarEstado, impedirForaDoHorario });
  document.addEventListener('click', (evento) => {
    const controle = evento.target.closest('[data-order-window]');
    if (!controle) return;
    if (!evento.target.closest(SELETOR_ACIONAVEL_PEDIDO)) return;
    if (!estaAberto(controle.dataset.orderWindow)) impedirForaDoHorario(evento, controle.dataset.orderWindow);
  }, true);
  document.addEventListener('DOMContentLoaded', atualizarEstado);
  setInterval(atualizarEstado, 30000);
}());
