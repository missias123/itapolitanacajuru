/**
 * // Organização: ITAP BOT v2 — Motor de Respostas com Memória de Elefante
 * Arquivo: js/itap-bot.js
 *
 * Responsabilidades:
 *  1. Carregar base de conhecimento dos arquivos dados/*_faq.json
 *  2. Responder perguntas por correspondência de tags/palavras-chave
 *  3. Manter histórico de conversa em localStorage (chave: 'itapBotHistory')
 *  4. Registrar preferências simples do usuário (ex.: interesse em fidelidade)
 *  5. Fallback para WhatsApp quando não souber responder
 *
 * Ponto de extensão para IA futura:
 *  → A função responderPergunta(text) é o único ponto de entrada de respostas.
 *  // TODO (futuro): substituir o corpo de responderPergunta() por uma chamada a
 *  //   fetch('/api/bot', { method: 'POST', body: JSON.stringify({ q: text }) })
 *  //   para integração com backend de IA (OpenAI, Gemini, etc.)
 *  //   Enquanto o endpoint não existir, esta função roda 100% no frontend.
 */
(function () {
  'use strict';

  // ── Configuração ────────────────────────────────────────────────────────────
  var WHATSAPP_NUM  = '5516996062046';
  var STORAGE_KEY   = 'itapBotHistory';          // histórico de mensagens
  var PREFS_KEY     = 'itapBotPrefs';            // preferências simples do usuário
  var FAQ_CACHE_KEY = 'itapBotFAQCache';
  var MAX_HISTORY   = 50;                        // máximo de mensagens no localStorage

  // Arquivos de FAQ relativos à raiz do site
  var FAQ_FILES = [
    'dados/geral_faq.json',
    'dados/fidelidade_faq.json',
    'dados/encomendas_faq.json',
    'dados/promocoes_faq.json',
    'dados/cardapio_basico.json'
  ];

  // Base de conhecimento em memória
  var _base = [];
  var _baseCarregada = false;

  // ── Utilitários ─────────────────────────────────────────────────────────────
  function _norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // remove acentos
      .replace(/[^a-z0-9 ]/g, ' ')     // remove pontuação
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Carregamento dos FAQs ───────────────────────────────────────────────────
  function _carregarFAQs() {
    // Suporte a file://, localhost e produção (GitHub Pages / raw)
    var isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    var baseUrl = isLocal ? '' : 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';

    var promises = FAQ_FILES.map(function (f) {
      var url = baseUrl + f + (baseUrl ? '?t=' + Date.now() : '');
      return fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + f);
          return r.json();
        })
        .catch(function (e) {
          console.warn('[ItaBot] FAQ não carregado:', f, e.message);
          return [];
        });
    });

    return Promise.all(promises).then(function (resultados) {
      var total = 0;
      resultados.forEach(function (lista) {
        if (Array.isArray(lista)) {
          _base = _base.concat(lista);
          total += lista.length;
        }
      });

      if (total > 0) {
        // Salva cache local para uso offline
        try { localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(_base)); } catch (e) {}
        console.info('[ItaBot] Base carregada com', total, 'entradas.');
      } else {
        // Fallback: usa cache salvo anteriormente
        try {
          var cached = localStorage.getItem(FAQ_CACHE_KEY);
          if (cached) {
            _base = JSON.parse(cached);
            console.info('[ItaBot] Base restaurada do cache local (' + _base.length + ' entradas).');
          }
        } catch (e) {}
      }
      _baseCarregada = true;
    });
  }

  // ── Motor de Respostas ──────────────────────────────────────────────────────
  /**
   * responderPergunta(text) — ponto único de entrada para respostas
   *
   * // TODO (futuro): Para integrar com IA, substitua este corpo por:
   * //   return fetch('/api/bot', {
   * //     method: 'POST',
   * //     headers: { 'Content-Type': 'application/json' },
   * //     body: JSON.stringify({ q: text, historico: _carregarHistorico() })
   * //   }).then(r => r.json()).then(d => d.resposta);
   * //
   * // Por enquanto, tudo roda no frontend com os dados de dados/*_faq.json.
   */
  function responderPergunta(text) {
    if (!text || !text.trim()) return null;

    var normText = _norm(text);
    var palavras = normText.split(' ').filter(function (p) { return p.length > 2; });

    // 1. Busca na base JSON por correspondência de tags
    var melhorEntrada = null;
    var melhorPontos  = 0;

    for (var i = 0; i < _base.length; i++) {
      var entrada = _base[i];
      if (!entrada || !entrada.resposta) continue;

      var tags = (entrada.tags || []).map(_norm);
      var pontos = 0;

      // Pontua por tag encontrada no texto
      for (var t = 0; t < tags.length; t++) {
        var tag = tags[t];
        if (!tag) continue;
        if (normText.includes(tag)) {
          pontos += tag.split(' ').length + 1; // tags com mais palavras valem mais
        } else {
          // Correspondência parcial: palavras da tag dentro do texto
          var tagPalavras = tag.split(' ');
          var parciaisEncontradas = 0;
          for (var tp = 0; tp < tagPalavras.length; tp++) {
            var tpW = tagPalavras[tp];
            if (tpW.length > 3 && normText.includes(tpW)) parciaisEncontradas++;
          }
          if (parciaisEncontradas > 0 && parciaisEncontradas === tagPalavras.length) pontos += 1;
        }
      }

      // Bônus: palavras do usuário encontradas na pergunta de referência
      var pergNorm = _norm(entrada.pergunta || '');
      for (var p = 0; p < palavras.length; p++) {
        if (palavras[p].length > 3 && pergNorm.includes(palavras[p])) pontos += 1;
      }

      if (pontos > melhorPontos) {
        melhorPontos = pontos;
        melhorEntrada = entrada;
      }
    }

    // Retorna se encontrou correspondência relevante
    if (melhorPontos >= 2 && melhorEntrada) {
      return melhorEntrada.resposta;
    }

    // 2. Fallback: usa RESPOSTAS inline original (compatibilidade com versão anterior)
    if (window.RESPOSTAS) {
      var normFn = function (s) {
        return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };
      var lowerText = normFn(text);
      var respostas = window.RESPOSTAS;
      for (var k in respostas) {
        if (Object.prototype.hasOwnProperty.call(respostas, k) && k !== 'default') {
          if (lowerText.includes(normFn(k))) {
            var r = respostas[k];
            return typeof r === 'function' ? r() : r;
          }
        }
      }
    }

    // 3. Último fallback: WhatsApp
    return (
      'Não encontrei essa informação aqui, mas nossa equipe pode te ajudar em instantes! 😊<br><br>' +
      '<a href="https://wa.me/' + WHATSAPP_NUM + '" target="_blank" rel="noopener" ' +
      'style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;' +
      'padding:10px 20px;border-radius:20px;font-size:13px;font-weight:800;text-decoration:none;">' +
      '💬 Falar no WhatsApp</a>'
    );
  }

  // ── Histórico / Memória ─────────────────────────────────────────────────────
  function _carregarHistorico() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
  }

  function _salvarMensagem(tipo, texto) {
    try {
      var h = _carregarHistorico();
      h.push({ tipo: tipo, texto: texto, ts: Date.now() });
      if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));

      // // UX: registra preferências simples para personalizar respostas futuras
      if (tipo === 'user') {
        var prefs = _carregarPrefs();
        if (/fidel|pont|clube|estrela|premio|pr[eê]mio/i.test(texto)) prefs.interesseFidelidade = true;
        if (/encomen|torta|caixa|festa/i.test(texto)) prefs.interesseEncomendas = true;
        if (/promoç|sorteio|concorr/i.test(texto)) prefs.interessePromocao = true;
        _salvarPrefs(prefs);
      }
    } catch (e) {}
  }

  function _carregarPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch (e) { return {}; }
  }

  function _salvarPrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  // Renderiza o histórico no container do chat ao abrir
  function _renderizarHistorico() {
    var container = document.getElementById('chat-msgs');
    if (!container) return;

    var h = _carregarHistorico();
    if (!h.length) return;

    // Remove mensagem de boas-vindas padrão se houver histórico
    var msgInicio = document.getElementById('chat-msg-inicio');
    if (msgInicio) msgInicio.style.display = 'none';

    // Renderiza mensagens anteriores (máximo das últimas 20 para não sobrecarregar)
    var inicio = Math.max(0, h.length - 20);
    for (var i = inicio; i < h.length; i++) {
      var item = h[i];
      // Evita duplicar mensagens já no DOM
      var existe = false;
      var divs = container.querySelectorAll('.msg');
      for (var d = 0; d < divs.length; d++) {
        if ((divs[d].textContent || divs[d].innerHTML) === item.texto) { existe = true; break; }
      }
      if (!existe) {
        var div = document.createElement('div');
        div.className = 'msg ' + item.tipo;
        if (item.tipo === 'bot') { div.innerHTML = item.texto; } else { div.textContent = item.texto; }
        container.appendChild(div);
      }
    }

    // // UX: Mensagem de retorno personalizada
    var prefs = _carregarPrefs();
    var sep = document.createElement('div');
    sep.className = 'msg bot';
    sep.style.cssText = 'font-size:11px;color:#888;text-align:center;padding:6px 10px;background:none;border:none;box-shadow:none;';
    var saudacao = '— Bem-vindo(a) de volta! 👋 —';
    if (prefs.interesseFidelidade) saudacao = '— Bem-vindo(a) de volta! Alguma dúvida sobre o Programa de Fidelidade? ⭐ —';
    else if (prefs.interesseEncomendas) saudacao = '— Bem-vindo(a) de volta! Posso ajudar com encomendas! 📦 —';
    sep.textContent = saudacao;
    container.appendChild(sep);
    container.scrollTop = container.scrollHeight;
  }

  // ── Integração com funções existentes do index.html ─────────────────────────
  function _integrar() {
    // Override getResp — usa nova engine JSON + fallback RESPOSTAS inline
    window.getResp = function (msg) {
      return responderPergunta(msg);
    };

    // Override addMsg — adiciona gravação no localStorage
    var _addMsgOrig = window.addMsg;
    window.addMsg = function (tipo, txt) {
      if (_addMsgOrig) _addMsgOrig(tipo, txt);
      _salvarMensagem(tipo, txt);
    };

    // Override abrirChat — carrega histórico ao abrir o chat
    var _abrirChatOrig = window.abrirChat;
    window.abrirChat = function () {
      if (_abrirChatOrig) _abrirChatOrig();
      setTimeout(_renderizarHistorico, 50); // aguarda o modal abrir
    };

    // // Organização: expõe API pública para debug e extensão futura
    window.itapBot = {
      responderPergunta: responderPergunta,
      limparHistorico:   function () { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} },
      limparPrefs:       function () { try { localStorage.removeItem(PREFS_KEY); } catch (e) {} },
      getBase:           function () { return _base; },
      isReady:           function () { return _baseCarregada; },
      getHistorico:      _carregarHistorico,
      getPrefs:          _carregarPrefs
    };
  }

  // ── Inicialização ───────────────────────────────────────────────────────────
  function _init() {
    _integrar();
    _carregarFAQs().catch(function (e) {
      console.warn('[ItaBot] Erro na inicialização dos FAQs:', e);
    });
  }

  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
