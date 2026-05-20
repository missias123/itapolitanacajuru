/* Clube de Fidelidade — fluxo simplificado */
(function() {
  'use strict';

  // fidelidade.json (códigos) permanece no GitHub — sem PII
  // Clientes e autenticação passam pelo Worker seguro
  var ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';
  var WPP_NUM = '5516996062046';
  var META_10 = 15;
  var META_30 = 30;
  var REGEX_CODIGO = /^[A-Z0-9!@#$%^&*?+\-]{10}$/;
  // DDD com 2 dígitos válidos (11-99) + nono dígito 9 + mais 8 números = 11 dígitos.
  var BRAZILIAN_MOBILE_REGEX = /^(1[1-9]|[2-9]\d)9\d{8}$/;

  var secaoCadastro = document.getElementById('secao-cadastro-fid');
  var secaoLogin = document.getElementById('secao-login-fid');
  var secaoPainel = document.getElementById('secao-painel-fid');

  var btnMostrarCadastro = document.getElementById('btn-mostrar-cadastro-fid');
  var btnMostrarLogin = document.getElementById('btn-mostrar-login-fid');
  var btnIrCadastro = document.getElementById('btn-ir-cadastro-fidelidade');
  var etapaCadastroRegras = document.getElementById('cadastro-etapa-regras-fid');
  var etapaCadastroForm = document.getElementById('cadastro-etapa-form-fid');
  var btnAceitarRegras = document.getElementById('btn-aceitar-regras-fid');

  var inputCadNome = document.getElementById('fid-nome');
  var inputCadNasc = document.getElementById('fid-data-nasc');
  var inputCadTel = document.getElementById('fid-celular');
  var btnCadastrar = document.getElementById('fid-executar-cadastro');
  var resultadoCadastroNovo = document.getElementById('fid-feedback-message');
  var resultadoCadastro = resultadoCadastroNovo || document.getElementById('resultado-cliente');
  if (!resultadoCadastroNovo && resultadoCadastro) {
    console.warn('[fidelidade] Usando fallback de feedback legado (#resultado-cliente).');
  }

  var inputNome = document.getElementById('fid-login-nome');
  var inputNasc = document.getElementById('fid-login-data-nasc');
  var inputTel = document.getElementById('fid-login-celular');
  var btnEntrar = document.getElementById('btn-entrar');
  var resultado = document.getElementById('resultado-consulta');
  var resultadoCodigo = document.getElementById('fid-codigo-feedback');

  var painelBoasVindas = document.getElementById('painel-boas-vindas');
  var painelPontos = document.getElementById('painel-pontos');
  var painelResgate = document.getElementById('painel-resgate');
  var formCodigoWrap = document.getElementById('form-codigo-wrap');
  var inputCodigoSecreto = document.getElementById('codigo_secreto');
  var blocoLote = document.getElementById('bloco-lote');
  var inputLoteCupom = document.getElementById('lote_cupom');
  var msgStatusCupom = document.getElementById('msg-status');
  var btnRegistrar = document.getElementById('btn-registrar-ponto');
  var btnWppResgatar = document.getElementById('btn-wpp-resgatar-consulta');

  var _clienteAtual = null;
  var _clienteAtualId = null;
  var _cadastroRegrasAceitas = false;
  var _cupomVerificadoAtual = null;

  function mascaraTel(v) {
    var d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function setResultado(msg, tipo) {
    if (!resultado) return;
    resultado.textContent = msg;
    resultado.className = 'resultado' + (tipo ? ' ' + tipo : '');
  }

  /* Feedback visível no painel (abaixo do input de código), não na seção de login */
  var FEEDBACK_COLORS = { ok: '#1b5e20', erro: '#b71c1c', aviso: '#e65100' };
  var FEEDBACK_BACKGROUNDS = { ok: '#e8f5e9', erro: '#ffebee', aviso: '#fff3e0' };
  function setResultadoCodigo(msg, tipo) {
    if (!resultadoCodigo) { setResultado(msg, tipo); return; } // fallback se elemento não existir
    if (!msg) { resultadoCodigo.style.display = 'none'; resultadoCodigo.textContent = ''; return; }
    resultadoCodigo.textContent = msg;
    resultadoCodigo.style.display = 'block';
    resultadoCodigo.style.color = FEEDBACK_COLORS[tipo] || '#333';
    resultadoCodigo.style.background = FEEDBACK_BACKGROUNDS[tipo] || '#f5f5f5';
    resultadoCodigo.style.border = '1.5px solid ' + (FEEDBACK_COLORS[tipo] || '#ccc');
    // Scroll suave para que o usuário veja o feedback
    resultadoCodigo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setResultadoCadastro(msg, tipo) {
    if (!resultadoCadastro) return;
    resultadoCadastro.style.display = msg ? 'block' : 'none';
    resultadoCadastro.textContent = msg || '';
    resultadoCadastro.className = 'resultado' + (tipo ? ' ' + tipo : '');
  }

  function encaminharCadastroWhatsApp(nome, dataBr, telRaw) {
    var telefoneFormatado = mascaraTel(telRaw);
    var msg = [
      'Olá! Solicitação de cadastro no Clube de Fidelidade.',
      'Nome: ' + nome,
      'Nascimento: ' + dataBr,
      'WhatsApp: ' + telefoneFormatado
    ].join('\n');
    setResultadoCadastro('✅ Seu pedido de cadastro foi enviado para nosso WhatsApp!', 'ok');
    try {
      window.open(wppLink(msg), '_blank', 'noopener,noreferrer');
    } catch (e) {
      setResultadoCadastro('✅ Seu pedido de cadastro foi enviado para nosso WhatsApp! Se a aba não abriu, tente novamente.', 'ok');
    }
    resetarFormularioCadastro();
  }

  function cadastroNomeValido() {
    var nome = (inputCadNome && inputCadNome.value ? inputCadNome.value : '').trim();
    return nome.length >= 3;
  }

  function cadastroDataValida() {
    var dataBr = (inputCadNasc && inputCadNasc.value ? inputCadNasc.value : '').trim();
    return !!parseDataBrToIso(dataBr);
  }

  function cadastroCelularValido() {
    var telRaw = (inputCadTel && inputCadTel.value ? inputCadTel.value : '').replace(/\D/g, '');
    return BRAZILIAN_MOBILE_REGEX.test(telRaw);
  }

  function cadastroCamposValidos() {
    return cadastroNomeValido() && cadastroDataValida() && cadastroCelularValido();
  }

  function setCampoCadastroHabilitado(campo, habilitado) {
    if (!campo) return;
    campo.disabled = !habilitado;
    campo.classList.toggle('form-control-disabled', !habilitado);
  }

  function atualizarFluxoCadastro() {
    var nomeValido = cadastroNomeValido();
    var dataValida = cadastroDataValida();
    var podeEditarNome = _cadastroRegrasAceitas;
    var podeEditarData = podeEditarNome && nomeValido;
    var podeEditarCel = podeEditarData && dataValida;

    setCampoCadastroHabilitado(inputCadNome, podeEditarNome);
    setCampoCadastroHabilitado(inputCadNasc, podeEditarData);
    setCampoCadastroHabilitado(inputCadTel, podeEditarCel);

    if (!btnCadastrar) return;
    btnCadastrar.disabled = !(_cadastroRegrasAceitas && cadastroCamposValidos());
  }

  function resetarFormularioCadastro() {
    _cadastroRegrasAceitas = false;
    if (inputCadNome) inputCadNome.value = '';
    if (inputCadNasc) inputCadNasc.value = '';
    if (inputCadTel) inputCadTel.value = '';
    if (btnAceitarRegras) {
      btnAceitarRegras.classList.remove('aceito');
      btnAceitarRegras.disabled = false;
      btnAceitarRegras.textContent = 'Li e aceito as regras do Clube de Fidelidade';
    }
    if (etapaCadastroRegras) etapaCadastroRegras.style.display = 'block';
    if (etapaCadastroForm) etapaCadastroForm.style.display = 'none';
    if (btnCadastrar) {
      btnCadastrar.disabled = true;
      btnCadastrar.textContent = 'Executar cadastro';
    }
    atualizarFluxoCadastro();
  }

  function parseDataBrToIso(dataBr) {
    var v = String(dataBr || '').trim();
    var m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;

    var dia = parseInt(m[1], 10);
    var mes = parseInt(m[2], 10);
    var ano = parseInt(m[3], 10);
    if (ano < 1900 || ano > new Date().getFullYear()) return null;
    if (mes < 1 || mes > 12) return null;
    if (dia < 1 || dia > 31) return null;

    var d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== (mes - 1) || d.getDate() !== dia) return null;

    return String(ano) + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
  }

  // ── Worker API helpers ──────────────────────────────────────────────────────

  /** Cadastra novo cliente no Worker (substitui gravação direta em clientes.json) */
  function cadastrarClienteWorker(nome, dataNasc, cel) {
    return fetch(ITAP_WORKER_API + '/api/clientes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: nome, dataNasc: dataNasc, cel: cel })
    }).then(function(r) { return r.json(); });
  }

  /** Login do cliente pelo Worker (substitui leitura pública de clientes.json) */
  function loginClienteWorker(nome, dataNasc, cel) {
    return fetch(ITAP_WORKER_API + '/api/clientes/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: nome, dataNasc: dataNasc, cel: cel })
    }).then(function(r) { return r.json(); });
  }


  /** Verifica código secreto e disponibilidade para cadastro */
  function verificarCodigoCupomWorker(codigoSecreto) {
    return fetch(ITAP_WORKER_API + '/api/fidelidade/verificar-codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_secreto: codigoSecreto })
    }).then(function(r) { return r.json(); });
  }

  /** Cadastra cupom por codigo_secreto+lote para cliente autenticado */
  function cadastrarCupomWorker(clienteId, idHash, codigoSecreto, lote) {
    return fetch(ITAP_WORKER_API + '/api/fidelidade/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: clienteId,
        idHash: idHash,
        codigo_secreto: codigoSecreto,
        lote: lote
      })
    }).then(function(r) { return r.json(); });
  }

  function wppLink(texto) {
    return 'https://wa.me/' + WPP_NUM + '?text=' + encodeURIComponent(texto);
  }

  function mostrarWppBtn(href, texto) {
    if (!btnWppResgatar) return;
    btnWppResgatar.href = href;
    btnWppResgatar.textContent = texto;
    btnWppResgatar.style.display = 'block';
  }

  function esconderWppBtn() {
    if (btnWppResgatar) btnWppResgatar.style.display = 'none';
  }

  function renderPainelResgate(pts, nomeCompleto, tel) {
    if (!painelResgate) return;

    if (pts === null || pts === undefined) {
      painelResgate.style.display = 'none';
      painelResgate.innerHTML = '';
      return;
    }

    var nomeExib = nomeCompleto || 'Cliente';
    var telFormatado = mascaraTel(tel);
    var html = '<div class="resgate-wrap">';

    if (pts >= META_10) {
      html += '<div class="resgate-btns">';

      var msgMilk = 'Olá, sou ' + nomeExib + ', meu celular é ' + telFormatado + '.\n' +
        'Gostaria de resgatar 15 pontos do programa de fidelidade Itapolitana e ganhar um Milk Shake de 300 ml.\n' +
        'Posso agendar para retirar em [DIA] às [HORA]?';
      html += '<a class="btn btn-wpp btn-block" href="' + wppLink(msgMilk) + '" target="_blank" rel="noopener" style="display:block;">' +
        'Resgatar 15 pontos – Milk Shake 300 ml</a>';

      if (pts >= META_30) {
        var msgCaixa = 'Olá, sou ' + nomeExib + ', meu celular é ' + telFormatado + '.\n' +
          'Gostaria de resgatar 30 pontos do programa de fidelidade Itapolitana e ganhar uma caixa de sorvete com 7 bolas.\n' +
          'Posso agendar para retirar em [DIA] às [HORA]?';
        html += '<a class="btn btn-primary btn-block" href="' + wppLink(msgCaixa) + '" target="_blank" rel="noopener" style="display:block;">' +
          'Resgatar 30 pontos – Caixa 7 bolas</a>';
      }

      html += '</div>';
      html += '<p class="resgate-aviso">Ao clicar em "Resgatar", vamos abrir uma conversa no WhatsApp da Itapolitana para combinar retirada.</p>';
    }

    html += '</div>';
    painelResgate.innerHTML = html;
    painelResgate.style.display = 'block';
  }

  function mostrarSecaoCadastro() {
    if (secaoCadastro) secaoCadastro.style.display = 'block';
    if (secaoLogin) secaoLogin.style.display = 'none';
    if (secaoPainel) secaoPainel.style.display = 'none';
    resetarFormularioCadastro();
    setResultadoCadastro('', '');
    if (secaoCadastro) secaoCadastro.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function mostrarSecaoLogin() {
    if (secaoLogin) secaoLogin.style.display = 'block';
    if (secaoCadastro) secaoCadastro.style.display = 'none';
    if (secaoPainel) secaoPainel.style.display = 'none';
    if (formCodigoWrap) formCodigoWrap.style.display = 'none';
    if (btnIrCadastro) btnIrCadastro.style.display = 'none';
    if (secaoLogin) secaoLogin.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function mostrarPainelCliente(cliente) {
    if (!cliente) return;

    var nome = cliente.nome || 'Cliente';
    var pts = Number(cliente.saldoPontos || 0);

    if (painelBoasVindas) painelBoasVindas.textContent = 'Bem-vindo(a), ' + nome + '!';
    if (painelPontos) painelPontos.textContent = 'Você tem ' + pts + ' pontos acumulados.';

    // Ocultar seção de login para limpar a tela — usuário já está autenticado
    if (secaoLogin) secaoLogin.style.display = 'none';
    if (secaoPainel) secaoPainel.style.display = 'block';
    if (formCodigoWrap) formCodigoWrap.style.display = 'grid';
    // Limpar feedback anterior de código
    setResultadoCodigo('', '');

    renderPainelResgate(pts, nome, cliente.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : ''));
  }

  function resetarPainel() {
    _clienteAtual = null;
    _clienteAtualId = null;
    if (secaoPainel) secaoPainel.style.display = 'none';
    if (formCodigoWrap) formCodigoWrap.style.display = 'none';
    if (btnIrCadastro) btnIrCadastro.style.display = 'none';
    renderPainelResgate(null);
    esconderWppBtn();
  }

  function formatarDataInputBr(raw) {
    var nums = String(raw || '').replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 2) return nums;
    if (nums.length <= 4) return nums.slice(0, 2) + '/' + nums.slice(2);
    return nums.slice(0, 2) + '/' + nums.slice(2, 4) + '/' + nums.slice(4);
  }

  if (inputCadTel) {
    inputCadTel.addEventListener('input', function() {
      inputCadTel.value = mascaraTel(inputCadTel.value);
    });
  }

  if (inputTel) {
    inputTel.addEventListener('input', function() {
      inputTel.value = mascaraTel(inputTel.value);
    });
  }

  if (inputCadNasc) {
    inputCadNasc.addEventListener('input', function() {
      inputCadNasc.value = formatarDataInputBr(inputCadNasc.value);
    });
  }

  if (inputNasc) {
    inputNasc.addEventListener('input', function() {
      inputNasc.value = formatarDataInputBr(inputNasc.value);
    });
  }

  if (inputCodigoSecreto) {
    inputCodigoSecreto.addEventListener('input', function() {
      inputCodigoSecreto.value = inputCodigoSecreto.value.toUpperCase();
    });
  }

  if (btnMostrarCadastro) btnMostrarCadastro.addEventListener('click', mostrarSecaoCadastro);
  if (btnMostrarLogin) btnMostrarLogin.addEventListener('click', mostrarSecaoLogin);
  if (btnIrCadastro) btnIrCadastro.addEventListener('click', mostrarSecaoCadastro);
  if (btnAceitarRegras) {
    btnAceitarRegras.addEventListener('click', function() {
      _cadastroRegrasAceitas = true;
      if (etapaCadastroForm) etapaCadastroForm.style.display = 'grid';
      btnAceitarRegras.classList.add('aceito');
      btnAceitarRegras.textContent = 'Regras aceitas ✓';
      atualizarFluxoCadastro();
      if (inputCadNome) inputCadNome.focus();
    });
  }
  if (inputCadNome) {
    inputCadNome.addEventListener('input', atualizarFluxoCadastro);
    inputCadNome.addEventListener('change', atualizarFluxoCadastro);
  }
  if (inputCadNasc) {
    inputCadNasc.addEventListener('input', atualizarFluxoCadastro);
    inputCadNasc.addEventListener('change', atualizarFluxoCadastro);
  }
  if (inputCadTel) {
    inputCadTel.addEventListener('input', atualizarFluxoCadastro);
    inputCadTel.addEventListener('change', atualizarFluxoCadastro);
  }

  if (btnCadastrar) {
    btnCadastrar.addEventListener('click', function() {
      var nome = (inputCadNome && inputCadNome.value ? inputCadNome.value : '').trim();
      var dataBr = (inputCadNasc && inputCadNasc.value ? inputCadNasc.value : '').trim();
      var telRaw = (inputCadTel && inputCadTel.value ? inputCadTel.value : '').replace(/\D/g, '');
      var dataIso = parseDataBrToIso(dataBr);

      if (!_cadastroRegrasAceitas) {
        setResultadoCadastro('⚠️ Você precisa aceitar as regras do programa para se cadastrar.', 'erro');
        return;
      }
      if (!cadastroNomeValido()) {
        setResultadoCadastro('⚠️ Informe seu nome completo com pelo menos 3 caracteres.', 'erro');
        return;
      }
      if (!dataIso) {
        setResultadoCadastro('⚠️ Informe uma data válida no formato dd/mm/aaaa.', 'erro');
        return;
      }
      if (!cadastroCelularValido()) {
        setResultadoCadastro('⚠️ Informe um WhatsApp válido com DDD e 11 dígitos numéricos.', 'erro');
        return;
      }

      btnCadastrar.disabled = true;
      btnCadastrar.textContent = 'Cadastrando...';
      setResultadoCadastro('Aguarde, registrando seu cadastro...', '');

      cadastrarClienteWorker(nome, dataIso, telRaw)
        .then(function(res) {
          if (!res.ok) throw new Error(res.error || 'Falha no servidor');
          setResultadoCadastro("Cadastro feito com sucesso! Agora use a opção 'Já sou cadastrado / Digitar código' para registrar seus pontos.", 'ok');
          if (inputNome) inputNome.value = nome;
          if (inputNasc) inputNasc.value = dataBr;
          if (inputTel) inputTel.value = mascaraTel(telRaw);
          resetarFormularioCadastro();
        })
        .catch(function(e) {
          console.warn('[fidelidade] Falha no Worker; redirecionando para WhatsApp.', e);
          encaminharCadastroWhatsApp(nome, dataBr, telRaw);
        })
        .finally(function() {
          btnCadastrar.textContent = 'Executar cadastro';
          atualizarFluxoCadastro();
        });
    });
  }

  atualizarFluxoCadastro();

  if (btnEntrar) {
    btnEntrar.addEventListener('click', function() {
      var nomeLogin = (inputNome && inputNome.value ? inputNome.value : '').trim();
      var nascBr = (inputNasc && inputNasc.value ? inputNasc.value : '').trim();
      var nascIso = parseDataBrToIso(nascBr);
      var tel = (inputTel && inputTel.value ? inputTel.value : '').replace(/\D/g, '');

      resetarPainel();

      if (!nomeLogin || nomeLogin.length < 3) {
        setResultado('Informe seu nome completo para entrar na fidelidade.', 'erro');
        return;
      }
      if (!nascIso) {
        setResultado('Informe uma data válida no formato dd/mm/aaaa.', 'erro');
        return;
      }
      if (!tel || tel.length < 10) {
        setResultado('Digite seu celular com DDD para continuar.', 'erro');
        return;
      }

      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando...';
      if (btnIrCadastro) btnIrCadastro.style.display = 'none';

      loginClienteWorker(nomeLogin, nascIso, tel)
        .then(function(res) {
          if (!res.found) {
            setResultado('Não encontramos cadastro com estes dados. Por favor, use o botão "Quero participar do Clube de Fidelidade".', 'erro');
            if (btnIrCadastro) btnIrCadastro.style.display = 'block';
            return;
          }
          var clienteId = res.clienteId;
          var cliente = res.cliente;
          _clienteAtual = cliente;
          _clienteAtualId = clienteId;
          if (_clienteAtual.bloqueado) {
            setResultado('⚠️ Conta com restrição. Fale conosco pelo WhatsApp para regularizar.', 'erro');
            mostrarWppBtn(wppLink('Olá! Minha conta no Clube Fidelidade está bloqueada. Cel: ' + tel), '💬 Falar com atendente');
            return;
          }
          setResultado('Login realizado com sucesso. Agora você pode registrar seus códigos.', 'ok');
          esconderWppBtn();
          mostrarPainelCliente(_clienteAtual);
        })
        .catch(function() {
          setResultado('Não foi possível consultar agora. Verifique sua conexão ou fale via WhatsApp.', 'erro');
          mostrarWppBtn(wppLink('Olá! Preciso consultar meus pontos no Clube de Fidelidade.'), '💬 Consultar pontos via WhatsApp');
        })
        .finally(function() {
          btnEntrar.disabled = false;
          btnEntrar.textContent = 'Entrar na minha fidelidade';
        });
    });
  }

  var TENT_COD_PREFIX = 'itap_tent_cod_';
  var MAX_TENT_CODIGO = 3;

  function getTentativasCodigo() {
    var tel = (_clienteAtual && _clienteAtual.cel) || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
    if (!tel) return 0;
    return parseInt(localStorage.getItem(TENT_COD_PREFIX + tel) || '0', 10);
  }

  function resetarTentativasCodigo() {
    var tel = (_clienteAtual && _clienteAtual.cel) || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
    if (tel) localStorage.removeItem(TENT_COD_PREFIX + tel);
  }

  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  function limparEstadoCupomNumero() {
    _cupomVerificadoAtual = null;
    if (blocoLote) {
      blocoLote.style.display = 'none';
    }
    if (msgStatusCupom) {
      msgStatusCupom.textContent = '';
      msgStatusCupom.style.color = '';
    }
    if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '';
    if (inputLoteCupom) inputLoteCupom.value = '';
  }

  if (inputCodigoSecreto) {
    inputCodigoSecreto.addEventListener('input', debounce(function() {
      var valor = (this.value || '').trim().toUpperCase();
      this.value = valor;
      limparEstadoCupomNumero();
      if (!REGEX_CODIGO.test(valor)) {
        if (valor.length >= 10 && msgStatusCupom) {
          this.style.borderColor = '#dc3545';
          msgStatusCupom.textContent = '❌ Código não encontrado';
          msgStatusCupom.style.color = '#dc3545';
        }
        return;
      }
      if (msgStatusCupom) {
        msgStatusCupom.textContent = '⏳ Verificando código do cupom...';
        msgStatusCupom.style.color = '#333';
      }
      verificarCodigoCupomWorker(valor)
        .then(function(data) {
          if (!data || data.ok === false) {
            if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '#dc3545';
            if (msgStatusCupom) {
              msgStatusCupom.textContent = '❌ Código não encontrado';
              msgStatusCupom.style.color = '#dc3545';
            }
            return;
          }
          if (data.encontrado && data.disponivel) {
            _cupomVerificadoAtual = {
              codigo_secreto: valor
            };
            if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '#28a745';
            if (msgStatusCupom) {
              msgStatusCupom.textContent = '✅ Cupom encontrado! Informe o número do lote:';
              msgStatusCupom.style.color = '#28a745';
            }
            if (blocoLote) {
              blocoLote.style.display = 'block';
              blocoLote.style.animation = 'fadeIn 0.3s ease';
            }
            if (inputLoteCupom) inputLoteCupom.focus();
          } else if (data.encontrado && !data.disponivel) {
            if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '#ffc107';
            if (msgStatusCupom) {
              msgStatusCupom.textContent = '⚠️ Este cupom já foi utilizado';
              msgStatusCupom.style.color = '#856404';
            }
          } else {
            if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '#dc3545';
            if (msgStatusCupom) {
              msgStatusCupom.textContent = '❌ Código não encontrado';
              msgStatusCupom.style.color = '#dc3545';
            }
          }
        })
        .catch(function() {
          if (inputCodigoSecreto) inputCodigoSecreto.style.borderColor = '#dc3545';
          if (msgStatusCupom) {
            msgStatusCupom.textContent = '⚠️ Não foi possível verificar o código agora. Tente novamente.';
            msgStatusCupom.style.color = '#dc3545';
          }
        });
    }, 600));
  }

  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', function() {
      if (!_clienteAtual) {
        setResultadoCodigo('Antes de registrar código, faça login em "Já sou cadastrado / Digitar código".', 'erro');
        if (formCodigoWrap) formCodigoWrap.style.display = 'none';
        return;
      }

      var codigoSecreto = (inputCodigoSecreto && inputCodigoSecreto.value ? inputCodigoSecreto.value : '').trim().toUpperCase();
      var numeroLote = Number(inputLoteCupom && inputLoteCupom.value ? inputLoteCupom.value : 0);
      if (!codigoSecreto) {
        setResultadoCodigo('Digite o código secreto do cupom.', 'erro');
        return;
      }
      if (!REGEX_CODIGO.test(codigoSecreto)) {
        setResultadoCodigo('Código inválido.', 'erro');
        return;
      }
      if (!_cupomVerificadoAtual || _cupomVerificadoAtual.codigo_secreto !== codigoSecreto) {
        setResultadoCodigo('Verifique o código do cupom antes de cadastrar.', 'erro');
        return;
      }
      if (!Number.isFinite(numeroLote) || numeroLote <= 0) {
        setResultadoCodigo('Informe o número do lote para continuar.', 'erro');
        return;
      }

      if (_clienteAtual.bloqueado || getTentativasCodigo() > MAX_TENT_CODIGO) {
        setResultadoCodigo('⛔ Conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
        mostrarWppBtn(wppLink('Minha conta no Clube Fidelidade está bloqueada. WhatsApp: ' + (_clienteAtual.cel || '')), '💬 Solicitar desbloqueio');
        if (formCodigoWrap) formCodigoWrap.style.display = 'none';
        return;
      }

      btnRegistrar.disabled = true;
      btnRegistrar.textContent = 'Cadastrando...';

      resetarTentativasCodigo();
      var clienteId = _clienteAtualId;
      var idHash = (_clienteAtual && _clienteAtual.id_hash) || '';
      if (!clienteId || !idHash) {
        setResultadoCodigo('⚠️ Sessão expirada. Faça login novamente.', 'erro');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Cadastrar cupom';
        return;
      }

      setResultadoCodigo('⏳ Validando cupom e lote...', 'aviso');

      cadastrarCupomWorker(clienteId, idHash, codigoSecreto, numeroLote)
        .then(function(res) {
          if (!res || !res.ok) {
            if (res && res.tipo === 'lote_incorreto') {
              setResultadoCodigo('❌ Código ou número de lote incorreto.', 'erro');
            } else if (res && res.tipo === 'ja_cadastrado') {
              setResultadoCodigo('⚠️ Este cupom já foi utilizado.', 'aviso');
            } else if (res && res.tipo === 'cupom_nao_encontrado') {
              setResultadoCodigo('❌ Código não encontrado.', 'erro');
            } else if (res && res.tipo === 'bloqueado') {
              setResultadoCodigo('⚠️ Conta bloqueada. Fale conosco para regularizar.', 'erro');
            } else {
              setResultadoCodigo('⚠️ Não foi possível cadastrar o cupom agora. Tente novamente.', 'erro');
            }
            return;
          }

          setResultadoCodigo(res.mensagem || res.message || '🎉 Cupom cadastrado com sucesso!', 'ok');
          if (inputLoteCupom) inputLoteCupom.value = '';
          _cupomVerificadoAtual = null;
          if (blocoLote) {
            blocoLote.style.display = 'none';
          }
          if (inputCodigoSecreto) {
            inputCodigoSecreto.value = '';
            inputCodigoSecreto.style.borderColor = '';
          }
          if (msgStatusCupom) {
            msgStatusCupom.textContent = '';
            msgStatusCupom.style.color = '';
          }
        })
        .catch(function(err) {
          console.error('[fidelidade] erro ao cadastrar cupom via Worker', err);
          setResultadoCodigo('⚠️ Não foi possível concluir o cadastro agora. Tente novamente em instantes.', 'erro');
        })
        .finally(function() {
          btnRegistrar.disabled = false;
          btnRegistrar.textContent = 'Cadastrar cupom';
        });
    });
  }
})();
