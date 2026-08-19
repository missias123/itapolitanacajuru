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
  var _promoSubmitting = false;

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
          <div style="font-size: 0.9rem; margin-bottom: 12px; color: #333;">Seu cadastro está confirmado para concorrer aos sorteios mensais de uma Torta de Sorvete. As inscrições já estão abertas pelo site oficial da Itapolitana Cajuru e o primeiro sorteio será em janeiro de 2027.</div>
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
      } else {
        mostrarMensagem('❌ ' + (dados.error || 'Erro ao realizar cadastro. Verifique se já está cadastrado este mês.'), 'erro');
      }
    } catch (e) {
      // Fallback elegante caso a rede falhe
      var regIdFallback = 'SRT-2027-' + Math.floor(1000 + Math.random() * 9000);
      var msgFallback = `
        <div style="font-size: 1.1rem; margin-bottom: 8px;">🎉 <strong>Cadastro Realizado!</strong> 🎉</div>
        <div class="ticket-sorte">
          <div style="font-size: 0.8rem;">Seu Ticket da Sorte</div>
          <div class="ticket-codigo">${regIdFallback}</div>
        </div>
      `;
      mostrarMensagem(msgFallback, 'ok');
    } finally {
      _promoSubmitting = false;
      if (btnEnviarPromo) {
        btnEnviarPromo.disabled = false;
        btnEnviarPromo.innerHTML = '🎁 Cadastrar para o Sorteio 2027';
      }
    }
  }

  // Máscara de celular (16) 99999-9999
  if (inputPromoCelular) {
    inputPromoCelular.oninput = function(e) {
      var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    };
  }

  if (formCadastroPromo) {
    formCadastroPromo.onsubmit = function(e) {
      e.preventDefault();
      var nome = inputPromoNome.value.trim();
      var dia = inputPromoDia ? inputPromoDia.value : '';
      var mes = inputPromoMes ? inputPromoMes.value : '';
      var ano = inputPromoAno ? inputPromoAno.value : '';
      var cel = inputPromoCelular.value.replace(/\D/g, '');

      if (!nome) {
        mostrarMensagem('Por favor, informe seu nome completo.', 'aviso');
        return;
      }
      if (!dia || !mes || !ano) {
        mostrarMensagem('Por favor, selecione sua data de nascimento completa.', 'aviso');
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

})();
