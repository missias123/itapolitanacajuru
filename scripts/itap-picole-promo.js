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
 *  - localStorage é usado APENAS para UX (retomar formulário entre recargas) — nunca como fonte de verdade
 */
(function () {
  'use strict';

  var API_BASE = 'https://api.itapolitanacajuru.com.br';
  var POLL_INTERVAL_MS = 20_000; // 20 segundos
  var PROMO_START_MINUTES = 11 * 60; // 11:00
  var PROMO_END_MINUTES = 20 * 60;   // 20:00
  var PAINEL_ID = 'picole-dialog'; // mesmo padrão do #chat-dialog do widget

  // ── Estado interno ──────────────────────────────────────────────────────────
  var _estado = 'inativo'; // 'inativo' | 'ativo' | 'reservado' | 'campanha_encerrada'
  var _pollTimer = null;
  var _polling = false;
  var _reservandoEmAndamento = false;
  var _reservaId = null;           // ID da reserva desta sessão (apenas UX, não é fonte de verdade)
  var _painelAberto = false;
  var _pendingUnloadGuard = false; // true enquanto há reserva sem formulário preenchido
  var _janelaAtiva = false;        // true durante os 5 segundos de janela de clique
  var _janela5sTimer = null;       // timer que encerra a janela de 5 segundos
  var _enviandoFormulario = false; // trava contra duplo envio local

  // ── Armazenamento local — somente para UX temporária de retomada ─────────────
  // Após cadastro concluído, não mantemos dados persistentes no navegador.
  var LS_KEY = 'itap_picole_reserva';
  var _ganhouHojeSessao = false;
  var _clicouHojeSessao = false;

  function _hojeISO() {
    // Data local do dispositivo — usada apenas para expirar o registro de UX
    return new Date().toLocaleDateString('sv-SE');
  }

  function _lsGet() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      // Expira automaticamente se não for do dia atual
      if (!obj || obj.dia !== _hojeISO()) { _lsClear(); return null; }
      return obj;
    } catch (e) { return null; }
  }

  function _lsSet(reservaId, statusFormulario) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        reservaId: reservaId,
        dia: _hojeISO(),
        statusFormulario: statusFormulario || 'aguardando',
      }));
    } catch (e) {}
  }

  function _lsClear() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
  }

  function _limparCacheLocalPromo() {
    _lsClear();
    // Limpeza defensiva de chaves legadas
    try { localStorage.removeItem('itap_picole_ganhou_dia'); } catch (e) {}
    try { localStorage.removeItem('itap_picole_clique_dia'); } catch (e) {}
  }

  function _marcarGanhouHojeSessao() {
    _ganhouHojeSessao = true;
  }

  function _ganhouHojeNesteDispositivo() {
    return _ganhouHojeSessao;
  }

  function _marcarCliqueHojeSessao() {
    _clicouHojeSessao = true;
  }

  function _clicouHojeNesteDispositivo() {
    return _clicouHojeSessao;
  }

  // Ativa aviso de saída enquanto o formulário não foi preenchido
  function _ativarGuardaSaida() {
    if (_pendingUnloadGuard) return;
    _pendingUnloadGuard = true;
    window.addEventListener('beforeunload', _onBeforeUnload);
  }

  function _desativarGuardaSaida() {
    _pendingUnloadGuard = false;
    window.removeEventListener('beforeunload', _onBeforeUnload);
  }

  function _onBeforeUnload(e) {
    if (!_pendingUnloadGuard) return;
    var msg = 'Você ganhou um picolé! Fechar agora pode dificultar o preenchimento dos seus dados. Tem certeza?';
    e.returnValue = msg;
    return msg;
  }
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

  function _estaNoHorarioPromo() {
    var agora = new Date();
    var minutos = (agora.getHours() * 60) + agora.getMinutes();
    return minutos >= PROMO_START_MINUTES && minutos < PROMO_END_MINUTES;
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
        ledTrack.textContent = '🍦 PICOLÉ GRÁTIS AGORA! CLIQUE RÁPIDO!   •   ';
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
        // Guarda de UX no cliente; a segurança real de horário e vencedor único é validada no backend.
        if (novoEstado === 'ativo' && (!_estaNoHorarioPromo() || _ganhouHojeNesteDispositivo())) {
          novoEstado = 'inativo';
        }

        if (novoEstado === 'campanha_encerrada') {
          _estado = 'campanha_encerrada';
          _janelaAtiva = false;
          if (_janela5sTimer) { clearTimeout(_janela5sTimer); _janela5sTimer = null; }
          _atualizarRobo('inativo');
          _pararPolling();
          return;
        }

        // Primeira vez detectando 'ativo': abre janela de 5 segundos
        if (novoEstado === 'ativo' && !_janelaAtiva) {
          _janelaAtiva = true;
          _atualizarRobo('ativo');
          _janela5sTimer = setTimeout(function () {
            _janelaAtiva = false;
            _janela5sTimer = null;
            // Reverte LED se o painel não foi aberto
            if (!_painelAberto) _atualizarRobo('inativo');
          }, 5000);
        }

        // Estado voltou para não-ativo (vencedor encontrado etc.)
        if (novoEstado !== 'ativo') {
          _janelaAtiva = false;
          if (_janela5sTimer) { clearTimeout(_janela5sTimer); _janela5sTimer = null; }
        }

        _estado = novoEstado;
        if (novoEstado !== 'ativo') _atualizarRobo(novoEstado);
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
    if (_ganhouHojeNesteDispositivo() || _clicouHojeNesteDispositivo()) {
      return false;
    }
    if (_estado === 'ativo' && _janelaAtiva) {
      _marcarCliqueHojeSessao();
      _abrirPainel('promo');
      return true; // intercepta — abre painel de cadastro
    }
    return false; // passa para o comportamento padrão (dúvidas)
  };

  // ── Painel de promoção (mesmo formato visual do painel de dúvidas) ───────────
  // Usa a mesma estrutura CSS do #chat-dialog.itabot-fullscreen-mode do widget,
  // garantindo aparência idêntica: header azul, logo, scroll area, footer.
  function _injetarCssPainel() {
    if (document.getElementById('picole-painel-css')) return;
    var s = document.createElement('style');
    s.id = 'picole-painel-css';
    var D = '#' + PAINEL_ID;
    s.textContent = [
      // ── Shell do painel (idêntico ao #chat-dialog.itabot-fullscreen-mode) ──
      D + '{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;background:linear-gradient(135deg,rgba(3,22,45,.82),rgba(4,82,120,.76));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);align-items:center;justify-content:center;}',
      D + '.aberto{display:flex!important;}',
      D + ' .chat-box{width:100%;max-width:460px;height:100%;max-height:100dvh;background:linear-gradient(180deg,#f7fcff 0%,#eef8ff 100%);border-radius:28px 28px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 80px rgba(0,22,54,.42);position:absolute;bottom:0;left:0;right:0;margin:0 auto;padding-bottom:env(safe-area-inset-bottom,0px);}',
      D + ' .chat-hdr{background:linear-gradient(135deg,#062c63 0%,#0b72b8 58%,#16b9d4 100%);padding:18px 20px;position:relative;overflow:hidden;flex-shrink:0;}',
      D + ' .chat-hdr::after{content:"";position:absolute;width:220px;height:220px;right:-100px;top:-150px;border-radius:50%;background:rgba(255,255,255,.16);pointer-events:none;}',
      D + ' .chat-hdr-logo-row{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;}',
      D + ' .chat-hdr-brand{display:flex;align-items:center;gap:12px;}',
      D + ' .chat-hdr-logo-img{width:48px;height:48px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 3px rgba(255,255,255,.2),0 0 22px rgba(101,232,255,.55);}',
      D + ' .chat-hdr-logo-text{font-size:18px;font-weight:900;color:#fff;letter-spacing:.2px;}',
      D + ' .itabot-status-line{display:flex;align-items:center;gap:6px;margin-top:3px;color:rgba(255,255,255,.86);font-size:10px;font-weight:900;letter-spacing:1px;}',
      D + ' .chat-close{min-width:44px;min-height:44px;border-radius:14px;background:rgba(255,255,255,.14);border:none;color:#fff;font-size:22px;cursor:pointer;position:relative;z-index:2;line-height:1;transition:background .16s;}',
      D + ' .chat-close:hover{background:rgba(255,255,255,.28);}',
      D + ' .chat-close:focus-visible{outline:2px solid #FFD600;outline-offset:2px;}',
      D + ' .itabot-fullscreen-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;padding:20px;background:linear-gradient(180deg,#f5fbff,#edf7ff);overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}',
      D + ' .itabot-fullscreen-footer{flex-shrink:0;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:12px 20px;padding-bottom:max(12px,env(safe-area-inset-bottom,0px));border-top:1px solid #eee;display:flex;justify-content:center;}',
      D + ' .itabot-fullscreen-footer button{background:#E8000D;color:#fff;border:none;border-radius:24px;padding:12px 32px;font-size:15px;font-weight:900;cursor:pointer;min-height:48px;box-shadow:0 4px 14px rgba(232,0,13,.3);}',
      // ── Responsivo mobile ────────────────────────────────────────────────────
      '@media (min-width:601px){' + D + ' .chat-box{height:90%;max-height:800px;border-radius:28px;position:relative;bottom:auto;}}',
      '@media (max-width:600px){' + D + ' .chat-hdr{padding-top:max(18px,env(safe-area-inset-top,0px));}' + D + ' .itabot-fullscreen-scroll{padding:16px 14px;}}',
      // ── CSS dos elementos internos do formulário ─────────────────────────────
      D + ' .pm-msg{text-align:center;padding:12px 0 8px;}',
      D + ' .pm-msg .pm-emoji{font-size:3rem;line-height:1;margin-bottom:8px;display:block;}',
      D + ' .pm-msg h3{margin:0 0 8px;}',
      D + ' .pm-msg p{color:#555;font-size:.95rem;line-height:1.5;margin:6px 0 0;}',
      D + ' .pm-form{display:flex;flex-direction:column;gap:14px;}',
      D + ' .pm-field{display:grid;gap:5px;}',
      D + ' .pm-field label{font-size:.88rem;font-weight:700;color:#333;}',
      D + ' .pm-field input{width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:10px;font-size:16px;font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box;}',
      D + ' .pm-field input:focus{border-color:#0b72b8;box-shadow:0 0 0 3px rgba(11,114,184,.1);}',
      D + ' .pm-field input[aria-invalid="true"]{border-color:#C62828;}',
      D + ' .pm-field .pm-err{color:#C62828;font-size:.8rem;font-weight:700;display:none;}',
      D + ' .pm-field .pm-err.vis{display:block;}',
      D + ' .pm-check{display:flex;gap:10px;align-items:flex-start;font-size:.84rem;color:#444;line-height:1.4;}',
      D + ' .pm-check input[type="checkbox"]{margin-top:2px;accent-color:#0b72b8;width:18px;height:18px;flex-shrink:0;}',
      D + ' .pm-lgpd{background:#e3f2fd;border:1px solid #90caf9;border-radius:10px;padding:10px 12px;font-size:.8rem;color:#1a237e;line-height:1.5;margin:4px 0;}',
      D + ' .pm-lgpd a{color:#0b72b8;font-weight:700;}',
      D + ' .pm-btn{width:100%;padding:14px;border:none;border-radius:14px;font-weight:900;font-size:.98rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s;font-family:inherit;}',
      D + ' .pm-btn:disabled{opacity:.55;cursor:not-allowed;}',
      D + ' .pm-btn-reservar{background:linear-gradient(135deg,#0b72b8,#062c63);color:#fff;box-shadow:0 6px 20px rgba(11,114,184,.3);}',
      D + ' .pm-btn-enviar{background:linear-gradient(135deg,#0b72b8,#062c63);color:#fff;box-shadow:0 6px 20px rgba(11,114,184,.3);}',
      D + ' .pm-btn-wpp{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;box-shadow:0 6px 20px rgba(37,211,102,.3);text-decoration:none;margin-top:4px;}',
      D + ' .pm-ticket{background:linear-gradient(135deg,#062c63,#0b72b8);color:#fff;border-radius:14px;padding:18px;text-align:center;border:2px dashed #FFD600;margin:8px 0;}',
      D + ' .pm-ticket-code{font-size:1.5rem;font-weight:900;color:#FFD600;letter-spacing:3px;background:rgba(0,0,0,.3);padding:8px 12px;border-radius:8px;margin:10px 0;display:block;}',
      D + ' .pm-spinner{width:22px;height:22px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:pm-spin .7s linear infinite;display:none;}',
      D + ' .pm-spinner.vis{display:block;}',
      '@keyframes pm-spin{to{transform:rotate(360deg)}}',
      // Dot animation (fallback if widget CSS not yet injected)
      D + ' .itabot-status-dot{width:7px;height:7px;border-radius:50%;background:#59ffb3;box-shadow:0 0 0 4px rgba(89,255,179,.16),0 0 12px rgba(89,255,179,.85);display:inline-block;animation:itabot-status-pulse 1.8s ease-in-out infinite;}',
      '@keyframes itabot-status-pulse{0%,100%{opacity:.68;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}',
      D + ' .pm-status-msg{text-align:center;padding:8px 0;font-size:.9rem;font-weight:700;color:#C62828;display:none;}',
      D + ' .pm-status-msg.vis{display:block;}',
    ].join('');
    document.head.appendChild(s);
  }

  function _fecharPainel() {
    var painel = document.getElementById(PAINEL_ID);
    if (painel) painel.classList.remove('aberto');
    document.body.classList.remove('chat-open', 'modal-aberto');
    _painelAberto = false;
    var launcher = document.getElementById('itabot-launcher');
    if (launcher) launcher.focus();
  }

  function _construirConteudoModal(tela, dados) {
    dados = dados || {};
    if (tela === 'encerrado') {
      return '<div class="pm-msg"><span class="pm-emoji" aria-hidden="true">😔</span>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#C62828;margin:0 0 8px">Promoção encerrada!</h3>' +
        '<p>A promoção de hoje já foi encerrada.<br><strong>Tente novamente amanhã!</strong></p></div>';
    }
    if (tela === 'campanha_encerrada') {
      return '<div class="pm-msg"><span class="pm-emoji" aria-hidden="true">🍦</span>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#1A237E;margin:0 0 8px">Campanha encerrada</h3>' +
        '<p>A promoção de 30 dias foi encerrada.<br>Consulte nossas outras ofertas!</p></div>';
    }
    if (tela === 'ganhou') {
      return '<div class="pm-msg"><span class="pm-emoji" aria-hidden="true">🎉</span>' +
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
      var wppNum = '5516996062046';
      var wppMsg = encodeURIComponent(
        '🍦 Resgate do Picolé – Sorveteria Itapolitana Cajuru\n\n' +
        'Nome: ' + (dados.nome || '') + '\n' +
        'Celular: ' + (dados.celular || '') + '\n' +
        'Data: ' + (dados.dataLocal || _hojeFormatado()) + '\n' +
        'Código de Retirada: ' + (dados.codigoRetirada || '') + '\n\n' +
        'Prêmio: 1 picolé de fruta grátis\n' +
        'Retirada: pessoalmente na Sorveteria Itapolitana, Cajuru/SP\n' +
        '(Sujeito aos sabores disponíveis no momento da retirada)\n\n' +
        'Apresente este código e o celular cadastrado na loja. ✅'
      );
      return '<div class="pm-msg"><span class="pm-emoji" aria-hidden="true">✅</span>' +
        '<h3 style="font-size:1.1rem;font-weight:900;color:#2E7D32;margin:0 0 4px">Cadastro realizado!</h3></div>' +
        '<div class="pm-ticket" role="region" aria-label="Código de retirada">' +
        '<div style="font-size:.85rem;font-weight:700;opacity:.8">Seu código de retirada</div>' +
        '<span class="pm-ticket-code">' + cod + '</span>' +
        '<div style="font-size:.78rem;opacity:.75">Apresente este código na loja</div>' +
        '</div>' +
        '<div style="font-size:.84rem;color:#444;line-height:1.5;padding:8px 0">' +
        '📍 <strong>Retirada exclusivamente na loja.</strong> Não há delivery para esta promoção.<br>' +
        '🕐 Resgate e ativações do robô entre 11h e 20h.<br>' +
        '🍦 1 picolé de fruta disponível, sujeito aos sabores disponíveis no momento.<br>' +
        '📱 Informe seu nome e celular cadastrados ao retirar.' +
        '</div>' +
        '<a href="https://wa.me/' + wppNum + '?text=' + wppMsg + '" target="_blank" rel="noopener noreferrer" class="pm-btn pm-btn-wpp" role="button">' +
        '💬 Enviar confirmação pelo WhatsApp</a>' +
        '<div style="font-size:.75rem;color:#888;text-align:center;margin-top:6px">* Você ainda precisará tocar em Enviar no WhatsApp.</div>';
    }
    // tela 'promo' — tela inicial de reserva
    return '<div class="pm-msg"><span class="pm-emoji" aria-hidden="true">🍦</span>' +
      '<h3 style="font-size:1.2rem;font-weight:900;color:#062c63;margin:0 0 4px">VOCÊ PODE GANHAR UM PICOLÉ!</h3>' +
      '<p style="font-size:.9rem;color:#555">Seu clique no robô já inicia a reserva automaticamente. Somente a primeira pessoa ganha.<br><em>1 picolé de fruta grátis por dia.</em></p></div>' +
      '<div id="pm-status-reserva" class="pm-status-msg vis" role="alert">Validando automaticamente o primeiro clique do dia...</div>' +
      '<button type="button" class="pm-btn pm-btn-reservar" id="pm-btn-reservar" aria-label="Validação automática da promoção" disabled>' +
      '<span id="pm-spinner-reserva" class="pm-spinner vis" aria-hidden="true"></span><span id="pm-btn-reservar-label">Validando clique vencedor 🍦</span></button>' +
      '<div style="text-align:center;margin-top:10px">' +
      '<button type="button" id="pm-btn-ja-ganhei" style="background:none;border:none;color:#888;font-size:.8rem;cursor:pointer;text-decoration:underline;padding:4px">' +
      'Já ganhei hoje mas fechei a página</button></div>';
  }

  // ── Tela de recuperação de reserva ───────────────────────────────────────────
  function _renderizarTelaRecuperacao() {
    var body = document.getElementById('pm-body');
    var titulo = document.getElementById('pm-titulo');
    if (titulo) titulo.textContent = '🍦 Recuperar Formulário';
    if (!body) return;
    body.innerHTML = '<div class="pm-msg">' +
      '<p style="font-size:.9rem;color:#555;margin-bottom:14px">Se você já ganhou hoje mas fechou a página antes de preencher seus dados, ' +
      'reabrimos seu formulário automaticamente. Clique em <strong>Verificar</strong> para recuperar.</p></div>' +
      '<div id="pm-rec-status" class="pm-status-msg" role="alert"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="pm-btn pm-btn-reservar" id="pm-btn-verificar-rec" style="flex:1">' +
      '<span id="pm-spinner-rec" class="pm-spinner" aria-hidden="true"></span>Verificar minha reserva</button>' +
      '<button type="button" class="pm-btn" style="flex:0 0 auto;background:#eee;color:#333" id="pm-btn-voltar-rec">Voltar</button>' +
      '</div>';

    var btnVerificar = document.getElementById('pm-btn-verificar-rec');
    var btnVoltar    = document.getElementById('pm-btn-voltar-rec');
    var recStatus    = document.getElementById('pm-rec-status');
    var spinnerRec   = document.getElementById('pm-spinner-rec');

    if (btnVoltar) btnVoltar.addEventListener('click', function () {
      _renderizarTelaPromoInicial();
    });

    if (btnVerificar) btnVerificar.addEventListener('click', function () {
      var lsData = _lsGet();
      if (!lsData || !lsData.reservaId) {
        recStatus.textContent = 'Nenhuma reserva encontrada para hoje neste dispositivo. Se você ganhou em outro aparelho, entre em contato com a sorveteria.';
        recStatus.classList.add('vis');
        return;
      }
      btnVerificar.disabled = true;
      if (spinnerRec) spinnerRec.classList.add('vis');
      _verificarRetomada(lsData.reservaId);
    });
  }

  function _renderizarTelaPromoInicial() {
    var body = document.getElementById('pm-body');
    var titulo = document.getElementById('pm-titulo');
    if (titulo) titulo.textContent = '🍦 Promoção do Dia';
    if (body) {
      body.innerHTML = _construirConteudoModal('promo', {});
      _inicializarTelaPromo();
    }
  }

  function _abrirPainel(tela, dados) {
    _injetarCssPainel();

    var painel = document.getElementById(PAINEL_ID);
    if (!painel) {
      painel = document.createElement('div');
      painel.id = PAINEL_ID;
      painel.setAttribute('role', 'dialog');
      painel.setAttribute('aria-modal', 'true');
      painel.setAttribute('aria-labelledby', 'pm-titulo');

      // Detecta base URL da imagem da logo (mesmo esquema do widget)
      var logoSrc = 'images/logo.webp';
      try {
        var scripts = document.querySelectorAll('script[src*="ita-bot-widget"]');
        if (scripts.length) {
          var src = scripts[0].getAttribute('src');
          var base = src.substring(0, src.lastIndexOf('/') + 1);
          if (base) logoSrc = base + '../images/logo.webp';
        }
      } catch (_e) {}

      painel.innerHTML = [
        '<div class="chat-box" tabindex="-1">',
          '<div class="chat-hdr">',
            '<div class="chat-hdr-logo-row">',
              '<div class="chat-hdr-brand">',
                '<img src="images/logo.webp" alt="Itapolitana" class="chat-hdr-logo-img" onerror="this.src=\'' + logoSrc + '\'">',
                '<div>',
                  '<div class="chat-hdr-logo-text" id="pm-titulo">🍦 Promoção do Dia</div>',
                  '<div class="itabot-status-line"><span class="itabot-status-dot" aria-hidden="true"></span> PICOLÉ GRÁTIS · ITAPOLITANA</div>',
                '</div>',
              '</div>',
              '<button class="chat-close" id="pm-close" type="button" aria-label="Fechar">✕</button>',
            '</div>',
          '</div>',
          '<div id="pm-body" class="itabot-fullscreen-scroll">',
          '</div>',
          '<div class="itabot-fullscreen-footer">',
            '<button type="button" id="pm-btn-fechar">Fechar e Voltar ao Site</button>',
          '</div>',
        '</div>',
      ].join('');
      document.body.appendChild(painel);

      // Fechar ao clicar no overlay escuro
      painel.addEventListener('click', function (e) { if (e.target === painel) _fecharPainel(); });
      // Fechar com Escape
      painel.addEventListener('keydown', function (e) { if (e.key === 'Escape') _fecharPainel(); });
      document.getElementById('pm-close').addEventListener('click', _fecharPainel);
      document.getElementById('pm-btn-fechar').addEventListener('click', _fecharPainel);
    }

    // Atualiza título
    var titulos = { promo: '🍦 Promoção do Dia', ganhou: '🍦 Você Ganhou!', confirmacao: '🍦 Cadastro Confirmado!', encerrado: '🍦 Promoção Encerrada', campanha_encerrada: '🍦 Campanha Encerrada' };
    var tituloEl = document.getElementById('pm-titulo');
    if (tituloEl) tituloEl.textContent = titulos[tela] || '🍦 Promoção';

    // Injeta conteúdo da tela
    var body = document.getElementById('pm-body');
    if (body) body.innerHTML = _construirConteudoModal(tela, dados);

    // Abre o painel (mesmo padrão do widget)
    document.body.classList.add('chat-open', 'modal-aberto');
    painel.classList.add('aberto');
    _painelAberto = true;

    // Foca
    var box = painel.querySelector('.chat-box');
    if (box) setTimeout(function () { box.focus(); }, 50);

    // Inicializa handlers da tela
    if (tela === 'promo') _inicializarTelaPromo();
    if (tela === 'ganhou') _inicializarTelaFormulario(dados);

    _trapFocus(painel);
  }

  // ── Foco preso no painel ─────────────────────────────────────────────────────
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
    var btnJaGanhei = document.getElementById('pm-btn-ja-ganhei');
    var statusMsg = document.getElementById('pm-status-reserva');
    if (!btn) return;

    if (_ganhouHojeNesteDispositivo()) {
      btn.disabled = true;
      if (btnJaGanhei) btnJaGanhei.disabled = true;
      if (statusMsg) {
        statusMsg.textContent = 'Você já garantiu seu picolé hoje neste dispositivo. Tente novamente amanhã.';
        statusMsg.classList.add('vis');
      }
      _estado = 'reservado';
      _atualizarRobo('reservado');
      return;
    }
    if (_clicouHojeNesteDispositivo()) {
      btn.disabled = true;
      if (btnJaGanhei) btnJaGanhei.disabled = false;
      if (statusMsg) {
        statusMsg.textContent = 'Clique diário já utilizado neste dispositivo. Aguarde o próximo dia para nova tentativa.';
        statusMsg.classList.add('vis');
      }
      return;
    }

    // Verifica se há reservaId no localStorage (retomada automática)
    var lsData = _lsGet();
    if (lsData && lsData.reservaId) {
      _verificarRetomada(lsData.reservaId);
      return;
    } else {
      if (btnJaGanhei) {
        btnJaGanhei.addEventListener('click', function () {
          _renderizarTelaRecuperacao();
        });
      }
      _tentarReservar();
    }
  }

  function _verificarRetomada(savedId) {
    var btn = document.getElementById('pm-btn-reservar');
    var btnJaGanhei = document.getElementById('pm-btn-ja-ganhei');
    if (btn) btn.disabled = true;
    if (btnJaGanhei) btnJaGanhei.disabled = true;

    var statusMsg = document.getElementById('pm-status-reserva');
    if (statusMsg) { statusMsg.textContent = 'Verificando sua reserva…'; statusMsg.classList.add('vis'); }

    fetch(API_BASE + '/api/promocao/picole/reserva/' + encodeURIComponent(savedId), {
      method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.statusFormulario === 'aguardando') {
          // Reserva ainda aguarda formulário — redireciona para o formulário
          _reservaId = savedId;
          _lsSet(savedId, 'aguardando');
          _ativarGuardaSaida();
          _renderizarTelaFormulario({ reservaId: savedId });
        } else if (data.ok && data.statusFormulario === 'preenchido') {
          // Formulário já foi preenchido — exibe confirmação diretamente
          _limparCacheLocalPromo();
          _marcarGanhouHojeSessao();
          _renderizarTelaConfirmacao({ codigoRetirada: data.codigoRetirada });
        } else {
          // Reserva expirada, inválida ou de outro dia — limpa e mostra botão normal
          _lsClear();
          if (statusMsg) { statusMsg.textContent = ''; statusMsg.classList.remove('vis'); }
          if (btn) { btn.disabled = false; btn.addEventListener('click', _tentarReservar); }
          if (btnJaGanhei) btnJaGanhei.disabled = false;
        }
      })
      .catch(function () {
        // Falha de rede — mantém estado e permite retomada manual
        if (statusMsg) {
          statusMsg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
          statusMsg.classList.add('vis');
        }
        if (btn) { btn.disabled = false; btn.addEventListener('click', _tentarReservar); }
        if (btnJaGanhei) btnJaGanhei.disabled = false;
      });
  }

  function _tentarReservar() {
    if (_reservandoEmAndamento) return;
    _reservandoEmAndamento = true;
    var btn = document.getElementById('pm-btn-reservar');
    var spinner = document.getElementById('pm-spinner-reserva');
    var label = document.getElementById('pm-btn-reservar-label');
    var statusMsg = document.getElementById('pm-status-reserva');
    if (btn) btn.disabled = true;
    if (label) label.textContent = 'Processando clique vencedor 🍦';
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
          _lsSet(data.reservaId, 'aguardando');  // persiste no localStorage
          _ativarGuardaSaida();                   // avisa ao sair sem preencher
          _renderizarTelaFormulario({ reservaId: data.reservaId });
        } else {
          // Não ganhou
          var msg = data.mensagem || 'A promoção de hoje já foi encerrada. Tente novamente amanhã.';
          if (statusMsg) { statusMsg.textContent = msg; statusMsg.classList.add('vis'); }
          if (btn) btn.disabled = true;
          if (label) label.textContent = 'Reservar agora 🍦';
          _estado = 'reservado';
          _atualizarRobo('reservado');
        }
      })
      .catch(function () {
        _reservandoEmAndamento = false;
        if (spinner) spinner.classList.remove('vis');
        var statusMsg = document.getElementById('pm-status-reserva');
        if (statusMsg) {
          statusMsg.textContent = 'Erro de conexão após o clique. Para manter a regra de 1 clique por dia, aguarde e use a opção "Já ganhei hoje mas fechei a página".';
          statusMsg.classList.add('vis');
        }
        if (btn) btn.disabled = true;
        if (label) label.textContent = 'Reservar agora 🍦';
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
    if (_enviandoFormulario) return;
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

    _enviandoFormulario = true;
    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.add('vis');

    var reservaId = dados && dados.reservaId ? dados.reservaId : (_reservaId || (_lsGet() && _lsGet().reservaId));
    fetch(API_BASE + '/api/promocao/picole/reserva/' + encodeURIComponent(reservaId), {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome, celular: celular, aceiteTermos: true, aceiteLGPD: true }),
      cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _enviandoFormulario = false;
        if (spinner) spinner.classList.remove('vis');
        if (data.sucesso) {
          _limparCacheLocalPromo(); // remove qualquer resíduo local após cadastro
          _marcarGanhouHojeSessao();
          _desativarGuardaSaida(); // cancela aviso de saída
          _renderizarTelaConfirmacao({ codigoRetirada: data.codigoRetirada, nome: nome, celular: celular, dataLocal: _dataHojeFormatada() });
        } else {
          if (btn) btn.disabled = false;
          if (statusMsg) { statusMsg.textContent = data.mensagem || 'Erro ao enviar. Tente novamente.'; statusMsg.classList.add('vis'); }
        }
      })
      .catch(function () {
        _enviandoFormulario = false;
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

  function _hojeFormatado() {
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
