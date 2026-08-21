/* Regra central de funcionamento: retirada 11h–20h e Encomendas 10h–20h, todos os dias. */
(function () {
  'use strict';

  const JANELAS = Object.freeze({
    retirada: { inicio: 11 * 60, fim: 20 * 60, mensagem: 'Pedidos para retirada disponíveis das 11h00 às 20h00. Volte nesse horário para montar seu pedido.' },
    encomendas: { inicio: 10 * 60, fim: 20 * 60, mensagem: 'Encomendas disponíveis todos os dias, das 10h00 às 20h00. Volte nesse período para enviar sua encomenda.' }
  });

  const estilo = document.createElement('style');
  estilo.textContent = '[data-order-window].is-order-closed{background:#8f878b!important;color:#fff!important;filter:grayscale(1);cursor:not-allowed!important;box-shadow:none!important;transform:none!important;opacity:.88!important}[data-order-window].is-order-closed::after{content:" Indisponível";font-size:.72em;font-weight:900}';
  document.head.appendChild(estilo);

  function minutosAgora(data) { const agora = data || new Date(); return agora.getHours() * 60 + agora.getMinutes(); }
  function estaAberto(tipo, data) { const janela = JANELAS[tipo]; const minutos = minutosAgora(data); return Boolean(janela && minutos >= janela.inicio && minutos < janela.fim); }
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
