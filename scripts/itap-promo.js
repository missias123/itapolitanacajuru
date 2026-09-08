/**
 * ITAP-PROMO.JS — Lógica da Promoção Mensal 2027
 * Validação estrita DDD 16, Ticket da Sorte e integração com Worker API.
 */
(function() {
  'use strict';

  function calcularPróximoFim() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    return new Date(ano, mes + 1, 1, 0, 1, 0);
  }

  let dataAlvo = calcularPróximoFim();

  function tick() {
    const agora = new Date();
    const diff = dataAlvo - agora;

    if (diff <= 0) {
      var row = document.getElementById('cd-row');
      var enc = document.getElementById('cd-encerrado');
      if (row) row.style.display = 'none';
      if (enc) enc.style.display = 'block';
      
      const novaData = calcularPróximoFim();
      if (novaData > agora) {
        dataAlvo = novaData;
        if (row) row.style.display = 'flex';
        if (enc) enc.style.display = 'none';
      }
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const elD = document.getElementById('cd-d');
    const elH = document.getElementById('cd-h');
    const elM = document.getElementById('cd-m');
    const elS = document.getElementById('cd-s');

    if (elD) elD.innerText = d.toString().padStart(2, '0');
    if (elH) elH.innerText = h.toString().padStart(2, '0');
    if (elM) elM.innerText = m.toString().padStart(2, '0');
    if (elS) elS.innerText = s.toString().padStart(2, '0');
  }

  setInterval(tick, 1000);
  tick();

  var ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';
  var PROMO_MOBILE_REGEX = /^169\d{8}$/;
  var formCadastroPromo = document.getElementById('form-promocao-cliente');
  var inputPromoNome = document.getElementById('promo-nome-cliente');
  var inputPromoDia = document.getElementById('promo-dia-nasc');
  var inputPromoMes = document.getElementById('promo-mes-nasc');
  var inputPromoAno = document.getElementById('promo-ano-nasc');
  var inputPromoCelular = document.getElementById('promo-celular-cliente');
  var btnEnviarPromo = document.getElementById('promo-enviar-cadastro');
  var feedbackPromo = document.getElementById('promo-feedback-message');
  var feedbackBirthPromo = document.getElementById('promo-birth-feedback');
  var feedbackPhonePromo = document.getElementById('promo-phone-feedback');
  var progressPromo = document.getElementById('promo-form-progress');
  var _promoSubmitting = false;
  var promoFlow = { visibleStep: 1, ready: false };

  function promoDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function promoBirthdateValue() {
    var dia = inputPromoDia ? inputPromoDia.value : '';
    var mes = inputPromoMes ? inputPromoMes.value : '';
    var ano = inputPromoAno ? inputPromoAno.value : '';
    return dia && mes && ano ? (ano + '-' + mes + '-' + dia) : '';
  }

  function isAdultBirthdate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    var partes = value.split('-').map(Number);
    var date = new Date(partes[0], partes[1] - 1, partes[2]);
    if (
      date.getFullYear() !== partes[0] ||
      date.getMonth() !== (partes[1] - 1) ||
      date.getDate() !== partes[2]
    ) return false;
    var limite = new Date();
    limite.setFullYear(limite.getFullYear() - 18);
    limite.setHours(23, 59, 59, 999);
    return date <= limite;
  }

  function setPromoStepFeedback(element, message, ok) {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('is-ok', Boolean(ok) && Boolean(message));
  }

  function setPromoStepState(step, enabled, complete) {
    var block = document.querySelector('[data-promo-step="' + step + '"]');
    if (!block) return;
    block.classList.toggle('is-locked', !enabled);
    block.classList.toggle('is-current', enabled && !complete);
    block.classList.toggle('is-complete', complete);
    block.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    Array.prototype.forEach.call(block.querySelectorAll('input, select, button'), function(control) {
      if (step === 4 && control === btnEnviarPromo) {
        control.disabled = !enabled || _promoSubmitting;
        control.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
        return;
      }
      control.disabled = !enabled;
    });
  }

  function scrollToPromoStep(step) {
    var block = document.querySelector('[data-promo-step="' + step + '"]');
    if (!block) return;
    requestAnimationFrame(function() {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var field = block.querySelector('input:not([disabled]), select:not([disabled]), button:not([disabled])');
      if (field) field.focus({ preventScroll: true });
    });
  }

  function getPromoFormState() {
    var nome = inputPromoNome ? inputPromoNome.value.trim() : '';
    var birthdate = promoBirthdateValue();
    var phone = promoDigits(inputPromoCelular ? inputPromoCelular.value : '');
    var nameValid = nome.length >= 3;
    var birthComplete = Boolean(birthdate);
    var birthValid = birthComplete && isAdultBirthdate(birthdate);
    var phoneValid = PROMO_MOBILE_REGEX.test(phone);
    return {
      nome: nome,
      birthdate: birthdate,
      phone: phone,
      nameValid: nameValid,
      birthComplete: birthComplete,
      birthValid: birthValid,
      phoneValid: phoneValid,
      ready: nameValid && birthValid && phoneValid
    };
  }

  function syncPromoCascade(options) {
    var cfg = options || {};
    var state = getPromoFormState();
    if (inputPromoNome) inputPromoNome.setAttribute('aria-invalid', state.nameValid || !state.nome ? 'false' : 'true');
    [inputPromoDia, inputPromoMes, inputPromoAno].forEach(function(select) {
      if (!select) return;
      select.setAttribute('aria-invalid', !state.birthComplete ? 'false' : (state.birthValid ? 'false' : 'true'));
    });
    if (inputPromoCelular) inputPromoCelular.setAttribute('aria-invalid', state.phoneValid || !state.phone ? 'false' : 'true');

    setPromoStepFeedback(feedbackBirthPromo, !state.birthComplete ? '' : (state.birthValid ? '✅ Data válida. Próxima etapa liberada.' : '⚠️ Informe uma data válida para maior de 18 anos.'), state.birthValid);
    setPromoStepFeedback(feedbackPhonePromo, !state.phone ? '' : (state.phoneValid ? '✅ WhatsApp válido. Cadastro liberado.' : '⚠️ Use um celular com DDD 16.'), state.phoneValid);

    setPromoStepState(1, true, state.nameValid);
    setPromoStepState(2, state.nameValid, state.birthValid);
    setPromoStepState(3, state.birthValid, state.phoneValid);
    setPromoStepState(4, state.phoneValid, state.ready);

    var visibleStep = !state.nameValid ? 1 : !state.birthValid ? 2 : !state.phoneValid ? 3 : 4;
    if (progressPromo && progressPromo.lastElementChild) {
      progressPromo.lastElementChild.textContent = !state.nameValid
        ? 'Etapa 1 de 4 · informe seu nome completo.'
        : !state.birthValid
          ? 'Etapa 2 de 4 · confirme sua data de nascimento válida e maior de 18 anos.'
          : !state.phoneValid
            ? 'Etapa 3 de 4 · informe um WhatsApp com DDD 16.'
            : 'Etapa 4 de 4 · revise e envie seu cadastro.';
    }
    promoFlow.ready = state.ready;
    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = !state.ready || _promoSubmitting;
      btnEnviarPromo.setAttribute('aria-disabled', btnEnviarPromo.disabled ? 'true' : 'false');
      btnEnviarPromo.innerHTML = _promoSubmitting
        ? '🔄 Processando Inscrição...'
        : (state.ready ? '🎁 Cadastrar para concorrer à Torta 2027' : 'Preencha as etapas para liberar o cadastro');
    }
    if (cfg.scroll && visibleStep > promoFlow.visibleStep) scrollToPromoStep(visibleStep);
    promoFlow.visibleStep = visibleStep;
    return state;
  }

  function mostrarMensagem(msg, tipo) {
    if (!feedbackPromo) return;
    feedbackPromo.style.display = 'block';
    
    var bg = tipo === 'ok' ? '#e8f5e9' : (tipo === 'aviso' ? '#fff3e0' : '#ffebee');
    var color = tipo === 'ok' ? '#2e7d32' : (tipo === 'aviso' ? '#ef6c00' : '#c62828');
    var border = tipo === 'ok' ? '#43a047' : (tipo === 'aviso' ? '#ffa726' : '#ef5350');

    feedbackPromo.style.background = bg;
    feedbackPromo.style.color = color;
    feedbackPromo.style.border = '2px solid ' + border;
    feedbackPromo.style.padding = '16px';
    feedbackPromo.style.borderRadius = '14px';
    feedbackPromo.style.textAlign = 'center';
    feedbackPromo.style.fontWeight = '700';

    feedbackPromo.innerHTML = msg;
    feedbackPromo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function enviarSorteioPromo(nome, birthdate, phone) {
    if (_promoSubmitting) return;
    _promoSubmitting = true;
    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.setAttribute('aria-disabled', 'true');
      btnEnviarPromo.innerHTML = '🔄 Processando Inscrição...';
    }

    try {
      var payload = {
        name: nome,
        birthdate: birthdate,
        phone: phone,
        regulation_accept: true,
        idempotencyKey: 'promo-' + phone + '-' + new Date().toISOString().slice(0, 10)
      };

      var resposta = await fetch(ITAP_WORKER_API + '/api/promocao/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var dados = {};
      var ct = resposta.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        dados = await resposta.json();
      }

      if (resposta.status === 201 && dados.success) {
        var regId = dados.registrationId || 'SRT-2027-' + Math.floor(1000 + Math.random() * 9000);
        var msgSucesso = `
          <div style="font-size: 1.1rem; margin-bottom: 8px;">🎉 <strong>Inscrição Confirmada com Sucesso!</strong> 🎉</div>
          <div style="font-size: 0.9rem; margin-bottom: 12px; color: #333;">Seu cadastro está confirmado para concorrer aos sorteios mensais de uma Torta de Sorvete. As inscrições estão abertas pelo site oficial da Itapolitana Cajuru, e o primeiro sorteio da torta será em janeiro de 2027.</div>
          <div class="ticket-sorte">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Seu Ticket da Sorte Itapolitana</div>
            <div class="ticket-codigo">${regId}</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">Guarde este código para a retirada do prêmio!</div>
          </div>
          <div style="margin-top: 15px;">
            <a href="https://api.whatsapp.com/send?phone=5516996062046&text=${encodeURIComponent('Olá, acabei de me cadastrar no Sorteio Mensal 2027 da Itapolitana! Meu ID de inscrição é ' + regId)} " target="_blank" class="btn btn-success btn-block" style="font-size: 0.9rem; padding: 12px;">
              💬 Enviar Confirmação por WhatsApp
            </a>
          </div>
        `;
        mostrarMensagem(msgSucesso, 'ok');
        formCadastroPromo.reset();
        setPromoStepFeedback(feedbackBirthPromo, '', false);
        setPromoStepFeedback(feedbackPhonePromo, '', false);
        promoFlow.visibleStep = 1;
        promoFlow.ready = false;
        syncPromoCascade();
      } else {
        mostrarMensagem('❌ ' + (dados.error || 'Erro ao realizar cadastro. Verifique se já está cadastrado este mês.'), 'erro');
      }
    } catch (e) {
      mostrarMensagem('❌ Não foi possível confirmar o cadastro. Verifique sua conexão e tente novamente.', 'erro');
    } finally {
      _promoSubmitting = false;
      syncPromoCascade();
    }
  }

  // Máscara de celular (16) 99999-9999
  if (inputPromoCelular) {
    inputPromoCelular.oninput = function(e) {
      var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
      syncPromoCascade({ scroll: true });
    };
  }

  [inputPromoNome, inputPromoDia, inputPromoMes, inputPromoAno].forEach(function(field) {
    if (!field) return;
    field.addEventListener('input', function() { syncPromoCascade({ scroll: true }); });
    field.addEventListener('change', function() { syncPromoCascade({ scroll: true }); });
  });

  if (formCadastroPromo) {
    formCadastroPromo.onsubmit = function(e) {
      e.preventDefault();
      var state = syncPromoCascade();
      var nome = state.nome;
      var dia = inputPromoDia ? inputPromoDia.value : '';
      var mes = inputPromoMes ? inputPromoMes.value : '';
      var ano = inputPromoAno ? inputPromoAno.value : '';
      var cel = state.phone;

      if (!state.nameValid) {
        mostrarMensagem('Por favor, informe seu nome completo.', 'aviso');
        return;
      }
      if (!dia || !mes || !ano) {
        mostrarMensagem('Por favor, selecione sua data de nascimento completa.', 'aviso');
        return;
      }
      if (!state.birthValid) {
        mostrarMensagem('❌ Atenção: o cadastro exige uma data de nascimento válida para maiores de 18 anos.', 'erro');
        return;
      }
      if (!PROMO_MOBILE_REGEX.test(cel)) {
        mostrarMensagem('❌ Atenção: Apenas números de celular com **DDD 16** são aceitos para cadastro e pedidos na Itapolitana.', 'erro');
        return;
      }

      var dataNasc = ano + '-' + mes + '-' + dia;
      enviarSorteioPromo(nome, dataNasc, cel);
    };
  }

  syncPromoCascade();

})();
