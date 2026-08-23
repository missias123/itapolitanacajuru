/**
 * itap-picole-promo.js
 * Promoção "Picolé de Fruta Grátis" — 30 Dias
 * Sorveteria Itapolitana · Cajuru/SP
 *
 * Responsabilidades:
 *  - Consultar o estado da promoção no servidor a cada ~20 s
 *  - Atualizar o letreiro do robô ItaBot quando a promoção estiver ativa
 *  - Interceptar o clique no robô para abrir o modal da promoção
 *  - Gerenciar o fluxo de reserva e preenchimento do formulário
 *  - Exibir confirmação + link WhatsApp após o cadastro
 *
 * Segurança:
 *  - Nunca decide o vencedor no navegador
 *  - Não usa localStorage/cookies como fonte de verdade
 *  - localStorage/sessionStorage são usados APENAS para UX (retomar formulário)
 */
(function () {
  'use strict';

  var API_BASE = 'https://api.itapolitanacajuru.com.br';
  var POLL_INTERVAL_MS = 20_000; // 20 segundos
  var MODAL_ID = 'picole-promo-modal';

  // ── Estado interno ──────────────────────────────────────────────────────────
  var _estado = 'inativo'; // 'inativo' | 'ativo' | 'reservado' | 'campanha_encerrada'
  var _pollTimer = null;
  var _polling = false;
  var _reservandoEmAndamento = false;
  var _reservaId = null;           // ID da reserva desta sessão (apenas UX)
  var _modalAberto = false;

  // ── Utilitários ─────────────────────────────────────────────────────────────
  function _escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _maskPhone(v) {
    var d = String(v).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return '(' + d;
    if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function _validPhone(v) {
    var d = String(v).replace(/\D/g, '');
    return /^\d{10,11}$/.test(d);
  }

  function _validFullName(v) {
    var parts = String(v || '').trim().split(/\s+/).filter(function (p) { return p.length >= 2; });
    return parts.length >= 2 && v.trim().length >= 5;
  }

  // Recupera reservaId da sessão (apenas para retomada de formulário, sem valor de segurança)
  function _getSessionReservaId() {
    try { return sessionStorage.getItem('itap_picole_reservaId') || null; } catch (e) { return null; }
  }
  function _setSessionReservaId(id) {
    try { sessionStorage.setItem('itap_picole_reservaId', id); } catch (e) {}
  }
  function _clearSessionReservaId() {
    try { sessionStorage.removeItem('itap_picole_reservaId'); } catch (e) {}
  }

  // ── Atualização do robô / letreiro ──────────────────────────────────────────
  function _atualizarRobo(novoEstado) {
    var launcher = document.getElementById('itabot-launcher');
    var ledTrack = document.querySelector('.itabot-launcher-led-track');

    if (novoEstado === 'ativo') {
      if (launcher) {
        launcher.setAttribute('aria-label', 'Abrir promoção do picolé grátis');
        launcher.setAttribute('data-picole', 'ativo');
        launcher.style.filter = 'drop-shadow(0 0 18px rgba(255,214,0,0.85))';
      }
      if (ledTrack) {
        ledTrack.textContent = 'CLIQUE EM MIM E GANHE UM PICOLÉ! 🍦   •   ';
        ledTrack.style.color = '#FFD600';
      }
    } else if (novoEstado === 'reservado') {
      if (launcher) {
        launcher.setAttribute('aria-label', 'Abrir painel de dúvidas do ItaBot');
        launcher.removeAttribute('data-picole');
        launcher.style.filter = '';
      }
      if (ledTrack) {
        ledTrack.textContent = 'DÚVIDA — CLIQUE AQUI   •   ';
        ledTrack.style.color = '';
      }
    } else {
      // inativo / campanha_encerrada
      if (launcher) {
        launcher.setAttribute('aria-label', 'Abrir painel de dúvidas do ItaBot');
        launcher.removeAttribute('data-picole');
        launcher.style.filter = '';
      }
      if (ledTrack) {
        ledTrack.textContent = 'DÚVIDA — CLIQUE AQUI   •   ';
        ledTrack.style.color = '';
      }
    }
  }

  // ── Polling do estado ────────────────────────────────────────────────────────
  function _consultarStatus() {
    if (_polling) return;
    _polling = true;
    fetch(API_BASE + '/api/promocao/picole/status', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _polling = false;
        var novoEstado = data.status || 'inativo';

        if (novoEstado === 'campanha_encerrada') {
          _estado = 'campanha_encerrada';
          _atualizarRobo('inativo');
          _pararPolling();
          return;
        }

        _estado = novoEstado;
        _atualizarRobo(novoEstado);
      })
      .catch(function () {
        _polling = false;
        // Em caso de falha de rede, mantém estado atual sem alterar UI
      });
  }

  function _iniciarPolling() {
    _consultarStatus();
    _pollTimer = setInterval(_consultarStatus, POLL_INTERVAL_MS);
  }

  function _pararPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  // ── Interceptor de clique no robô ────────────────────────────────────────────
  window._itabotClickInterceptor = function () {
    if (_estado === 'ativo') {
      _abrirModal('promo');
      return true; // intercepta
    }
    if (_estado === 'reservado') {
      _abrirModal('encerrado');
      return true; // intercepta para mostrar mensagem
    }
    return false; // passa para o comportamento padrão (dúvidas)
  };

  // ── Modal ────────────────────────────────────────────────────────────────────
  function _injetarCssModal() {
    if (document.getElementById('picole-modal-css')) return;
    var s = document.createElement('style');
    s.id = 'picole-modal-css';
    s.textContent = [
      '#' + MODAL_ID + '{display:none;position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,0.72);align-items:center;justify-content:center;padding:16px;overscroll-behavior:contain;}',
      '#' + MODAL_ID + '.aberto{display:flex!important;}',
      '#' + MODAL_ID + ' .pm-box{background:#fff;border-radius:24px;width:100%;max-width:440px;max-height:92dvh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.4);outline:none;display:flex;flex-direction:column;}',
      '#' + MODAL_ID + ' .pm-hdr{background:linear-gradient(135deg,#E8000D,#FF6D00);color:#fff;padding:20px 20px 16px;border-radius:24px 24px 0 0;position:relative;}',
      '#' + MODAL_ID + ' .pm-hdr h2{font-family:\'Poppins\',sans-serif;font-size:1.1rem;font-weight:900;margin:0;padding-right:36px;}',
      '#' + MODAL_ID + ' .pm-close{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;}',
      '#' + MODAL_ID + ' .pm-close:focus-visible{outline:2px solid #FFD600;outline-offset:2px;}',
      '#' + MODAL_ID + ' .pm-body{padding:20px;flex:1;}',
      '#' + MODAL_ID + ' .pm-msg{text-align:center;padding:12px 0 8px;}',
      '#' + MODAL_ID + ' .pm-msg .pm-emoji{font-size:3rem;line-height:1;margin-bottom:8px;}',
      '#' + MODAL_ID + ' .pm-msg p{color:#555;font-size:.95rem;line-height:1.5;margin:6px 0 0;}',
      '#' + MODAL_ID + ' .pm-form{display:flex;flex-direction:column;gap:14px;}',
      '#' + MODAL_ID + ' .pm-field{display:grid;gap:5px;}',
      '#' + MODAL_ID + ' .pm-field label{font-size:.88rem;font-weight:700;color:#333;}',
      '#' + MODAL_ID + ' .pm-field input{width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:10px;font-size:1rem;font-family:inherit;outline:none;transition:border-color .2s;}',
      '#' + MODAL_ID + ' .pm-field input:focus{border-color:#E8000D;box-shadow:0 0 0 3px rgba(232,0,13,.1);}',
      '#' + MODAL_ID + ' .pm-field input[aria-invalid="true"]{border-color:#C62828;}',
      '#' + MODAL_ID + ' .pm-field .pm-err{color:#C62828;font-size:.8rem;font-weight:700;display:none;}',
      '#' + MODAL_ID + ' .pm-field .pm-err.vis{display:block;}',
      '#' + MODAL_ID + ' .pm-check{display:flex;gap:10px;align-items:flex-start;font-size:.84rem;color:#444;line-height:1.4;}',
      '#' + MODAL_ID + ' .pm-check input[type="checkbox"]{margin-top:2px;accent-color:#E8000D;width:18px;height:18px;flex-shrink:0;}',
      '#' + MODAL_ID + ' .pm-lgpd{background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;padding:10px 12px;font-size:.8rem;color:#5D4037;line-height:1.5;margin:4px 0;}',
      '#' + MODAL_ID + ' .pm-lgpd a{color:#E65100;font-weight:700;}',
      '#' + MODAL_ID + ' .pm-btn{width:100%;padding:14px;border:none;border-radius:14px;font-family:\'Poppins\',sans-serif;font-weight:900;font-size:.98rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s;}',
      '#' + MODAL_ID + ' .pm-btn:disabled{opacity:.55;cursor:not-allowed;}',
      '#' + MODAL_ID + ' .pm-btn-reservar{background:linear-gradient(135deg,#E8000D,#FF6D00);color:#fff;box-shadow:0 6px 20px rgba(232,0,13,.3);}',
      '#' + MODAL_ID + ' .pm-btn-enviar{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;box-shadow:0 6px 20px rgba(37,211,102,.3);}',
      '#' + MODAL_ID + ' .pm-btn-wpp{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;box-shadow:0 6px 20px rgba(37,211,102,.3);text-decoration:none;margin-top:4px;}',
      '#' + MODAL_ID + ' .pm-ticket{background:linear-gradient(135deg,#1A237E,#303F9F);color:#fff;border-radius:14px;padding:18px;text-align:center;border:2px dashed #FFD600;margin:8px 0;}',
      '#' + MODAL_ID + ' .pm-ticket-code{font-size:1.5rem;font-weight:900;color:#FFD600;letter-spacing:3px;background:rgba(0,0,0,.3);padding:8px 12px;border-radius:8px;margin:10px 0;display:block;}',
      '#' + MODAL_ID + ' .pm-spinner{width:22px;height:22px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:pm-spin .7s linear infinite;display:none;}',
      '#' + MODAL_ID + ' .pm-spinner.vis{display:block;}',
      '@keyframes pm-spin{to{transform:rotate(360deg)}}',
      '#' + MODAL_ID + ' .pm-status-msg{text-align:center;padding:8px 0;font-size:.9rem;font-weight:700;color:#C62828;display:none;}',
      '#' + MODAL_ID + ' .pm-status-msg.vis{display:block;}',
    ].join('');
    document.head.appendChild(s);
  }

  function _fecharModal() {
    var modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.classList.remove('aberto');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-aberto');
    }
    _modalAberto = false;
    // Restaura foco ao launcher
    var launcher = document.getElementById('itabot-launcher');
    if (launcher) launcher.focus();
  }

  function _construirConteudoModal(tela, dados) {
    dados = dados || {};
    if (tela === 'encerrado') {
      return '<div class="pm-msg"><div class="pm-emoji" aria-hidden="true">😔</div>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#C62828;margin:0 0 8px">Promoção encerrada!</h3>' +
        '<p>A promoção de hoje já foi encerrada.<br><strong>Tente novamente amanhã!</strong></p></div>';
    }
    if (tela === 'campanha_encerrada') {
      return '<div class="pm-msg"><div class="pm-emoji" aria-hidden="true">🍦</div>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#1A237E;margin:0 0 8px">Campanha encerrada</h3>' +
        '<p>A promoção de 30 dias foi encerrada.<br>Consulte nossas outras ofertas!</p></div>';
    }
    if (tela === 'ganhou') {
      return '<div class="pm-msg"><div class="pm-emoji" aria-hidden="true">🎉</div>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#2E7D32;margin:0 0 4px">Você foi a primeira pessoa de hoje!</h3>' +
        '<p style="font-size:.88rem;color:#555">Preencha seus dados para garantir seu picolé.</p></div>' +
        '<form id="pm-form-vencedor" class="pm-form" novalidate>' +
        '<div class="pm-lgpd">ℹ️ Usaremos seu nome e celular exclusivamente para confirmar esta promoção e organizar a retirada na Sorveteria Itapolitana. Seus dados não serão usados para outras finalidades sem consentimento. <a href="politica-privacidade.html">Política de Privacidade</a>.</div>' +
        '<div class="pm-field"><label for="pm-nome">👤 Nome Completo</label>' +
        '<input id="pm-nome" type="text" maxlength="100" placeholder="Seu nome completo" required autocomplete="name">' +
        '<span class="pm-err" id="pm-err-nome" role="alert"></span></div>' +
        '<div class="pm-field"><label for="pm-cel">📱 Celular com DDD</label>' +
        '<input id="pm-cel" type="tel" inputmode="numeric" maxlength="15" placeholder="(16) 99999-0000" required autocomplete="tel">' +
        '<span class="pm-err" id="pm-err-cel" role="alert"></span></div>' +
        '<div class="pm-check"><input type="checkbox" id="pm-aceite-termos" required><label for="pm-aceite-termos">Li e aceito os <strong>termos da promoção</strong>. Prêmio: 1 picolé de fruta disponível na loja, sujeito aos sabores disponíveis. Retirada pessoalmente na sorveteria. Sem delivery.</label></div>' +
        '<div class="pm-check"><input type="checkbox" id="pm-aceite-lgpd" required><label for="pm-aceite-lgpd">Autorizo o uso do meu nome e celular <strong>exclusivamente</strong> para confirmar esta promoção, conforme a LGPD.</label></div>' +
        '<div id="pm-status-form" class="pm-status-msg" role="alert"></div>' +
        '<button type="submit" class="pm-btn pm-btn-enviar" id="pm-btn-enviar"><span id="pm-spinner-form" class="pm-spinner" aria-hidden="true"></span>Garantir meu picolé 🍦</button>' +
        '</form>';
    }
    if (tela === 'confirmacao') {
      var cod = _escapeHtml(dados.codigoRetirada || '—');
      var wppNum = '5516996062046'; // número da sorveteria (configurável via variável no servidor)
      var wppMsg = encodeURIComponent(
        '🍦 Resgate do Picolé – Sorveteria Itapolitana Cajuru\n\n' +
        'Nome: ' + (dados.nome || '') + '\n' +
        'Celular: ' + (dados.celular || '') + '\n' +
        'Data: ' + (dados.dataLocal || hojeFormatado()) + '\n' +
        'Código de Retirada: ' + (dados.codigoRetirada || '') + '\n\n' +
        'Prêmio: 1 picolé de fruta grátis\n' +
        'Retirada: pessoalmente na Sorveteria Itapolitana, Cajuru/SP\n' +
        '(Sujeito aos sabores disponíveis no momento da retirada)\n\n' +
        'Apresente este código e o celular cadastrado na loja. ✅'
      );
      return '<div class="pm-msg"><div class="pm-emoji" aria-hidden="true">✅</div>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#2E7D32;margin:0 0 4px">Cadastro realizado!</h3></div>' +
        '<div class="pm-ticket" role="region" aria-label="Código de retirada">' +
        '<div style="font-size:.85rem;font-weight:700;opacity:.8">Seu código de retirada</div>' +
        '<span class="pm-ticket-code">' + cod + '</span>' +
        '<div style="font-size:.78rem;opacity:.75">Apresente este código na loja</div>' +
        '</div>' +
        '<div style="font-size:.84rem;color:#444;line-height:1.5;padding:8px 0">' +
        '📍 <strong>Retirada exclusivamente na loja.</strong> Não há delivery para esta promoção.<br>' +
        '🕐 Resgate no horário de atendimento da sorveteria.<br>' +
        '🍦 1 picolé de fruta disponível, sujeito aos sabores disponíveis no momento.<br>' +
        '📱 Informe seu nome e celular cadastrados ao retirar.' +
        '</div>' +
        '<a href="https://wa.me/' + wppNum + '?text=' + wppMsg + '" target="_blank" rel="noopener noreferrer" class="pm-btn pm-btn-wpp" role="button">' +
        '💬 Enviar confirmação pelo WhatsApp</a>' +
        '<div style="font-size:.75rem;color:#888;text-align:center;margin-top:6px">* Você ainda precisará tocar em Enviar no WhatsApp.</div>';
    }
    // tela 'promo' — tela inicial de reserva
    return '<div class="pm-msg"><div class="pm-emoji" aria-hidden="true">🍦</div>' +
      '<h3 style="font-size:1.2rem;font-weight:900;color:#E8000D;margin:0 0 4px">VOCÊ PODE GANHAR UM PICOLÉ!</h3>' +
      '<p style="font-size:.9rem;color:#555">Clique em <strong>Reservar agora</strong>. Somente a primeira pessoa ganha.<br><em>1 picolé de fruta grátis por dia.</em></p></div>' +
      '<div id="pm-status-reserva" class="pm-status-msg" role="alert"></div>' +
      '<button type="button" class="pm-btn pm-btn-reservar" id="pm-btn-reservar" aria-label="Abrir promoção do picolé grátis">' +
      '<span id="pm-spinner-reserva" class="pm-spinner" aria-hidden="true"></span>Reservar agora 🍦</button>';
  }

  function _abrirModal(tela, dados) {
    _injetarCssModal();
    var modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = MODAL_ID;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'pm-titulo');
      document.body.appendChild(modal);
    }

    var titulo = tela === 'ativo' || tela === 'promo' ? 'Promoção do Dia' :
                 tela === 'ganhou' ? 'Você Ganhou!' :
                 tela === 'confirmacao' ? 'Confirmação' : 'Promoção';

    modal.innerHTML = '<div class="pm-box" tabindex="-1">' +
      '<div class="pm-hdr"><h2 id="pm-titulo">🍦 ' + _escapeHtml(titulo) + '</h2>' +
      '<button type="button" class="pm-close" id="pm-close" aria-label="Fechar">✕</button></div>' +
      '<div class="pm-body" id="pm-body">' + _construirConteudoModal(tela, dados) + '</div>' +
      '</div>';

    modal.classList.add('aberto');
    modal.removeAttribute('aria-hidden');
    document.body.classList.add('modal-aberto');
    _modalAberto = true;

    // Foca a caixa do modal
    var box = modal.querySelector('.pm-box');
    if (box) setTimeout(function () { box.focus(); }, 50);

    // Botão fechar
    var btnClose = document.getElementById('pm-close');
    if (btnClose) btnClose.addEventListener('click', _fecharModal);

    // Fechar com Escape
    modal.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { _fecharModal(); modal.removeEventListener('keydown', onKey); }
    });
    // Fechar ao clicar fora
    modal.addEventListener('click', function onOuter(e) {
      if (e.target === modal) { _fecharModal(); modal.removeEventListener('click', onOuter); }
    });

    // Prende foco dentro do modal (trap)
    _trapFocus(modal);

    // Inicializa handlers da tela
    if (tela === 'promo') _inicializarTelaPromo();
    if (tela === 'ganhou') _inicializarTelaFormulario(dados);
  }

  // ── Foco preso no modal ──────────────────────────────────────────────────────
  function _trapFocus(modal) {
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusables = modal.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
  }

  // ── Tela de reserva ──────────────────────────────────────────────────────────
  function _inicializarTelaPromo() {
    var btn = document.getElementById('pm-btn-reservar');
    if (!btn) return;

    // Verifica se há reservaId na sessão (retomada)
    var sessId = _getSessionReservaId();
    if (sessId) {
      _verificarRetomada(sessId);
      return;
    }

    btn.addEventListener('click', _tentarReservar);
  }

  function _verificarRetomada(sessId) {
    var btn = document.getElementById('pm-btn-reservar');
    if (btn) { btn.disabled = true; }
    fetch(API_BASE + '/api/promocao/picole/reserva/' + encodeURIComponent(sessId), {
      method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.statusFormulario === 'aguardando') {
          // Reserva ainda aguarda formulário — vai para tela de formulário
          _reservaId = sessId;
          _renderizarTelaFormulario({ reservaId: sessId });
        } else if (data.ok && data.statusFormulario === 'preenchido') {
          // Já preencheu — vai para tela de confirmação
          _renderizarTelaConfirmacao({ codigoRetirada: data.codigoRetirada });
        } else {
          // Reserva expirada ou inválida — remove da sessão e mostra botão normal
          _clearSessionReservaId();
          if (btn) { btn.disabled = false; btn.addEventListener('click', _tentarReservar); }
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.addEventListener('click', _tentarReservar); }
      });
  }

  function _tentarReservar() {
    if (_reservandoEmAndamento) return;
    _reservandoEmAndamento = true;
    var btn = document.getElementById('pm-btn-reservar');
    var spinner = document.getElementById('pm-spinner-reserva');
    var statusMsg = document.getElementById('pm-status-reserva');
    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.add('vis');
    if (statusMsg) { statusMsg.textContent = ''; statusMsg.classList.remove('vis'); }

    fetch(API_BASE + '/api/promocao/picole/reservar', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _reservandoEmAndamento = false;
        if (spinner) spinner.classList.remove('vis');
        if (data.sucesso && data.reservaId) {
          _reservaId = data.reservaId;
          _setSessionReservaId(data.reservaId);
          _renderizarTelaFormulario({ reservaId: data.reservaId });
        } else {
          // Não ganhou
          var msg = data.mensagem || 'A promoção de hoje já foi encerrada. Tente novamente amanhã.';
          if (statusMsg) { statusMsg.textContent = msg; statusMsg.classList.add('vis'); }
          if (btn) btn.disabled = true; // Não permite nova tentativa
          _estado = 'reservado';
          _atualizarRobo('reservado');
        }
      })
      .catch(function () {
        _reservandoEmAndamento = false;
        if (spinner) spinner.classList.remove('vis');
        var statusMsg = document.getElementById('pm-status-reserva');
        if (statusMsg) {
          statusMsg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
          statusMsg.classList.add('vis');
        }
        if (btn) btn.disabled = false;
      });
  }

  // ── Tela de formulário do vencedor ───────────────────────────────────────────
  function _renderizarTelaFormulario(dados) {
    var body = document.getElementById('pm-body');
    var titulo = document.getElementById('pm-titulo');
    if (titulo) titulo.textContent = '🍦 Você Ganhou!';
    if (body) {
      body.innerHTML = _construirConteudoModal('ganhou', dados);
      _inicializarTelaFormulario(dados);
    }
  }

  function _inicializarTelaFormulario(dados) {
    var form = document.getElementById('pm-form-vencedor');
    var celInput = document.getElementById('pm-cel');
    if (!form) return;
    if (celInput) {
      celInput.addEventListener('input', function () {
        celInput.value = _maskPhone(celInput.value);
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      _enviarFormulario(dados);
    });
  }

  function _enviarFormulario(dados) {
    var btn = document.getElementById('pm-btn-enviar');
    var spinner = document.getElementById('pm-spinner-form');
    var statusMsg = document.getElementById('pm-status-form');
    var nomeFld = document.getElementById('pm-nome');
    var celFld = document.getElementById('pm-cel');
    var termos = document.getElementById('pm-aceite-termos');
    var lgpd = document.getElementById('pm-aceite-lgpd');
    var errNome = document.getElementById('pm-err-nome');
    var errCel = document.getElementById('pm-err-cel');

    // Limpa erros anteriores
    [errNome, errCel].forEach(function (el) { if (el) { el.textContent = ''; el.classList.remove('vis'); } });
    [nomeFld, celFld].forEach(function (el) { if (el) el.removeAttribute('aria-invalid'); });
    if (statusMsg) { statusMsg.textContent = ''; statusMsg.classList.remove('vis'); }

    var nome = nomeFld ? nomeFld.value.trim() : '';
    var celular = celFld ? celFld.value.trim() : '';
    var aceiteTermos = termos && termos.checked;
    var aceiteLGPD = lgpd && lgpd.checked;
    var ok = true;

    if (!_validFullName(nome)) {
      ok = false;
      if (errNome) { errNome.textContent = 'Informe seu nome completo (nome e sobrenome).'; errNome.classList.add('vis'); }
      if (nomeFld) nomeFld.setAttribute('aria-invalid', 'true');
    }
    if (!_validPhone(celular)) {
      ok = false;
      if (errCel) { errCel.textContent = 'Informe um celular válido com DDD (ex: (16) 99999-0000).'; errCel.classList.add('vis'); }
      if (celFld) celFld.setAttribute('aria-invalid', 'true');
    }
    if (!aceiteTermos || !aceiteLGPD) {
      ok = false;
      if (statusMsg) { statusMsg.textContent = 'Marque as duas caixas de aceite para continuar.'; statusMsg.classList.add('vis'); }
    }
    if (!ok) return;

    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.add('vis');

    var reservaId = dados && dados.reservaId ? dados.reservaId : (_reservaId || _getSessionReservaId());
    fetch(API_BASE + '/api/promocao/picole/reserva/' + encodeURIComponent(reservaId), {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome, celular: celular, aceiteTermos: true, aceiteLGPD: true }),
      cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (spinner) spinner.classList.remove('vis');
        if (data.sucesso) {
          _clearSessionReservaId();
          _renderizarTelaConfirmacao({ codigoRetirada: data.codigoRetirada, nome: nome, celular: celular, dataLocal: _dataHojeFormatada() });
        } else {
          if (btn) btn.disabled = false;
          if (statusMsg) { statusMsg.textContent = data.mensagem || 'Erro ao enviar. Tente novamente.'; statusMsg.classList.add('vis'); }
        }
      })
      .catch(function () {
        if (spinner) spinner.classList.remove('vis');
        if (btn) btn.disabled = false;
        if (statusMsg) { statusMsg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.'; statusMsg.classList.add('vis'); }
      });
  }

  // ── Tela de confirmação ──────────────────────────────────────────────────────
  function _renderizarTelaConfirmacao(dados) {
    var body = document.getElementById('pm-body');
    var titulo = document.getElementById('pm-titulo');
    if (titulo) titulo.textContent = '🍦 Cadastro Confirmado!';
    if (body) {
      body.innerHTML = _construirConteudoModal('confirmacao', dados);
    }
  }

  function _dataHojeFormatada() {
    return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function hojeFormatado() {
    return _dataHojeFormatada();
  }

  // ── Inicialização ────────────────────────────────────────────────────────────
  function _init() {
    // Espera o DOM e os scripts do bot estarem prontos
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
      return;
    }

    _iniciarPolling();

    // Atualiza ao recuperar foco da aba (usuário retornou)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) _consultarStatus();
    });
    window.addEventListener('pageshow', _consultarStatus);
  }

  _init();

})();
