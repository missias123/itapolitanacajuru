/* Promoções — lógica do sorteio e contador
 * Extraído de promocao.html na Fase 3 da refatoração arquitetural.
 */
  function calcularPróximoFim() {
    const agora = new Date();
    let ano = agora.getFullYear();
    let mes = agora.getMonth();
    
    if (agora.getDate() > 1 || (agora.getDate() === 1 && agora.getHours() >= 10)) {
      mes++;
      if (mes > 11) { mes = 0; ano++; }
    }
    
    const limiteFinal = new Date(2030, 0, 1, 1, 1, 0);
    const próximoAlvo = new Date(ano, mes, 1, 10, 0, 0);
    
    return próximoAlvo > limiteFinal ? limiteFinal : próximoAlvo;
  }

  let dataAlvo = calcularPróximoFim();

  function tick() {
    const agora = new Date();
    const diff = dataAlvo - agora;

    if (diff <= 0) {
      document.getElementById('cd-row').style.display = 'none';
      document.getElementById('cd-encerrado').style.display = 'block';
      
      if (agora.getMinutes() >= 1 || agora.getHours() > 10 || agora.getDate() > 1) {
        dataAlvo = calcularPróximoFim();
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
  var ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';
  var PROMO_MOBILE_REGEX = /^(1[1-9]|[2-9]\d)9\d{8}$/;
  var formCadastroPromo = document.getElementById('form-promocao-cliente');
  var inputPromoNome = document.getElementById('promo-nome-cliente');
  var inputPromoData = document.getElementById('promo-data-nasc-cliente');
  var inputPromoCelular = document.getElementById('promo-celular-cliente');
  var inputPromoHp = document.getElementById('promo-honeypot');
  // ID atualizado: botão agora envia para o backend (sem WhatsApp)
  var btnEnviarPromo = document.getElementById('promo-enviar-cadastro');
  var feedbackPromo = document.getElementById('promo-feedback-message');
  var regrasRetiradaPromo = document.getElementById('promo-regras-retirada-premio');
  var _promoCadastroLiberado = false;

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
    campo.disabled = !habilitado;
    campo.classList.toggle('form-control-disabled', !habilitado);
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

  function mascaraDataPromo(el) {
    if (!el) return;
    var digitos = String(el.value || '').replace(/\D/g, '').slice(0, 8);
    if (digitos.length > 4) {
      el.value = digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4);
    } else if (digitos.length > 2) {
      el.value = digitos.slice(0, 2) + '/' + digitos.slice(2);
    } else {
      el.value = digitos;
    }
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
    return !!(inputPromoData && parseDataBrPromoToIso(inputPromoData.value));
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
      return;
    }
    feedbackPromo.style.display = 'block';
    feedbackPromo.textContent = txt;
    feedbackPromo.className = 'alert ' + (tipo === 'ok' || tipo === 'info' ? 'alert-success' : 'alert-warning');
  }

  function exibirRegrasRetiradaPromo() {
    if (regrasRetiradaPromo) regrasRetiradaPromo.style.display = 'block';
  }

  function atualizarFluxoCadastroPromo() {
    var podeEditarNome = _promoCadastroLiberado;
    var podeEditarData = podeEditarNome && promoNomeValido();
    var podeEditarCelular = podeEditarData && promoDataValida();

    setCampoPromoHabilitado(inputPromoNome, podeEditarNome);
    setCampoPromoHabilitado(inputPromoData, podeEditarData);
    setCampoPromoHabilitado(inputPromoCelular, podeEditarCelular);

    if (btnEnviarPromo) btnEnviarPromo.disabled = !(_promoCadastroLiberado && promoCamposValidos());
  }

  function resetarFormularioPromo(opcoes) {
    var opts = opcoes || {};
    if (inputPromoNome) inputPromoNome.value = '';
    if (inputPromoData) inputPromoData.value = '';
    if (inputPromoCelular) inputPromoCelular.value = '';
    if (inputPromoHp) inputPromoHp.value = '';
    if (!opts.manterFeedback) mostrarMsgSorteio('', '');
    if (!opts.manterRegras && regrasRetiradaPromo) regrasRetiradaPromo.style.display = 'none';
    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.textContent = '📝 Enviar Cadastro';
    }
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

  function montarMensagemWhatsappPromo() { /* removido — cadastro agora é 100% interno via API */ }
  function montarMensagemWhatsappFallbackPromo() { /* removido — cadastro agora é 100% interno via API */ }
  function abrirWhatsAppPromo() { /* removido — sorteio não abre WhatsApp */ return false; }
  function finalizarCadastroPromo() { /* removido — substituído por envio direto à API */ }

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

  // ─── enviarSorteioPromo: envia dados ao backend via POST /api/promocao/cadastro
  // ANTES: gravava direto no GitHub API + abria WhatsApp.
  // AGORA: chama o Worker (ITAP_WORKER_API) e exibe o ID retornado na tela (sem WhatsApp).
  async function enviarSorteioPromo() {
    if (!_promoCadastroLiberado) return;
    if (window._sorteioEncerrado) {
      mostrarMsgSorteio('⛔ As inscrições para o sorteio foram encerradas em 02/01/2027. Obrigado pela participação!', 'aviso');
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
    var dataNasc = inputPromoData ? inputPromoData.value.trim() : '';
    var dataNascIso = parseDataBrPromoToIso(dataNasc);
    var cel = inputPromoCelular ? inputPromoCelular.value.replace(/\D/g, '') : '';

    if (nome.length < 3) {
      mostrarMsgSorteio('Informe seu nome completo com pelo menos 3 caracteres.', 'aviso');
      return;
    }
    if (!dataNascIso) {
      mostrarMsgSorteio('Informe uma data de nascimento válida no formato dd/mm/aaaa.', 'aviso');
      return;
    }
    if (!PROMO_MOBILE_REGEX.test(cel)) {
      mostrarMsgSorteio('Informe um celular válido com DDD e 11 dígitos numéricos.', 'aviso');
      return;
    }
    if (obterIdadePromo(dataNascIso) < 14) {
      mostrarMsgSorteio('É necessário ter no mínimo 14 anos para participar do sorteio.', 'aviso');
      return;
    }

    _promoRegistrarTentativa();

    if (btnEnviarPromo) {
      btnEnviarPromo.disabled = true;
      btnEnviarPromo.textContent = '⏳ Enviando...';
    }
    mostrarMsgSorteio('⏳ Registrando seu cadastro, aguarde...', 'info');

    try {
      var resposta = await fetch(ITAP_WORKER_API + '/api/promocao/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          birthdate: dataNascIso,
          phone: cel,
          regulation_accept: true
        })
      });

      var dados;
      try { dados = await resposta.json(); } catch (_) { dados = {}; }

      if (dados.success) {
        exibirRegrasRetiradaPromo();
        var msgSucesso = dados.alreadyRegistered
          ? '✅ Você já está cadastrado! Seu ID é: ' + dados.id + '. Você concorre a todos os sorteios mensais!'
          : '✅ Cadastro feito com sucesso! Seu ID é: ' + dados.id + '.';
        mostrarMsgSorteio(msgSucesso + ' Guarde esse número para consulta futura.', 'ok');
        _promoLimparRate();
        resetarFormularioPromo({ manterFeedback: true, manterRegras: true });
      } else {
        var erroMsg = (dados && dados.error) ? dados.error : 'Erro desconhecido. Tente novamente.';
        mostrarMsgSorteio('❌ ' + erroMsg, 'aviso');
      }
    } catch (e) {
      console.error('[Itap] Erro no cadastro do sorteio:', e);
      mostrarMsgSorteio('Não foi possível concluir seu cadastro agora. Tente novamente em alguns minutos.', 'aviso');
    } finally {
      if (btnEnviarPromo) {
        btnEnviarPromo.textContent = '📝 Enviar Cadastro';
        atualizarFluxoCadastroPromo();
      }
    }
  }
  (function inicializarFormularioClientePromo() {
    if (!formCadastroPromo) return;

    formCadastroPromo.addEventListener('submit', function(evento) {
      evento.preventDefault();
      enviarSorteioPromo();
    });

    if (inputPromoNome) {
      ['input', 'change'].forEach(function(evt) {
        inputPromoNome.addEventListener(evt, atualizarFluxoCadastroPromo);
      });
    }

    if (inputPromoData) {
      ['input', 'change'].forEach(function(evt) {
        inputPromoData.addEventListener(evt, function() {
          mascaraDataPromo(inputPromoData);
          atualizarFluxoCadastroPromo();
        });
      });
    }

    if (inputPromoCelular) {
      ['input', 'change'].forEach(function(evt) {
        inputPromoCelular.addEventListener(evt, function() {
          mascaraTelPromo(inputPromoCelular);
          atualizarFluxoCadastroPromo();
        });
      });
    }

    if (btnEnviarPromo) btnEnviarPromo.addEventListener('click', enviarSorteioPromo);
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

        // Data de encerramento para o contador
        if (pr.dataFim) {
          try {
            var novaData = new Date(pr.dataFim);
            if (!isNaN(novaData.getTime())) dataAlvo = novaData;
          } catch(e) {}
        }

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

  // ═══ VERIFICAR ENCERRAMENTO DA LISTA DE INSCRIÇÕES ═══
  // Fidelidade.json foi removido. O encerramento do sorteio é controlado via
  // dados/promo.json (campo dataFim). Se dataFim for anterior a hoje,
  // o contador exibe "SORTEIO EM ANDAMENTO" e o formulário continua habilitado.
  // Para encerrar manualmente: setar window._sorteioEncerrado = true no painel admin.
  (function verificarEncerramentoSorteio() {
    // Verificar encerramento via dados/promo.json (dataFim)
    fetch('dados/promo.json?t=' + Date.now())
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; })
      .then(function(pr) {
        if (!pr || !pr.dataFim) return;
        var hoje = new Date();
        var fim = new Date(pr.dataFim);
        if (isNaN(fim.getTime()) || hoje < fim) return;

        window._sorteioEncerrado = true;

        // Oculta formulário e botões de inscrição
        var formInline = document.getElementById('form-sorteio-inline');
        if (formInline) formInline.style.display = 'none';

        var btnAceitar = document.getElementById('btn-aceitar-sorteio-inline');
        if (btnAceitar) { btnAceitar.disabled = true; btnAceitar.setAttribute('aria-disabled', 'true'); }

        var btnParticip = document.getElementById('btn-quero-participar-sorteio');
        if (btnParticip) {
          btnParticip.textContent = '🔒 Inscrições encerradas';
          btnParticip.style.background = '#757575';
          btnParticip.style.cursor = 'default';
          btnParticip.onclick = null;
        }

        // Exibe aviso de encerramento dentro do bloco de regras
        var blocoRegras = document.getElementById('bloco-regras-sorteio-promo');
        if (blocoRegras) {
          var aviso = document.createElement('div');
          aviso.style.cssText = 'background:#fff3e0;border:2px solid #e65100;border-radius:10px;padding:12px 16px;margin:10px 0;font-weight:700;color:#bf360c;text-align:center';
          aviso.textContent = '🔒 As inscrições foram encerradas em 02/01/2027. Os participantes cadastrados continuam concorrendo até o último sorteio.';
          blocoRegras.insertBefore(aviso, blocoRegras.firstChild);
        }

        // Atualiza o contador para não mostrar próximo sorteio
        var cdRow = document.getElementById('cd-row');
        var cdEncerrado = document.getElementById('cd-encerrado');
        if (cdRow) cdRow.style.display = 'none';
        if (cdEncerrado) { cdEncerrado.style.display = 'block'; cdEncerrado.textContent = '🔒 INSCRIÇÕES ENCERRADAS'; }
      });
  })();
