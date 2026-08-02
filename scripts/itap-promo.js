/* Promoções — lógica do sorteio e contador
 * Extraído de promocao.html na Fase 3 da refatoração arquitetural.
 */
  function calcularPróximoFim() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    // Dia 01 do mês seguinte às 10:00 — sorteio mensal sem data de término
    return new Date(ano, mes + 1, 1, 10, 0, 0);
  }

  let dataAlvo = calcularPróximoFim();

  function tick() {
    const agora = new Date();
    const diff = dataAlvo - agora;

    if (diff <= 0) {
      document.getElementById('cd-row').style.display = 'none';
      document.getElementById('cd-encerrado').style.display = 'block';
      // Ao iniciar novo mês, recalcular e reiniciar o cronômetro automaticamente
      const novaData = calcularPróximoFim();
      if (novaData > agora) {
        dataAlvo = novaData;
        document.getElementById('cd-row').style.display = 'flex';
        document.getElementById('cd-encerrado').style.display = 'none';
      }
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    document.getElementById('cd-d').textContent = d < 10 ? '0'+d : d;
    document.getElementById('cd-h').textContent = h < 10 ? '0'+h : h;
    document.getElementById('cd-m').textContent = m < 10 ? '0'+m : m;
    document.getElementById('cd-s').textContent = s < 10 ? '0'+s : s;
  }

  setInterval(tick, 1000);
  tick();

  // ═══════════════════════════════════════════════════════════
  // SORTEIO MENSAL — FUNÇÕES COMPLETAS
  // ═══════════════════════════════════════════════════════════
  // Endpoint do Cloudflare Worker — cadastro interno (sem WhatsApp)
  var ITAP_WORKER_API = 'https://itapolitana-api.wmc760.workers.dev';
  var PROMO_MOBILE_REGEX = /^169\d{8}$/;
  var formCadastroPromo = document.getElementById('form-promocao-cliente');
  var inputPromoNome = document.getElementById('promo-nome-cliente');
  var inputPromoDia = document.getElementById('promo-dia-nasc');
  var inputPromoMes = document.getElementById('promo-mes-nasc');
  var inputPromoAno = document.getElementById('promo-ano-nasc');
  var inputPromoCelular = document.getElementById('promo-celular-cliente');
  var inputPromoHp = document.getElementById('promo-honeypot');
  // ID atualizado: botão agora envia para o backend (sem WhatsApp)
  var btnEnviarPromo = document.getElementById('promo-enviar-cadastro');
  var feedbackPromo = document.getElementById('promo-feedback-message');
  var regrasRetiradaPromo = document.getElementById('promo-regras-retirada-premio');
  var _promoCadastroLiberado = false;
  var _promoSubmitting = false;
  var _promoPendingOperation = null;
  // Timeout de 20s: evita bloqueio indefinido quando há falha de rede/API.
  // Aumentado de 12s para 20s para tolerar conexões 3G/4G lentas.
  var _promoTimeoutMs = 20000;

  // Popula o select de ano com intervalo válido (18 a 100 anos atrás)
  (function popularAnosNasc() {
    if (!inputPromoAno) return;
    var anoAtual = new Date().getFullYear();
    for (var a = anoAtual - 18; a >= anoAtual - 100; a--) {
      var opt = document.createElement('option');
      opt.value = String(a);
      opt.textContent = String(a);
      inputPromoAno.appendChild(opt);
    }
  })();

  function trackPromoEvent(nomeEvento, params) {
    if (typeof gtag !== 'function') return;
    try {
      gtag('event', nomeEvento, params || {});
    } catch (_) {}
  }

  function abrirRegrasSorteioPromo() {
    if (window._sorteioEncerrado) {
      var bloco = document.getElementById('bloco-regras-sorteio-promo');
      if (bloco) {
        bloco.style.display = 'block';
        setTimeout(function() { bloco.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
      }

      return;
    }
    var bloco = document.getElementById('bloco-regras-sorteio-promo');
    var form = document.getElementById('form-sorteio-inline');
    if (!bloco) return;
    bloco.style.display = bloco.style.display === 'none' ? 'block' : 'none';
    if (form) form.style.display = 'none';
    if (bloco.style.display === 'block') {
      setTimeout(function() { bloco.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }

  }

  function destacarParticipacaoSorteioPromo() {
    abrirRegrasSorteioPromo();
    var bloco = document.getElementById('bloco-regras-sorteio-promo');
    var aceite = document.getElementById('aceite-sorteio-inline');
    setTimeout(function() {
      if (bloco && bloco.style.display === 'block') {
        bloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (aceite) {
        aceite.focus({ preventScroll: true });
      }
    }, 180);
  }

  function verificarAceiteSorteioPromo() {
    var cb = document.getElementById('aceite-sorteio-inline');
    var btn = document.getElementById('btn-aceitar-sorteio-inline');
    var hint = document.getElementById('hint-aceite-sorteio');
    if (!cb || !btn) return;
    if (cb.checked) {
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
      btn.classList.add('ativo-verde');
      if (hint) hint.style.display = 'none';
    } else {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.remove('ativo-verde');
      if (hint) hint.style.display = 'block';
    }
  }

  function abrirFormSorteioPromo() {
    var form = document.getElementById('form-sorteio-inline');
    if (!form) return;
    _promoCadastroLiberado = true;
    form.style.display = 'block';
    resetarFormularioPromo();
    setTimeout(function() { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  function setCampoPromoHabilitado(campo, habilitado) {
    if (!campo) return;
    var eraDesabilitado = campo.disabled;
    campo.disabled = !habilitado;
    campo.classList.toggle('form-control-disabled', !habilitado);
    // Pré-preenche DDD 16 ao habilitar o campo de celular pela primeira vez
    if (habilitado && eraDesabilitado && campo.id === 'promo-celular-cliente' && !campo.value.trim()) {
      campo.value = '(16) ';
    }
  }

  function formatarCelularPromo(valor) {
    var digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 6) return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2);
    if (digitos.length <= 10) return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 6) + '-' + digitos.slice(6);
    return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 7) + '-' + digitos.slice(7);
  }

  function mascaraTelPromo(el) {
    if (!el) return;
    el.value = formatarCelularPromo(el.value);
  }

  // Retorna a data dos 3 selects no formato DD/MM/AAAA, ou '' se incompleto
  function obterDataPromoStr() {
    var dia = inputPromoDia ? inputPromoDia.value : '';
    var mes = inputPromoMes ? inputPromoMes.value : '';
    var ano = inputPromoAno ? inputPromoAno.value : '';
    if (!dia || !mes || !ano) return '';
    return dia + '/' + mes + '/' + ano;
  }

  function parseDataBrPromoToIso(dataBr) {
    var valor = String(dataBr || '').trim();
    var match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    var dia = parseInt(match[1], 10);
    var mes = parseInt(match[2], 10);
    var ano = parseInt(match[3], 10);
    if (ano < 1900 || ano > new Date().getFullYear()) return null;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    var data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== (mes - 1) || data.getDate() !== dia) return null;
    return String(ano) + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
  }

  function promoNomeValido() {
    return !!(inputPromoNome && inputPromoNome.value.trim().length >= 3);
  }

  function promoDataValida() {
    var iso = parseDataBrPromoToIso(obterDataPromoStr());
    if (!iso) return false;
    return obterIdadePromo(iso) >= 18;
  }

  function promoCelularValido() {
    var celular = inputPromoCelular ? inputPromoCelular.value.replace(/\D/g, '') : '';
    return PROMO_MOBILE_REGEX.test(celular);
  }

  function promoCamposValidos() {
    return promoNomeValido() && promoDataValida() && promoCelularValido();
  }

  function mostrarMsgSorteio(txt, tipo) {
    if (!feedbackPromo) return;
    if (!txt) {
      feedbackPromo.style.display = 'none';
      feedbackPromo.textContent = '';
      feedbackPromo.className = 'alert';
      feedbackPromo.setAttribute('role', 'status');
      feedbackPromo.setAttribute('aria-live', 'polite');
      return;
    }
    feedbackPromo.style.display = 'block';
    feedbackPromo.textContent = txt;
    var isInfo = tipo === 'ok' || tipo === 'info';
    feedbackPromo.className = 'alert ' + (isInfo ? 'alert-success' : 'alert-warning');
    feedbackPromo.setAttribute('role', isInfo ? 'status' : 'alert');
    feedbackPromo.setAttribute('aria-live', isInfo ? 'polite' : 'assertive');
  }

  function mostrarMsgSorteioComLink(txt, linkUrl, linkTxt) {
    if (!feedbackPromo) return;
    feedbackPromo.style.display = 'block';
    feedbackPromo.className = 'alert alert-warning';
    feedbackPromo.setAttribute('role', 'alert');
    feedbackPromo.setAttribute('aria-live', 'assertive');
    var span = document.createElement('span');
    span.textContent = txt + ' ';
    var a = document.createElement('a');
    a.href = linkUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = linkTxt;
    a.style.cssText = 'color:#fff;font-weight:700;text-decoration:underline;margin-left:4px';
    feedbackPromo.innerHTML = '';
    feedbackPromo.appendChild(span);
    feedbackPromo.appendChild(a);
  }

  function mostrarMsgSorteioComAcao(txt, tipo, acaoTxt, onClick) {
    if (!feedbackPromo) return;
    mostrarMsgSorteio('', '');
    feedbackPromo.style.display = 'block';
    feedbackPromo.className = 'alert ' + (tipo === 'ok' || tipo === 'info' ? 'alert-success' : 'alert-warning');
    feedbackPromo.setAttribute('role', tipo === 'ok' || tipo === 'info' ? 'status' : 'alert');
    feedbackPromo.setAttribute('aria-live', tipo === 'ok' || tipo === 'info' ? 'polite' : 'assertive');

    var span = document.createElement('span');
    span.textContent = txt + ' ';
    feedbackPromo.appendChild(span);
    if (!acaoTxt || typeof onClick !== 'function') return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = acaoTxt;
    btn.style.cssText = 'margin-left:8px;background:#fff;color:#1b5e20;border:1px solid rgba(0,0,0,.18);border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer';
    btn.addEventListener('click', onClick);
    feedbackPromo.appendChild(btn);
  }

  function marcarCampoInvalido(campo, invalido) {
    if (!campo) return;
    if (invalido) {
      campo.setAttribute('aria-invalid', 'true');
    } else {
      campo.removeAttribute('aria-invalid');
    }
  }

  function limparValidacaoPromo() {
    marcarCampoInvalido(inputPromoNome, false);
    marcarCampoInvalido(inputPromoDia, false);
    marcarCampoInvalido(inputPromoMes, false);
    marcarCampoInvalido(inputPromoAno, false);
    marcarCampoInvalido(inputPromoCelular, false);
  }

  function exibirRegrasRetiradaPromo() {
    if (regrasRetiradaPromo) regrasRetiradaPromo.style.display = 'block';
  }

  function atualizarFluxoCadastroPromo() {
    var podeEditarNome = _promoCadastroLiberado;
    var podeEditarData = podeEditarNome && promoNomeValido();
    var podeEditarCelular = podeEditarData && promoDataValida();

    setCampoPromoHabilitado(inputPromoNome, podeEditarNome);
    setCampoPromoHabilitado(inputPromoDia, podeEditarData);
    setCampoPromoHabilitado(inputPromoMes, podeEditarData);
    setCampoPromoHabilitado(inputPromoAno, podeEditarData);
    setCampoPromoHabilitado(inputPromoCelular, podeEditarCelular);

    if (btnEnviarPromo) btnEnviarPromo.disabled = !(_promoCadastroLiberado && promoCamposValidos());
  }

  function resetarFormularioPromo(opcoes) {
    var opts = opcoes || {};
    if (inputPromoNome) inputPromoNome.value = '';
    if (inputPromoDia) inputPromoDia.value = '';
    if (inputPromoMes) inputPromoMes.value = '';
    if (inputPromoAno) inputPromoAno.value = '';
    if (inputPromoCelular) inputPromoCelular.value = '';
    if (inputPromoHp) inputPromoHp.value = '';
    if (!opts.manterFeedback) mostrarMsgSorteio('', '');
    if (!opts.manterRegras && regrasRetiradaPromo) regrasRetiradaPromo.style.display = 'none';
    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.textContent = 'Fazer cadastro';
    }
    _promoSubmitting = false;
    limparValidacaoPromo();
    atualizarFluxoCadastroPromo();
  }

  function obterIdadePromo(dataIso) {
    var partes = String(dataIso || '').split('-');
    if (partes.length !== 3) return -1;
    var hoje = new Date();
    var nasc = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    var idade = hoje.getFullYear() - nasc.getFullYear();
    var antesAniversario = hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
    if (antesAniversario) idade--;
    return idade;
  }

  // ─── Novo fluxo: POST /api/promocao/cadastro (sem WhatsApp, sem GitHub token no front-end)
  // Substitui toda a lógica anterior que usava _GH_TK_P, _GH_FID e _GH_CLIENTES.

  // ═══ SEGURANÇA: Rate Limiting local (máx. 3 tentativas em 30 min por dispositivo) ═══
  function _promoRateKey() { return 'itap_promo_rate_' + (navigator.language||'') + (screen.width||''); }
  function _promoVerificarRate() {
    var key = _promoRateKey();
    var agora = Date.now();
    var dados = JSON.parse(localStorage.getItem(key) || '{"t":[],"bloqAte":0}');
    if (dados.bloqAte && agora < dados.bloqAte) {
      var restam = Math.ceil((dados.bloqAte - agora) / 60000);
      return 'Muitas tentativas. Aguarde ' + restam + ' minuto(s) para tentar novamente.';
    }
    return null;
  }
  function _promoRegistrarTentativa() {
    var key = _promoRateKey();
    var agora = Date.now();
    var JANELA = 30 * 60 * 1000;
    var dados = JSON.parse(localStorage.getItem(key) || '{"t":[],"bloqAte":0}');
    dados.t = dados.t.filter(function(x){ return agora - x < JANELA; });
    dados.t.push(agora);
    if (dados.t.length >= 3) { dados.bloqAte = agora + JANELA; dados.t = []; }
    localStorage.setItem(key, JSON.stringify(dados));
  }
  function _promoLimparRate() { localStorage.removeItem(_promoRateKey()); }

  function _promoNovoIdempotencyKey() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return 'promo-' + window.crypto.randomUUID();
      }
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        var hex = Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
        return 'promo-' + hex;
      }
    } catch (_) {}
    return 'promo-' + Date.now() + '-fallback';
  }

  function _promoBuildPayloadHash(payload) {
    return JSON.stringify([
      String(payload.name || ''),
      String(payload.birthdate || ''),
      String(payload.phone || ''),
      payload.regulation_accept ? 1 : 0
    ]);
  }

  function _promoGetOperation(payload) {
    var payloadHash = _promoBuildPayloadHash(payload);
    if (_promoPendingOperation && _promoPendingOperation.payloadHash === payloadHash) {
      return _promoPendingOperation;
    }
    _promoPendingOperation = {
      key: _promoNovoIdempotencyKey(),
      payloadHash: payloadHash
    };
    return _promoPendingOperation;
  }

  function _promoClearOperation() {
    _promoPendingOperation = null;
  }

  // ─── enviarSorteioPromo: envia dados ao backend via POST /api/promocao/cadastro
  // ANTES: gravava direto no GitHub API + abria WhatsApp.
  // AGORA: chama o Worker (ITAP_WORKER_API) e exibe o ID retornado na tela (sem WhatsApp).
  async function enviarSorteioPromo() {
    if (!_promoCadastroLiberado || _promoSubmitting) return;
    if (window._sorteioEncerrado) {
      mostrarMsgSorteio('⛔ As inscrições para este sorteio foram encerradas. Obrigado pela participação!', 'aviso');
      return;
    }
    if (inputPromoHp && inputPromoHp.value) {
      mostrarMsgSorteio('Erro de validação. Tente novamente.', 'aviso');
      return;
    }

    var msgRate = _promoVerificarRate();
    if (msgRate) {
      mostrarMsgSorteio(msgRate, 'aviso');
      return;
    }

    var nome = (inputPromoNome && inputPromoNome.value ? inputPromoNome.value : '').replace(/[<>&"'\/]/g, '').trim();
    var dataNasc = obterDataPromoStr();
    var dataNascIso = parseDataBrPromoToIso(dataNasc);
    var cel = inputPromoCelular ? inputPromoCelular.value.replace(/\D/g, '') : '';
    limparValidacaoPromo();

    if (nome.length < 3) {
      marcarCampoInvalido(inputPromoNome, true);
      mostrarMsgSorteio('Informe seu nome completo com pelo menos 3 caracteres.', 'aviso');
      trackPromoEvent('promotion_validation_error', { field: 'name' });
      return;
    }
    if (!dataNascIso) {
      marcarCampoInvalido(inputPromoDia, true);
      marcarCampoInvalido(inputPromoMes, true);
      marcarCampoInvalido(inputPromoAno, true);
      mostrarMsgSorteio('Selecione dia, mês e ano de nascimento.', 'aviso');
      trackPromoEvent('promotion_validation_error', { field: 'birthdate' });
      return;
    }
    if (!PROMO_MOBILE_REGEX.test(cel)) {
      marcarCampoInvalido(inputPromoCelular, true);
      mostrarMsgSorteio('Celular inválido. Apenas DDD 16 é permitido (formato 169XXXXXXXX).', 'aviso');
      trackPromoEvent('promotion_validation_error', { field: 'phone' });
      return;
    }
    if (obterIdadePromo(dataNascIso) < 18) {
      marcarCampoInvalido(inputPromoDia, true);
      marcarCampoInvalido(inputPromoMes, true);
      marcarCampoInvalido(inputPromoAno, true);
      mostrarMsgSorteio('⛔ É necessário ter 18 anos ou mais para participar do sorteio.', 'aviso');
      trackPromoEvent('promotion_validation_error', { field: 'birthdate_min_age' });
      return;
    }

    _promoSubmitting = true;

    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.textContent = 'Enviando cadastro…';
      btnEnviarPromo.setAttribute('aria-busy', 'true');
    }
    mostrarMsgSorteio('Carregando opções… registrando seu cadastro, aguarde.', 'info');
    trackPromoEvent('promotion_form_submit', {});

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, _promoTimeoutMs);
    var payload = {
      name: nome,
      birthdate: dataNascIso,
      phone: cel,
      regulation_accept: true
    };
    var operacao = _promoGetOperation(payload);
    try {
      var resposta = await fetch(ITAP_WORKER_API + '/api/promocao/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': operacao.key
        },
        signal: controller.signal,
        body: JSON.stringify(Object.assign({}, payload, { idempotencyKey: operacao.key }))
      });
      clearTimeout(timeoutId);
      // Conta a tentativa apenas quando o servidor respondeu (evita bloquear
      // o usuário por falhas de rede ou timeout fora do controle dele).
      _promoRegistrarTentativa();

      var dados;
      var ct = resposta.headers.get('content-type') || '';
      var respostaEhJson = ct.includes('application/json');
      if (respostaEhJson) {
        try { dados = await resposta.json(); } catch (_) { dados = {}; }
      } else {
        // Serviço indisponível: retornou HTML (ex: offline.html) em vez de JSON
        dados = { success: false, error: '_servico_indisponivel' };
      }
      var requestIdTxt = dados && dados.requestId ? ' Protocolo: ' + String(dados.requestId).replace(/[^\w\-:.]/g, '').slice(0, 80) + '.' : '';

      if (resposta.status >= 200 && resposta.status < 300 && dados.success === true) {
        exibirRegrasRetiradaPromo();
        var registrationId = dados.registrationId ? String(dados.registrationId).replace(/[^\w\-:.]/g, '').slice(0, 80) : '';
        var registrationIdTxt = registrationId ? ' Código: ' + registrationId + '.' : '';
        var wppTxt = '';
        if (registrationId) {
          var wppMsg = encodeURIComponent('Olá! Meu código de inscrição na promoção Itapolitana Cajuru é: ' + registrationId);
          wppTxt = ' <a href="https://wa.me/5516996062046?text=' + wppMsg + '" target="_blank" rel="noopener noreferrer" style="color:#fff;font-weight:700;text-decoration:underline;margin-left:4px">📲 Enviar para WhatsApp</a>';
        }
        if (!feedbackPromo) {
          mostrarMsgSorteio('Cadastro realizado com sucesso! Você já está participando do sorteio.' + registrationIdTxt + requestIdTxt, 'ok');
        } else {
          feedbackPromo.style.display = 'block';
          feedbackPromo.className = 'alert alert-success';
          feedbackPromo.setAttribute('role', 'status');
          feedbackPromo.setAttribute('aria-live', 'polite');
          feedbackPromo.innerHTML = 'Cadastro realizado com sucesso! Você já está participando do sorteio.' + registrationIdTxt + requestIdTxt + wppTxt;
        }
        trackPromoEvent('promotion_form_success', { code: dados.code || 'PROMO_REGISTRATION_CREATED' });
        _promoLimparRate();
        _promoClearOperation();
        resetarFormularioPromo({ manterFeedback: true, manterRegras: true });
      } else if (dados.error === '_offline') {
        mostrarMsgSorteioComAcao(
          'Você está sem conexão. Verifique sua internet e tente novamente.',
          'aviso',
          'Tentar novamente',
          function() { enviarSorteioPromo(); }
        );
        trackPromoEvent('promotion_network_error', { reason: 'offline' });
      } else if (dados.error === '_servico_indisponivel') {
        mostrarMsgSorteioComAcao(
          'O servidor respondeu de forma inesperada. Tente novamente em instantes.',
          'aviso',
          'Tentar novamente',
          function() { enviarSorteioPromo(); }
        );
        trackPromoEvent('promotion_network_error', { reason: 'unexpected_content_type' });
      } else {
        var erro = (dados && dados.error) ? String(dados.error) : '';
        var code = (dados && dados.code) ? String(dados.code) : '';
        if (resposta.status === 409 || code === 'PROMO_REGISTRATION_EXISTS' || /ja|já.*cadastr/i.test(erro)) {
          mostrarMsgSorteio('Você já está inscrito para a promoção deste mês.', 'aviso');
          _promoClearOperation();
        } else if (resposta.status === 400) {
          mostrarMsgSorteio('Confira os dados informados.', 'aviso');
          if (/nome/i.test(erro)) marcarCampoInvalido(inputPromoNome, true);
          if (/data|nasc/i.test(erro)) { marcarCampoInvalido(inputPromoDia, true); marcarCampoInvalido(inputPromoMes, true); marcarCampoInvalido(inputPromoAno, true); }
          if (/celular|telefone|ddd|phone/i.test(erro)) marcarCampoInvalido(inputPromoCelular, true);
          trackPromoEvent('promotion_validation_error', { reason: 'server_validation' });
        } else if (resposta.status === 429) {
          mostrarMsgSorteio('Você tentou muitas vezes. Aguarde alguns instantes e tente novamente.', 'aviso');
        } else if (resposta.status === 500 || resposta.status === 502 || resposta.status === 503) {
          mostrarMsgSorteioComAcao(
            'O cadastro não foi concluído. Tente novamente mais tarde.',
            'aviso',
            'Tentar novamente',
            function() { enviarSorteioPromo(); }
          );
        } else if (resposta.status >= 400 && resposta.status < 500) {
          mostrarMsgSorteio('Confira os dados informados.', 'aviso');
        } else if (respostaEhJson && Object.keys(dados || {}).length === 0) {
          mostrarMsgSorteio('O servidor respondeu de forma inesperada. Tente novamente em instantes.', 'aviso');
        } else {
          mostrarMsgSorteioComAcao(
            'O cadastro não foi concluído. Tente novamente mais tarde.' + requestIdTxt,
            'aviso',
            'Tentar novamente',
            function() { enviarSorteioPromo(); }
          );
          trackPromoEvent('promotion_network_error', { reason: erro || 'unknown_error' });
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      var isTimeout = e && e.name === 'AbortError';
      if (isTimeout) {
        mostrarMsgSorteioComAcao(
          'O servidor demorou para responder. Aguarde alguns instantes e tente novamente.',
          'aviso',
          'Tentar novamente',
          function() { enviarSorteioPromo(); }
        );
      } else {
        mostrarMsgSorteioComAcao(
          'Não foi possível alcançar o servidor. Verifique sua conexão e tente novamente.',
          'aviso',
          'Tentar novamente',
          function() { enviarSorteioPromo(); }
        );
      }
      trackPromoEvent('promotion_network_error', { reason: isTimeout ? 'timeout' : 'exception' });
    } finally {
      if (btnEnviarPromo) {
        btnEnviarPromo.textContent = 'Fazer cadastro';
        btnEnviarPromo.removeAttribute('aria-busy');
        atualizarFluxoCadastroPromo();
      }
      _promoSubmitting = false;
    }
  }
  (function inicializarFormularioClientePromo() {
    if (!formCadastroPromo) return;

    formCadastroPromo.addEventListener('submit', function(evento) {
      evento.preventDefault();
      enviarSorteioPromo();
    });
    trackPromoEvent('promotion_form_start', {});

    if (inputPromoNome) {
      ['input', 'change'].forEach(function(evt) {
        inputPromoNome.addEventListener(evt, atualizarFluxoCadastroPromo);
      });
    }

    [inputPromoDia, inputPromoMes, inputPromoAno].forEach(function(el) {
      if (!el) return;
      ['change'].forEach(function(evt) {
        el.addEventListener(evt, function() {
          var iso = parseDataBrPromoToIso(obterDataPromoStr());
          if (iso && obterIdadePromo(iso) < 18) {
            mostrarMsgSorteio('⛔ É necessário ter 18 anos ou mais para participar.', 'aviso');
            marcarCampoInvalido(inputPromoDia, true);
            marcarCampoInvalido(inputPromoMes, true);
            marcarCampoInvalido(inputPromoAno, true);
          } else {
            mostrarMsgSorteio('', '');
            marcarCampoInvalido(inputPromoDia, false);
            marcarCampoInvalido(inputPromoMes, false);
            marcarCampoInvalido(inputPromoAno, false);
          }
          atualizarFluxoCadastroPromo();
        });
      });
    });

    if (inputPromoCelular) {
      ['input', 'change'].forEach(function(evt) {
        inputPromoCelular.addEventListener(evt, function() {
          mascaraTelPromo(inputPromoCelular);
          atualizarFluxoCadastroPromo();
        });
      });
    }

    if (regrasRetiradaPromo) regrasRetiradaPromo.style.display = 'none';
    mostrarMsgSorteio('', '');
    atualizarFluxoCadastroPromo();
  })();
  // ═══════════════════════════════════════════════════════════

  function irParaSeção(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var modalBox = el.closest('.modal-box');
    if (modalBox) {
      var offset = el.offsetTop - modalBox.offsetTop;
      modalBox.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    } else {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // UX FINAL (temporário): flag local para exibir estado vazio.
  // Quando o dono quiser, o ideal é controlar isso por dados/promo.json ou painel admin (CMS).
  (function controlarEstadoOfertas() {
    var PROMOCOES_ATIVAS = true; // Altere para false quando quiser mostrar "Sem promoções no momento".
    var gridOfertas = document.getElementById('ofertas-grid-principal');
    var gridCombos = document.getElementById('combos-grid-principal');
    var semPromo = document.getElementById('sem-promocoes-card');
    if (!gridOfertas || !gridCombos || !semPromo) return;
    if (PROMOCOES_ATIVAS) {
      semPromo.style.display = 'none';
      gridOfertas.style.display = 'grid';
      gridCombos.style.display = 'grid';
    } else {
      semPromo.style.display = 'block';
      gridOfertas.style.display = 'none';
      gridCombos.style.display = 'none';
    }
  })();

  // ═══ CARREGAMENTO DINÂMICO DO PROMO.JSON ═══
  // Atualiza os campos da página com os dados salvos pelo admin
  (function carregarPromoJson() {
    var PROMO_URL = 'dados/promo.json?v=' + Date.now();
    fetch(PROMO_URL)
      .then(function(r) { return r.json(); })
      .catch(function() { return null; })
      .then(function(pr) {
        if (!pr) return; // fallback: mantém hardcoded

        // Título do header (h1)
        var h1 = document.getElementById('promocao-hero-titulo') || document.getElementById('promo-h1');
        if (h1 && pr.headerTitulo) h1.textContent = pr.headerTitulo;

        // Frase do banner laranja
        var bannerP = document.getElementById('promo-banner-p');
        if (bannerP && pr.bannerFrase) bannerP.textContent = pr.bannerFrase;

        // Badge verde
        var badge = document.getElementById('promo-badge-el');
        if (badge && pr.badge) badge.textContent = pr.badge;

        // Título da promoção
        var titulo = document.getElementById('promo-titulo-el');
        if (titulo && (pr.título || pr.titulo)) titulo.textContent = pr.título || pr.titulo;

        // Descrição
        var desc = document.getElementById('promo-desc-el');
        if (desc && (pr.descrição || pr.descricao)) desc.textContent = pr.descrição || pr.descricao;

        // Imagem do banner (se o admin fez upload)
        var imgBanner = document.getElementById('promo-img-banner');
        if (imgBanner && pr.fotoUrl) {
          imgBanner.src = pr.fotoUrl + '?v=' + Date.now();
        }

        // WhatsApp do botão de contato (se configurado no config.json)
        // Não altera WHATS_SORVETERIA aqui pois já está correto
      });
  })();

  // Atualizar links WhatsApp usando a configuração centralizada do site-loader
  function atualizarWhatsAppComConfig(cfg) {
    if (!cfg || !cfg.whatsapp) return;
    var numero = String(cfg.whatsapp).replace(/\D/g, '');
    if (!numero) return;
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
      try {
        var url = new URL(a.href);
        a.href = 'https://wa.me/' + numero + (url.search || '');
      } catch(e) {}
    });
  }

  if (window.SITE_CONFIG) {
    atualizarWhatsAppComConfig(window.SITE_CONFIG);
  }
  window.addEventListener('siteConfigLoaded', function(ev) {
    atualizarWhatsAppComConfig(ev && ev.detail);
  });

  // Carregar promoções adicionais de dados/promocoes.json
  (function() {
    var container = document.getElementById('promos-adicionais-lista');
    if (!container) return;
    fetch('dados/promocoes.json?v=' + Date.now())
      .then(function(r) { return r.ok ? r.json() : {promocoes:[]}; })
      .then(function(data) {
        var lista = (data.promocoes || []).filter(function(p) { return p.status === 'ativa'; });
        if (!lista.length) { container.style.display = 'none'; return; }
        container.innerHTML = lista.map(function(p) {
          return '<div class="promo-card" style="margin-bottom:16px">'
            + '<div class="promo-content">'
            + (p.periodo ? '<span class="promo-badge">' + p.periodo + '</span>' : '')
            + '<h3 class="promo-title" style="font-size:18px">' + p.nome + '</h3>'
            + (p.descricao ? '<p class="promo-desc">' + p.descricao + '</p>' : '')
            + '</div></div>';
        }).join('');
      })
      .catch(function() { container.style.display = 'none'; });
  })();

  // ═══ ENCERRAMENTO DO SORTEIO ═══
  // O sorteio é mensal e não tem data de término.
  // Para encerrar: setar window._sorteioEncerrado = true no painel admin.
