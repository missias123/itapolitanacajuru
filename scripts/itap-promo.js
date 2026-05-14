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
  var WHATS_SORVETERIA = '5516996062046';
  var PROMO_MOBILE_REGEX = /^(1[1-9]|[2-9]\d)9\d{8}$/;
  var formCadastroPromo = document.getElementById('form-promocao-cliente');
  var inputPromoNome = document.getElementById('promo-nome-cliente');
  var inputPromoData = document.getElementById('promo-data-nasc-cliente');
  var inputPromoCelular = document.getElementById('promo-celular-cliente');
  var inputPromoHp = document.getElementById('promo-honeypot');
  var btnEnviarPromo = document.getElementById('promo-enviar-whatsapp');
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
      btnEnviarPromo.textContent = '💬 Enviar Cadastro via WhatsApp';
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

  function montarMensagemWhatsappPromo(idUnico, numeroInscricao, nome, celFmt, dataNasc) {
    return [
      '🍦 *SORTEIO MENSAL — Sorveteria Itapolitana Cajuru*',
      '',
      '*ID Permanente:* ' + idUnico,
      '*Número de Inscrição:* #' + numeroInscricao,
      '*Nome:* ' + nome,
      '*Celular:* ' + celFmt,
      '*Data de nascimento:* ' + dataNasc,
      '',
      '⚠️ *ATENÇÃO IMPORTANTE:*',
      'Os dados informados acima devem ser *idênticos* aos do seu documento oficial com foto (RG ou CNH).',
      '',
      '🚫 *O PRÊMIO NÃO SERÁ ENTREGUE* se o nome ou a data de nascimento do documento divergirem do cadastro.',
      '',
      'Para retirar o prêmio, apresente *pessoalmente*:',
      '📄 Documento oficial com foto (RG ou CNH) — original',
      '📲 Celular cadastrado com WhatsApp ativo',
      '',
      'Estou ciente das regras e concordo com o regulamento do sorteio. 🎉'
    ].join('\n');
  }

  function montarMensagemWhatsappFallbackPromo(nome, celFmt, dataNasc) {
    return [
      'Olá! Quero participar do Sorteio Mensal da Sorveteria Itapolitana Cajuru.',
      'Nome: ' + nome,
      'Data de nascimento: ' + dataNasc,
      'Celular: ' + celFmt,
      '',
      'Estou ciente das regras de retirada do prêmio e aguardo a confirmação do meu cadastro.'
    ].join('\n');
  }

  function abrirWhatsAppPromo(msg) {
    try {
      window.open('https://wa.me/' + WHATS_SORVETERIA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
      return true;
    } catch (e) {
      return false;
    }
  }

  function finalizarCadastroPromo(msgFeedback, msgWhatsapp) {
    exibirRegrasRetiradaPromo();
    var abriuWhats = abrirWhatsAppPromo(msgWhatsapp);
    mostrarMsgSorteio(abriuWhats ? msgFeedback : msgFeedback + ' Se o WhatsApp não abriu, tente novamente.', 'ok');
    _promoLimparRate();
    resetarFormularioPromo({ manterFeedback: true, manterRegras: true });
  }

  // Token lido do localStorage (configurado pelo admin no painel)
  var _GH_TK_P = (function(){return localStorage.getItem('itap_gh_token')||'';})();
  var _GH_FID  = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/dados/fidelidade.json';
  var _GH_CLIENTES = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/dados/clientes.json';

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

  function normalizarNomePromo(nome) {
    return String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function gerarIdHashPromo() {
    if (window.crypto && window.crypto.getRandomValues) {
      var arr = new Uint8Array(4);
      window.crypto.getRandomValues(arr);
      return Array.from(arr).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase();
    }
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  async function enviarSorteioPromo() {
    if (!_promoCadastroLiberado) return;
    if (window._sorteioEncerrado) {
      mostrarMsgSorteio('⛔ As inscrições para o sorteio foram encerradas em 02/01/2027. Obrigado pela participação!', 'aviso');
      return;
    }
    if (inputPromoHp && inputPromoHp.value) {
      mostrarMsgSorteio('Erro de validacao. Tente novamente.', 'aviso');
      return;
    }

    var msgRate = _promoVerificarRate();
    if (msgRate) {
      mostrarMsgSorteio(msgRate, 'aviso');
      return;
    }

    var nome = (inputPromoNome && inputPromoNome.value ? inputPromoNome.value : '').replace(/[<>&"'/\\]/g, '').trim();
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
      btnEnviarPromo.textContent = '⏳ Verificando...';
    }
    mostrarMsgSorteio('⏳ Verificando cadastro, aguarde...', 'info');
    if (!_GH_TK_P) {
      finalizarCadastroPromo(
        '✅ Iniciamos o envio do seu cadastro via WhatsApp.',
        montarMensagemWhatsappFallbackPromo(nome, formatarCelularPromo(cel), dataNasc)
      );
      return;
    }
    try {
      var r = await fetch(_GH_FID + '?t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!r.ok) throw new Error('Erro ' + r.status);
      var d = await r.json();
      var sha = d.sha;
      var bin = atob(d.content.replace(/\n/g, ''));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var fid = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      var inscritos = fid.sorteioInscritos || [];
      var celLimpo = cel;
      var nomeNorm = normalizarNomePromo(nome);
      var celFmt = formatarCelularPromo(cel);

      var cResp = await fetch(_GH_CLIENTES + '?t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!cResp.ok) throw new Error('Erro ao consultar clientes: ' + cResp.status);
      var cApi = await cResp.json();
      var cSha = cApi.sha;
      var cBin = atob(cApi.content.replace(/\n/g, ''));
      var cBytes = new Uint8Array(cBin.length);
      for (var bi = 0; bi < cBin.length; bi++) cBytes[bi] = cBin.charCodeAt(bi);
      var cData = JSON.parse(new TextDecoder('utf-8').decode(cBytes));
      var clientesMap = cData.clientes || {};
      var idxCel = cData.indice_celular || {};
      var idUnico = null;
      var clienteNovoCriado = false;
      var celularClienteAtualizado = false;

      var idsClientes = Object.keys(clientesMap);
      for (var ci = 0; ci < idsClientes.length; ci++) {
        var cid = idsClientes[ci];
        var cli = clientesMap[cid] || {};
        var cliNomeOk = normalizarNomePromo(cli.nome || '') === nomeNorm;
        var cliNascOk = String(cli.dataNasc || '').trim() === dataNascIso;
        if (cliNomeOk && cliNascOk) {
          idUnico = cid;
          break;
        }
      }

      if (!idUnico) {
        var maxNum = 0;
        idsClientes.forEach(function(k) {
          var match = k.match(/USR-2026-(\d+)/);
          if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
        });
        idUnico = 'USR-2026-' + String(maxNum + 1).padStart(4, '0');
        var agoraIso = new Date().toISOString();
        clientesMap[idUnico] = {
          id_permanente: idUnico,
          id_hash: gerarIdHashPromo(),
          nome: nome,
          dataNasc: dataNascIso,
          cel: celLimpo,
          cel_anterior: [],
          cadastro: agoraIso,
          saldoPontos: 0,
          codigosUsados: [],
          resgates: [],
          totalPremios: 0,
          totalCodigos: 0,
          historico_alteracoes: [{ data: agoraIso, tipo: 'cadastro_promo', descricao: 'Cadastro originado na promoção', por: 'site' }],
          bloqueado: false,
          motivo_bloqueio: null,
          tentativas_fraude: 0,
          ultimo_acesso: agoraIso
        };
        clienteNovoCriado = true;
      } else {
        var cliExist = clientesMap[idUnico] || {};
        var celAtualCli = String(cliExist.cel || '').replace(/\D/g,'');
        if (celAtualCli !== celLimpo) {
          if (!Array.isArray(cliExist.cel_anterior)) cliExist.cel_anterior = [];
          if (celAtualCli && cliExist.cel_anterior.indexOf(celAtualCli) === -1) cliExist.cel_anterior.push(celAtualCli);
          cliExist.cel = celLimpo;
          if (!Array.isArray(cliExist.historico_alteracoes)) cliExist.historico_alteracoes = [];
          cliExist.historico_alteracoes.push({
            data: new Date().toISOString(),
            tipo: 'celular_atualizado_promo',
            descricao: 'Celular atualizado via cadastro da promoção',
            por: 'site'
          });
          clientesMap[idUnico] = cliExist;
          celularClienteAtualizado = true;
        }
      }

      Object.keys(idxCel).forEach(function(celKey) {
        if (idxCel[celKey] === idUnico && celKey !== celLimpo) delete idxCel[celKey];
      });
      idxCel[celLimpo] = idUnico;
      cData.clientes = clientesMap;
      cData.indice_celular = idxCel;

      var cNovoConteudo = btoa(unescape(encodeURIComponent(JSON.stringify(cData, null, 2))));
      var cSave = await fetch(_GH_CLIENTES, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Promo: sync cliente ' + nome, content: cNovoConteudo, sha: cSha })
      });
      if (!cSave.ok) throw new Error('Erro ao salvar clientes: ' + cSave.status);

      var jaInscritoNomeData = inscritos.find(function(c) {
        var nomeCadastrado = normalizarNomePromo(c.nome || '');
        return nomeCadastrado === nomeNorm && c.dataNasc === dataNasc;
      });
      if (jaInscritoNomeData) {
        var numExistenteNomeData = inscritos.indexOf(jaInscritoNomeData) + 1;
        var numeroExistente = String(numExistenteNomeData).padStart(3, '0');
        var celAtualInscricao = (jaInscritoNomeData.cel || '').replace(/\D/g, '');
        jaInscritoNomeData.id = idUnico;
        if (celAtualInscricao !== celLimpo) {
          jaInscritoNomeData.cel = celFmt;
          jaInscritoNomeData.hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          fid.sorteioInscritos = inscritos;
          var conteudoAtualizado = btoa(unescape(encodeURIComponent(JSON.stringify(fid, null, 2))));
          var updateResp = await fetch(_GH_FID, {
            method: 'PUT',
            headers: { 'Authorization': 'token ' + _GH_TK_P, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Atualizar celular sorteio: ' + nome, content: conteudoAtualizado, sha: sha })
          });
          if (!updateResp.ok) throw new Error('Erro ao atualizar inscrição existente: ' + updateResp.status);
          finalizarCadastroPromo(
            '✅ Cadastro encontrado! Atualizamos seu número de celular e registramos sua participação.',
            montarMensagemWhatsappPromo(idUnico, numeroExistente, nome, celFmt, dataNasc)
          );
        } else {
          finalizarCadastroPromo(
            '✅ Sua participação já estava registrada. Reabrimos a confirmação pelo WhatsApp.',
            montarMensagemWhatsappPromo(idUnico, numeroExistente, nome, celFmt, dataNasc)
          );
        }
        return;
      }

      var jaInscritoCel = inscritos.find(function(c) {
        return (c.cel || '').replace(/\D/g,'') === celLimpo;
      });
      if (jaInscritoCel) {
        var numExistente = inscritos.indexOf(jaInscritoCel) + 1;
        mostrarMsgSorteio('❌ Você já está cadastrado(a) neste sorteio com este celular! Número de inscrição: #' + String(numExistente).padStart(3,'0'), 'aviso');
        return;
      }

      inscritos.push({
        id: idUnico,
        nome: nome,
        cel: celFmt,
        dataNasc: dataNasc,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      fid.sorteioInscritos = inscritos;
      var numInscricao = inscritos.length;
      var novoConteudo = btoa(unescape(encodeURIComponent(JSON.stringify(fid, null, 2))));
      var resp = await fetch(_GH_FID, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Inscrito no sorteio: ' + nome, content: novoConteudo, sha: sha })
      });
      if (!resp.ok) throw new Error('Erro ao salvar: ' + resp.status);
      var numStr = String(numInscricao).padStart(3, '0');
      if (clienteNovoCriado) {
        finalizarCadastroPromo(
          '✅ Cadastro realizado e participação na promoção registrada com sucesso!',
          montarMensagemWhatsappPromo(idUnico, numStr, nome, celFmt, dataNasc)
        );
      } else if (celularClienteAtualizado) {
        finalizarCadastroPromo(
          '✅ Cadastro encontrado! Atualizamos seu número de celular e registramos sua participação.',
          montarMensagemWhatsappPromo(idUnico, numStr, nome, celFmt, dataNasc)
        );
      } else {
        finalizarCadastroPromo(
          '✅ Cadastro confirmado! Seu número é #' + numStr + '. Envie a mensagem no WhatsApp para finalizar!',
          montarMensagemWhatsappPromo(idUnico, numStr, nome, celFmt, dataNasc)
        );
      }
    } catch(e) {
      console.error('[Itap] Erro no cadastro:', e);
      finalizarCadastroPromo(
        '✅ Não foi possível concluir a etapa automática agora, mas iniciamos o envio via WhatsApp.',
        montarMensagemWhatsappFallbackPromo(nome, formatarCelularPromo(cel), dataNasc)
      );
    } finally {
      if (btnEnviarPromo) btnEnviarPromo.textContent = '💬 Enviar Cadastro via WhatsApp';
      atualizarFluxoCadastroPromo();
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
        var h1 = document.getElementById('promo-h1');
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

  // Sincronismo com config.json global (Admin -> config.json -> promocao.html)
  (function carregarConfigJson() {
    fetch('dados/config.json?v=' + Date.now())
      .then(function(r) { return r.json(); })
      .catch(function() { return null; })
      .then(function(cfg) {
        if (!cfg) return;
        // promo-h1 (ID: promo-h1 -> config: promoH1)
        var h1 = document.getElementById('promo-h1');
        if (h1 && cfg.promoH1) h1.textContent = cfg.promoH1;
        // promo-badge-el (ID: promo-badge-el -> config: promoBadge)
        var badge = document.getElementById('promo-badge-el');
        if (badge && cfg.promoBadge) badge.textContent = cfg.promoBadge;
        // promo-titulo-el (ID: promo-titulo-el -> config: promoTituloEl)
        var titulo = document.getElementById('promo-titulo-el');
        if (titulo && cfg.promoTituloEl) titulo.textContent = cfg.promoTituloEl;
        // promo-desc-el (ID: promo-desc-el -> config: promoDescEl)
        var desc = document.getElementById('promo-desc-el');
        if (desc && cfg.promoDescEl) desc.textContent = cfg.promoDescEl;
        // WhatsApp
        if (cfg.whatsapp) {
          document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
            try {
              var url = new URL(a.href);
              a.href = 'https://wa.me/' + cfg.whatsapp + (url.search || '');
            } catch(e) {}
          });
        }
      });
  })();

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
  // Lê sorteio.dataFim e sorteio.status de fidelidade.json.
  // Se hoje >= dataFim ou status === "encerrado", desabilita formulário e botão.
  (function verificarEncerramentoSorteio() {
    fetch('dados/fidelidade.json?v=' + Date.now())
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; })
      .then(function(fid) {
        if (!fid) return;
        var sorteio = fid.sorteio || {};
        var hoje = new Date();
        var encerrado = sorteio.status === 'encerrado';
        if (!encerrado && sorteio.dataFim) {
          var fim = new Date(sorteio.dataFim);
          encerrado = !isNaN(fim.getTime()) && hoje >= fim;
        }
        if (!encerrado) return;

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
