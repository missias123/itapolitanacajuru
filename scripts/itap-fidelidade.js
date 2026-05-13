/* Clube de Fidelidade — fluxo simplificado */
(function() {
  'use strict';

  var GH_RAW = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
  var GH_API = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';
  var WPP_NUM = '5516996062046';
  var META_10 = 10;
  var META_30 = 30;
  var STATUS_DISPONIVEL = 'disponível';
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
  var inputCodigo = document.getElementById('fid-codigo');
  var btnRegistrar = document.getElementById('btn-registrar-ponto');
  var btnWppResgatar = document.getElementById('btn-wpp-resgatar-consulta');

  var _clienteAtual = null;
  var _clienteAtualId = null;
  var _clientesMemoria = null;
  var _cadastroRegrasAceitas = false;

  function mascaraTel(v) {
    var d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function normalizarNome(nome) {
    return String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
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

  function getGhToken() {
    try {
      return localStorage.getItem('itap_gh_token') || '';
    } catch (e) {
      return '';
    }
  }

  function encodeJsonToB64(obj) {
    var enc = new TextEncoder().encode(JSON.stringify(obj, null, 2));
    var chunks = [];
    var CHUNK = 8192;
    for (var i = 0; i < enc.length; i += CHUNK) {
      chunks.push(String.fromCharCode.apply(null, enc.subarray(i, i + CHUNK)));
    }
    return btoa(chunks.join(''));
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

  function gerarIdHash() {
    var b = new Uint8Array(4);
    crypto.getRandomValues(b);
    return Array.from(b).map(function(x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }

  function localizarClientePorIdentidade(dados, nome, dataNascIso) {
    var clientes = (dados && dados.clientes) || {};
    var alvoNome = normalizarNome(nome);
    var alvoNasc = String(dataNascIso || '').trim();
    var ids = Object.keys(clientes);

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var c = clientes[id] || {};
      var nomeOk = normalizarNome(c.nome) === alvoNome;
      var nascOk = String(c.dataNasc || '').trim() === alvoNasc;
      if (nomeOk && nascOk) return { id: id, cliente: c };
    }

    return null;
  }

  function atualizarCelularEIndice(dados, clienteId, novoCel, origem) {
    var clientes = (dados && dados.clientes) || {};
    var idx = (dados && dados.indice_celular) || {};
    var cliente = clientes[clienteId];
    if (!cliente) return false;

    var celNovo = String(novoCel || '').replace(/\D/g, '');
    var celAtual = String(cliente.cel || '').replace(/\D/g, '');
    if (!celNovo) return false;

    Object.keys(idx).forEach(function(celKey) {
      if (idx[celKey] === clienteId && celKey !== celNovo) delete idx[celKey];
    });
    idx[celNovo] = clienteId;

    if (celNovo === celAtual) {
      dados.indice_celular = idx;
      return false;
    }

    if (!Array.isArray(cliente.cel_anterior)) cliente.cel_anterior = [];
    if (celAtual && cliente.cel_anterior.indexOf(celAtual) === -1) cliente.cel_anterior.push(celAtual);
    cliente.cel = celNovo;
    if (!Array.isArray(cliente.historico_alteracoes)) cliente.historico_alteracoes = [];
    cliente.historico_alteracoes.push({
      data: new Date().toISOString(),
      tipo: 'celular_atualizado',
      descricao: 'Celular atualizado para ' + celNovo,
      por: origem || 'site'
    });
    dados.indice_celular = idx;
    return true;
  }

  function ghRawFetch(path) {
    var apiUrl = GH_API + path;
    var tk = getGhToken();
    var opts = { cache: 'no-store' };
    if (tk) opts.headers = { Authorization: 'token ' + tk, Accept: 'application/vnd.github.v3+json' };

    return fetch(apiUrl, opts)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(ghResp) {
        if (!ghResp.content) throw new Error('conteudo ausente');
        var raw = new TextDecoder().decode(Uint8Array.from(atob(ghResp.content.replace(/\n/g, '')).split(''), function(c) {
          return c.charCodeAt(0);
        }));
        return JSON.parse(raw);
      })
      .catch(function() {
        return fetch(GH_RAW + path + '?t=' + Date.now(), { cache: 'no-store' })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          });
      });
  }

  function salvarClientesNoGitHub(dados, mensagemCommit) {
    return salvarJsonNoGitHub('dados/clientes.json', dados, mensagemCommit || 'Clube: atualizar clientes');
  }

  function salvarFidelidadeNoGitHub(dados, mensagemCommit) {
    return salvarJsonNoGitHub('dados/fidelidade.json', dados, mensagemCommit || 'Clube: atualizar fidelidade');
  }

  function salvarJsonNoGitHub(path, dados, mensagemCommit) {
    var tk = getGhToken();
    if (!tk) return Promise.resolve(false);

    return fetch(GH_API + path, {
      headers: { Authorization: 'token ' + tk, Accept: 'application/vnd.github.v3+json' }
    })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(meta) {
        var payload = {
          message: mensagemCommit || 'Clube: atualizar dados',
          content: encodeJsonToB64(dados),
          sha: meta.sha
        };
        return fetch(GH_API + path, {
          method: 'PUT',
          headers: { Authorization: 'token ' + tk, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      })
      .then(function(r2) {
        return r2.ok;
      })
      .catch(function() {
        return false;
      });
  }

  function salvarComRetry(salvarFn, tentativas) {
    var total = Math.max(1, Number(tentativas || 1));
    return salvarFn().then(function(ok) {
      if (ok || total <= 1) return ok;
      return salvarComRetry(salvarFn, total - 1);
    });
  }

  function obterMapaCodigos(fidelidade) {
    var fid = fidelidade && typeof fidelidade === 'object' ? fidelidade : {};
    var key = fid['códigos'] && typeof fid['códigos'] === 'object' ? 'códigos' : 'codigos';
    if (!fid[key] || typeof fid[key] !== 'object') fid[key] = {};
    return { key: key, map: fid[key] };
  }

  function atualizarClientesMemoria(dados) {
    var origem = dados || { clientes: {}, indice_celular: {} };
    if (typeof structuredClone === 'function') {
      _clientesMemoria = structuredClone(origem);
      return;
    }
    _clientesMemoria = JSON.parse(JSON.stringify(origem));
  }

  function obterClientesAtualizados() {
    return ghRawFetch('dados/clientes.json').then(function(dados) {
      if (!dados.clientes) dados.clientes = {};
      if (!dados.indice_celular) dados.indice_celular = {};
      atualizarClientesMemoria(dados);
      return dados;
    });
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
        'Gostaria de resgatar 10 pontos do programa de fidelidade Itapolitana e ganhar um Milk Shake de 300 ml.\n' +
        'Posso agendar para retirar em [DIA] às [HORA]?';
      html += '<a class="btn btn-wpp btn-block" href="' + wppLink(msgMilk) + '" target="_blank" rel="noopener" style="display:block;">' +
        'Resgatar 10 pontos – Milk Shake 300 ml</a>';

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

  if (inputCodigo) {
    inputCodigo.addEventListener('input', function() {
      inputCodigo.value = inputCodigo.value.toUpperCase();
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

      var tk = getGhToken();
      if (!tk) {
        encaminharCadastroWhatsApp(nome, dataBr, telRaw);
        return;
      }

      obterClientesAtualizados()
        .then(function(dados) {
          var existente = localizarClientePorIdentidade(dados, nome, dataIso);
          if (existente && existente.id) {
            atualizarCelularEIndice(dados, existente.id, telRaw, 'site_cadastro_reuso');
            return salvarClientesNoGitHub(dados, 'Clube: reaproveitar cadastro ' + nome).then(function(ok) {
              if (!ok) throw new Error('falha ao salvar atualização de cadastro');
              atualizarClientesMemoria(dados);
              setResultadoCadastro("Cadastro feito com sucesso! Agora use a opção 'Já sou cadastrado / Digitar código' para registrar seus pontos.", 'ok');
              if (inputNome) inputNome.value = nome;
              if (inputNasc) inputNasc.value = dataBr;
              if (inputTel) inputTel.value = mascaraTel(telRaw);
              resetarFormularioCadastro();
            });
          }

          var existentes = Object.keys(dados.clientes || {});
          var maxNum = 0;
          existentes.forEach(function(k) {
            var m = k.match(/USR-2026-(\d+)/);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
          });
          var novoId = 'USR-2026-' + String(maxNum + 1).padStart(4, '0');
          var agora = new Date().toISOString();

          dados.clientes[novoId] = {
            id_permanente: novoId,
            id_hash: gerarIdHash(),
            nome: nome,
            dataNasc: dataIso,
            cel: telRaw,
            cel_anterior: [],
            cadastro: agora,
            saldoPontos: 0,
            codigosUsados: [],
            resgates: [],
            totalPremios: 0,
            totalCodigos: 0,
            historico_alteracoes: [{ data: agora, tipo: 'cadastro', descricao: 'Cadastro pelo site', por: 'cliente' }],
            bloqueado: false,
            motivo_bloqueio: null,
            tentativas_fraude: 0,
            ultimo_acesso: agora
          };
          dados.indice_celular[telRaw] = novoId;

          return salvarClientesNoGitHub(dados, 'Clube: novo cadastro ' + nome).then(function(okNovo) {
            if (!okNovo) throw new Error('falha ao salvar novo cadastro');
            atualizarClientesMemoria(dados);
            setResultadoCadastro("Cadastro feito com sucesso! Agora use a opção 'Já sou cadastrado / Digitar código' para registrar seus pontos.", 'ok');
            if (inputNome) inputNome.value = nome;
            if (inputNasc) inputNasc.value = dataBr;
            if (inputTel) inputTel.value = mascaraTel(telRaw);
            resetarFormularioCadastro();
          });
        })
        .catch(function(e) {
          console.warn('[fidelidade] Falha ao salvar cadastro no backend; redirecionando para WhatsApp.', e);
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

      obterClientesAtualizados()
        .then(function(dados) {
          var encontrado = localizarClientePorIdentidade(dados, nomeLogin, nascIso);
          if ((!encontrado || !encontrado.id) && _clientesMemoria) {
            encontrado = localizarClientePorIdentidade(_clientesMemoria, nomeLogin, nascIso);
            if (encontrado && encontrado.id) dados = _clientesMemoria;
          }

          if (!encontrado || !encontrado.id) {
            setResultado('Não encontramos cadastro com estes dados. Por favor, use o botão "Quero participar do Clube de Fidelidade".', 'erro');
            if (btnIrCadastro) btnIrCadastro.style.display = 'block';
            return;
          }

          var clienteId = encontrado.id;
          var cliente = dados.clientes[clienteId];
          var celularAtualizado = atualizarCelularEIndice(dados, clienteId, tel, 'site_login');
          var commitMsg = 'Clube: atualizar celular login ' + (cliente.nome || nomeLogin);
          var persistir = celularAtualizado ? salvarClientesNoGitHub(dados, commitMsg) : Promise.resolve(true);

          return persistir.then(function(okPersistir) {
            if (!okPersistir) throw new Error('falha ao salvar atualização de celular no login');
            atualizarClientesMemoria(dados);
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
          });
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

  function incrementarTentativaCodigo() {
    var tel = (_clienteAtual && _clienteAtual.cel) || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
    if (!tel) return { total: 0, bloqueado: false, restantes: MAX_TENT_CODIGO };
    var total = parseInt(localStorage.getItem(TENT_COD_PREFIX + tel) || '0', 10) + 1;
    localStorage.setItem(TENT_COD_PREFIX + tel, String(total));
    var bloqueado = total > MAX_TENT_CODIGO;
    return { total: total, bloqueado: bloqueado, restantes: Math.max(0, MAX_TENT_CODIGO - total) };
  }

  function resetarTentativasCodigo() {
    var tel = (_clienteAtual && _clienteAtual.cel) || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
    if (tel) localStorage.removeItem(TENT_COD_PREFIX + tel);
  }

  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', function() {
      if (!_clienteAtual) {
        setResultadoCodigo('Antes de registrar código, faça login em "Já sou cadastrado / Digitar código".', 'erro');
        if (formCodigoWrap) formCodigoWrap.style.display = 'none';
        return;
      }

      var codigo = (inputCodigo && inputCodigo.value ? inputCodigo.value : '').trim().toUpperCase();
      if (!codigo) {
        setResultadoCodigo('Digite o código de fidelidade.', 'erro');
        return;
      }

      if (_clienteAtual.bloqueado || getTentativasCodigo() > MAX_TENT_CODIGO) {
        setResultadoCodigo('⛔ Conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
        mostrarWppBtn(wppLink('Minha conta no Clube Fidelidade está bloqueada. WhatsApp: ' + (_clienteAtual.cel || '')), '💬 Solicitar desbloqueio');
        if (formCodigoWrap) formCodigoWrap.style.display = 'none';
        return;
      }

      btnRegistrar.disabled = true;
      btnRegistrar.textContent = 'Validando...';

      ghRawFetch('dados/fidelidade.json')
        .then(function(fid) {
          var codigos = fid['códigos'] || fid.codigos || {};
          var entrada = codigos[codigo];

          if (!entrada) {
            var t = incrementarTentativaCodigo();
            if (t.bloqueado) {
              _clienteAtual.bloqueado = true;
              var telBloq = _clienteAtual.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
              setResultadoCodigo('⛔ Código inválido. 4ª tentativa: conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
              if (formCodigoWrap) formCodigoWrap.style.display = 'none';
              mostrarWppBtn(
                wppLink('Bloqueio no Clube Fidelidade após 4 tentativas incorretas.\nNome: ' + (_clienteAtual.nome || '-') + '\nWhatsApp: ' + mascaraTel(telBloq)),
                '💬 Solicitar desbloqueio ao atendente'
              );
            } else if (t.restantes === 0) {
              setResultadoCodigo('❌ Código inválido. ' + t.total + '/3 tentativas usadas. ⚠️ Próxima tentativa bloqueará sua conta!', 'erro');
            } else {
              setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
            }
            return;
          }

          if (entrada.status !== STATUS_DISPONIVEL) {
            var t2 = incrementarTentativaCodigo();
            if (t2.bloqueado) {
              _clienteAtual.bloqueado = true;
              setResultadoCodigo('⛔ Código já utilizado. 4ª tentativa: conta bloqueada por segurança.', 'erro');
              if (formCodigoWrap) formCodigoWrap.style.display = 'none';
              mostrarWppBtn(wppLink('Bloqueio no Clube Fidelidade. Nome: ' + (_clienteAtual.nome || '-')), '💬 Solicitar desbloqueio');
            } else {
              setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
            }
            return;
          }

          var usados = _clienteAtual.codigosUsados || [];
          if (usados.indexOf(codigo) !== -1) {
            setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
            return;
          }

          resetarTentativasCodigo();
          var tk = getGhToken();
          var telCliente = _clienteAtual.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
          if (!tk) {
            setResultadoCodigo('⚠️ Código válido, mas não foi possível aplicar automaticamente sem token. Fale conosco para finalizar o registro.', 'aviso');
            mostrarWppBtn(wppLink('Olá! Quero registrar meu código de fidelidade.\nNome: ' + (_clienteAtual.nome || '-') + '\nTel: ' + telCliente + '\nCódigo: ' + codigo), '💬 Enviar código para registrar ponto');
            return;
          }

          btnRegistrar.textContent = 'Aplicando código...';
          setResultadoCodigo('⏳ Código válido. Salvando uso do código e atualizando seus pontos...', 'aviso');

          return obterClientesAtualizados()
            .then(function(dadosClientes) {
              var clienteId = _clienteAtualId;
              if (!clienteId || !dadosClientes.clientes[clienteId]) {
                var encontrado = localizarClientePorIdentidade(
                  dadosClientes,
                  _clienteAtual.nome || (inputNome ? inputNome.value : ''),
                  _clienteAtual.dataNasc || parseDataBrToIso(inputNasc ? inputNasc.value : '')
                );
                clienteId = encontrado && encontrado.id ? encontrado.id : null;
              }
              if (!clienteId || !dadosClientes.clientes[clienteId]) throw new Error('cliente-nao-encontrado');

              var cliente = dadosClientes.clientes[clienteId];
              if (!Array.isArray(cliente.codigosUsados)) cliente.codigosUsados = [];
              if (cliente.codigosUsados.indexOf(codigo) !== -1) {
                setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
                return;
              }

              var mapa = obterMapaCodigos(fid);
              if (!mapa.map[codigo] || mapa.map[codigo].status !== STATUS_DISPONIVEL) {
                setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
                return;
              }

              var agora = new Date().toISOString();
              mapa.map[codigo].status = 'usado';
              mapa.map[codigo].usadoPor = telCliente;
              mapa.map[codigo].usadoEm = agora;
              fid.usados = Number(fid.usados || 0) + 1;
              if (Object.prototype.hasOwnProperty.call(fid, 'última_atualização')) {
                fid.última_atualização = agora;
              } else {
                fid.ultima_atualizacao = agora;
              }

              var pontosAntes = Number(cliente.saldoPontos || 0);
              cliente.codigosUsados.push(codigo);
              cliente.saldoPontos = pontosAntes + 1;
              cliente.totalCodigos = Number(cliente.totalCodigos || 0) + 1;
              cliente.ultimo_acesso = agora;
              if (!Array.isArray(cliente.historico_alteracoes)) cliente.historico_alteracoes = [];
              cliente.historico_alteracoes.push({
                data: agora,
                tipo: 'codigo_validado_site',
                descricao: 'Código validado no site: ' + codigo,
                por: 'cliente'
              });
              dadosClientes.indice_celular = dadosClientes.indice_celular || {};
              if (telCliente) dadosClientes.indice_celular[telCliente] = clienteId;

              return salvarComRetry(function() {
                return salvarFidelidadeNoGitHub(fid, 'Clube: marcar código como usado ' + codigo);
              }, 2).then(function(okFidelidade) {
                if (!okFidelidade) {
                  setResultadoCodigo('⚠️ Código reconhecido, mas não foi possível salvar no momento. Tente novamente em instantes.', 'erro');
                  return;
                }

                return salvarComRetry(function() {
                  return salvarClientesNoGitHub(dadosClientes, 'Clube: registrar ponto via código ' + codigo);
                }, 2).then(function(okClientes) {
                  if (!okClientes) {
                    setResultadoCodigo('⚠️ Código marcado como usado, mas houve falha ao atualizar seus pontos. Nossa equipe já pode validar pelo admin.', 'aviso');
                    mostrarWppBtn(wppLink('Olá! Houve falha parcial no registro do meu código.\nNome: ' + (cliente.nome || '-') + '\nCódigo: ' + codigo), '💬 Solicitar regularização');
                    return;
                  }

                  atualizarClientesMemoria(dadosClientes);
                  _clienteAtual = cliente;
                  _clienteAtualId = clienteId;
                  esconderWppBtn();
                  mostrarPainelCliente(cliente);
                  setResultadoCodigo('✅ Código registrado com sucesso! Seus pontos foram atualizados.', 'ok');
                  if (inputCodigo) inputCodigo.value = '';
                });
              });
            })
            .catch(function() {
              setResultadoCodigo('⚠️ Não foi possível concluir a validação agora. Tente novamente em instantes.', 'erro');
              mostrarWppBtn(wppLink('Olá! Preciso de ajuda para validar meu código de fidelidade.\nNome: ' + (_clienteAtual.nome || '-') + '\nCódigo: ' + codigo), '💬 Pedir ajuda no WhatsApp');
            });
        })
        .catch(function() {
          setResultadoCodigo('Código inválido ou já usado. Confira o código com a loja.', 'erro');
        })
        .finally(function() {
          btnRegistrar.disabled = false;
          btnRegistrar.textContent = 'Registrar código';
        });
    });
  }
})();
