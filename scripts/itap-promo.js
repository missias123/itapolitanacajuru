/**
 * ITAP-PROMO.JS — Lógica da Promoção Mensal
 * Extraído de promocao.html na Fase 3 da refatoração arquitetural.
 */
(function() {
  'use strict';

  function calcularPróximoFim() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    // Dia 01 do mês seguinte às 00:01 — sorteio mensal conforme solicitado pelo usuário
    return new Date(ano, mes + 1, 1, 0, 1, 0);
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

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const elD = document.getElementById('days');
    const elH = document.getElementById('hours');
    const elM = document.getElementById('minutes');
    const elS = document.getElementById('seconds');

    if (elD) elD.innerText = d.toString().padStart(2, '0');
    if (elH) elH.innerText = h.toString().padStart(2, '0');
    if (elM) elM.innerText = m.toString().padStart(2, '0');
    if (elS) elS.innerText = s.toString().padStart(2, '0');
  }

  setInterval(tick, 1000);
  tick();

  // ═══════════════════════════════════════════════════════════
  // SORTEIO MENSAL — FUNÇÕES COMPLETAS
  // ═══════════════════════════════════════════════════════════
  // Endpoint do Cloudflare Worker — cadastro interno (sem WhatsApp automático, mas com link de confirmação)
  var ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';
  var PROMO_MOBILE_REGEX = /^169\d{8}$/;
  var formCadastroPromo = document.getElementById('form-promocao-cliente');
  var inputPromoNome = document.getElementById('promo-nome-cliente');
  var inputPromoData = document.getElementById('promo-data-nasc-cliente');
  var inputPromoCelular = document.getElementById('promo-celular-cliente');
  var inputPromoHp = document.getElementById('promo-honeypot');
  var btnEnviarPromo = document.getElementById('promo-enviar-cadastro');
  var feedbackPromo = document.getElementById('promo-feedback-message');
  var regrasRetiradaPromo = document.getElementById('promo-regras-retirada-premio');
  var _promoCadastroLiberado = false;
  var _promoSubmitting = false;
  var _promoPendingOperation = null;

  function mostrarMsgSorteio(msg, tipo) {
    if (!feedbackPromo) return;
    feedbackPromo.style.display = 'block';
    feedbackPromo.className = 'alert alert-' + (tipo === 'ok' ? 'success' : (tipo === 'aviso' ? 'warning' : 'danger'));
    feedbackPromo.innerHTML = msg;
    feedbackPromo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function mostrarMsgSorteioComAcao(msg, tipo, btnTxt, btnAction, whatsappLink) {
    if (!feedbackPromo) return;
    feedbackPromo.style.display = 'block';
    feedbackPromo.className = 'alert alert-' + (tipo === 'ok' ? 'success' : (tipo === 'aviso' ? 'warning' : 'danger'));
    
    var html = '<p>' + msg + '</p>';
    if (whatsappLink) {
      html += '<div class="mt-3"><a href="' + whatsappLink + '" target="_blank" class="btn btn-success btn-sm"><i class="fab fa-whatsapp"></i> Enviar Confirmação por WhatsApp</a></div>';
    }
    if (btnTxt && btnAction) {
      var btnId = 'btn-promo-action-' + Date.now();
      html += '<div class="mt-2"><button type="button" id="' + btnId + '" class="btn btn-outline-dark btn-sm">' + btnTxt + '</button></div>';
      feedbackPromo.innerHTML = html;
      setTimeout(function() {
        var b = document.getElementById(btnId);
        if (b) b.onclick = btnAction;
      }, 50);
    } else {
      feedbackPromo.innerHTML = html;
    }
    feedbackPromo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function exibirRegrasRetiradaPromo() {
    if (regrasRetiradaPromo) {
      regrasRetiradaPromo.style.display = 'block';
      regrasRetiradaPromo.classList.add('animate__animated', 'animate__fadeIn');
    }
  }

  async function enviarSorteioPromo(nome, birthdate, phone) {
    if (_promoSubmitting) return;
    _promoSubmitting = true;
    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
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
        exibirRegrasRetiradaPromo();
        var registrationIdTxt = dados.registrationId ? ' Código: ' + dados.registrationId + '.' : '';
        var whatsappLink = 'https://api.whatsapp.com/send?phone=5516996062046&text=Ol%C3%A1%20' + encodeURIComponent(nome) + '%2C%20sua%20inscri%C3%A7%C3%A3o%20para%20o%20sorteio%20mensal%20foi%20confirmada%21%20Seu%20ID%20de%20inscri%C3%A7%C3%A3o%20%C3%A9%20' + dados.registrationId + '.%20Boa%20sorte%21';
        mostrarMsgSorteioComAcao('Cadastro realizado com sucesso! Você já está participando do sorteio.' + registrationIdTxt, 'ok', null, null, whatsappLink);
        formCadastroPromo.reset();
      } else {
        mostrarMsgSorteio(dados.error || 'Erro ao realizar cadastro.', 'erro');
      }
    } catch (e) {
      mostrarMsgSorteio('Erro de conexão. Tente novamente.', 'erro');
    } finally {
      _promoSubmitting = false;
      if (btnEnviarPromo) {
        btnEnviarPromo.disabled = false;
        btnEnviarPromo.innerHTML = 'Quero Participar!';
      }
    }
  }

  if (formCadastroPromo) {
    formCadastroPromo.onsubmit = function(e) {
      e.preventDefault();
      var nome = inputPromoNome.value.trim();
      var data = inputPromoData.value;
      var cel = inputPromoCelular.value.replace(/\D/g, '');
      
      if (!PROMO_MOBILE_REGEX.test(cel)) {
        mostrarMsgSorteio('Por favor, informe um celular válido com DDD 16.', 'erro');
        return;
      }
      
      enviarSorteioPromo(nome, data, cel);
    };
  }
})();
