/* Clube de Fidelidade — fluxo simplificado */
(function() {
  'use strict';

  var GH_RAW = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
  var GH_API = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';
  var WPP_NUM = '5516996062046';
  var META_10 = 10;
  var META_30 = 30;
  var STATUS_DISPONIVEL = 'disponível';

  var secaoCadastro = document.getElementById('secao-cadastro-fid');
  var secaoLogin = document.getElementById('secao-login-fid');
  var secaoPainel = document.getElementById('secao-painel-fid');

  var btnMostrarCadastro = document.getElementById('btn-mostrar-cadastro-fid');
  var btnMostrarLogin = document.getElementById('btn-mostrar-login-fid');
  var btnIrCadastro = document.getElementById('btn-ir-cadastro-fidelidade');

  var inputCadNome = document.getElementById('cad-nome');
  var inputCadNasc = document.getElementById('cad-nascimento');
  var inputCadTel = document.getElementById('cad-tel-view');
  var inputCadAceite = document.getElementById('cad-aceite');
  var btnCadastrar = document.getElementById('btn-cadastrar-clube');
  var resultadoCadastro = document.getElementById('resultado-cliente');

  var inputNome = document.getElementById('cliente-nome');
  var inputNasc = document.getElementById('cliente-nascimento');
  var inputTel = document.getElementById('cliente-telefone');
  var btnEntrar = document.getElementById('btn-entrar');
  var resultado = document.getElementById('resultado-consulta');

  var painelBoasVindas = document.getElementById('painel-boas-vindas');
  var painelPontos = document.getElementById('painel-pontos');
  var painelResgate = document.getElementById('painel-resgate');
  var formCodigoWrap = document.getElementById('form-codigo-wrap');
  var inputCodigo = document.getElementById('cliente-codigo');
  var btnRegistrar = document.getElementById('btn-registrar-ponto');
  var btnWppResgatar = document.getElementById('btn-wpp-resgatar-consulta');

  var _clienteAtual = null;

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

  function primeiroNome(nomeCompleto) {
    return (nomeCompleto || 'Cliente').split(' ')[0];
  }

  function setResultado(msg, tipo) {
    if (!resultado) return;
    resultado.textContent = msg;
    resultado.className = 'resultado' + (tipo ? ' ' + tipo : '');
  }

  function setResultadoCadastro(msg, tipo) {
    if (!resultadoCadastro) return;
    resultadoCadastro.textContent = msg;
    resultadoCadastro.className = 'resultado' + (tipo ? ' ' + tipo : '');
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
    var tk = getGhToken();
    if (!tk) return Promise.resolve(false);
    var CLIENTES_PATH = 'dados/clientes.json';

    return fetch(GH_API + CLIENTES_PATH, {
      headers: { Authorization: 'token ' + tk, Accept: 'application/vnd.github.v3+json' }
    })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(meta) {
        var payload = {
          message: mensagemCommit || 'Clube: atualizar clientes',
          content: encodeJsonToB64(dados),
          sha: meta.sha
        };
        return fetch(GH_API + CLIENTES_PATH, {
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
    var nomeCurto = primeiroNome(nome);
    var pts = Number(cliente.saldoPontos || 0);

    if (painelBoasVindas) painelBoasVindas.textContent = 'Bem-vindo(a), ' + nomeCurto + '!';
    if (painelPontos) painelPontos.textContent = 'Você tem ' + pts + ' pontos acumulados.';

    if (secaoPainel) secaoPainel.style.display = 'block';
    if (formCodigoWrap) formCodigoWrap.style.display = 'grid';

    renderPainelResgate(pts, nome, cliente.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : ''));
  }

  function resetarPainel() {
    _clienteAtual = null;
    if (secaoPainel) secaoPainel.style.display = 'none';
    if (formCodigoWrap) formCodigoWrap.style.display = 'none';
    renderPainelResgate(null);
    esconderWppBtn();
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

  if (inputCodigo) {
    inputCodigo.addEventListener('input', function() {
      inputCodigo.value = inputCodigo.value.toUpperCase();
    });
  }

  if (btnMostrarCadastro) btnMostrarCadastro.addEventListener('click', mostrarSecaoCadastro);
  if (btnMostrarLogin) btnMostrarLogin.addEventListener('click', mostrarSecaoLogin);
  if (btnIrCadastro) btnIrCadastro.addEventListener('click', mostrarSecaoCadastro);

  if (btnCadastrar) {
    btnCadastrar.addEventListener('click', function() {
      var nome = (inputCadNome && inputCadNome.value ? inputCadNome.value : '').trim();
      var dataBr = (inputCadNasc && inputCadNasc.value ? inputCadNasc.value : '').trim();
      var telRaw = (inputCadTel && inputCadTel.value ? inputCadTel.value : '').replace(/\D/g, '');
      var aceite = !!(inputCadAceite && inputCadAceite.checked);
      var dataIso = parseDataBrToIso(dataBr);

      if (!aceite) {
        setResultadoCadastro('⚠️ Você precisa aceitar as regras do programa para se cadastrar.', 'erro');
        return;
      }
      if (!nome || nome.length < 3) {
        setResultadoCadastro('⚠️ Informe seu nome completo.', 'erro');
        return;
      }
      if (!dataIso) {
        setResultadoCadastro('⚠️ Informe uma data válida no formato dd/mm/aaaa.', 'erro');
        return;
      }
      if (telRaw.length < 10) {
        setResultadoCadastro('⚠️ Número de celular inválido. Informe um WhatsApp com DDD.', 'erro');
        return;
      }

      btnCadastrar.disabled = true;
      btnCadastrar.textContent = 'Cadastrando...';
      setResultadoCadastro('Aguarde, registrando seu cadastro...', '');

      var tk = getGhToken();
      if (!tk) {
        var msg = '🎟️ *Cadastro no Clube de Fidelidade — Sorveteria Itapolitana Cajuru*\n\n' +
          '*Nome:* ' + nome + '\n' +
          '*WhatsApp:* ' + mascaraTel(telRaw) + '\n' +
          '*Data de nascimento:* ' + dataBr + '\n\n' +
          'Confirmo que li e aceito o regulamento do Clube de Fidelidade. ✅';
        window.open(wppLink(msg), '_blank');
        setResultadoCadastro('Cadastro enviado pelo WhatsApp. Assim que confirmado, use "Já sou cadastrado / Digitar código" para somar pontos.', 'ok');
        btnCadastrar.disabled = false;
        btnCadastrar.textContent = 'Fazer cadastro fidelidade';
        return;
      }

      ghRawFetch('dados/clientes.json')
        .then(function(dados) {
          if (!dados.clientes) dados.clientes = {};
          if (!dados.indice_celular) dados.indice_celular = {};

          var existente = localizarClientePorIdentidade(dados, nome, dataIso);
          if (existente && existente.id) {
            atualizarCelularEIndice(dados, existente.id, telRaw, 'site_cadastro_reuso');
            return salvarClientesNoGitHub(dados, 'Clube: reaproveitar cadastro ' + nome).then(function() {
              setResultadoCadastro('Cadastro feito com sucesso! Nas próximas compras, use a opção "Já sou cadastrado / Digitar código" para somar pontos.', 'ok');
              if (inputNome) inputNome.value = nome;
              if (inputNasc) inputNasc.value = dataBr;
              if (inputTel) inputTel.value = mascaraTel(telRaw);
              if (inputCadAceite) inputCadAceite.checked = false;
              if (inputCadNome) inputCadNome.value = '';
              if (inputCadNasc) inputCadNasc.value = '';
              if (inputCadTel) inputCadTel.value = '';
              mostrarSecaoLogin();
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

          return salvarClientesNoGitHub(dados, 'Clube: novo cadastro ' + nome).then(function() {
            setResultadoCadastro('Cadastro feito com sucesso! Nas próximas compras, use a opção "Já sou cadastrado / Digitar código" para somar pontos.', 'ok');
            if (inputNome) inputNome.value = nome;
            if (inputNasc) inputNasc.value = dataBr;
            if (inputTel) inputTel.value = mascaraTel(telRaw);
            if (inputCadAceite) inputCadAceite.checked = false;
            if (inputCadNome) inputCadNome.value = '';
            if (inputCadNasc) inputCadNasc.value = '';
            if (inputCadTel) inputCadTel.value = '';
            mostrarSecaoLogin();
          });
        })
        .catch(function(e) {
          setResultadoCadastro('⚠️ Erro ao cadastrar (' + e.message + '). Tente novamente.', 'erro');
        })
        .finally(function() {
          btnCadastrar.disabled = false;
          btnCadastrar.textContent = 'Fazer cadastro fidelidade';
        });
    });
  }

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

      ghRawFetch('dados/clientes.json')
        .then(function(dados) {
          var encontrado = localizarClientePorIdentidade(dados, nomeLogin, nascIso);

          if (!encontrado || !encontrado.id) {
            setResultado('Não encontramos cadastro com estes dados. Por favor, faça seu cadastro no botão "Fazer cadastro fidelidade".', 'erro');
            if (btnIrCadastro) btnIrCadastro.style.display = 'block';
            return;
          }

          var clienteId = encontrado.id;
          var cliente = dados.clientes[clienteId];
          var celularAtualizado = atualizarCelularEIndice(dados, clienteId, tel, 'site_login');
          var commitMsg = 'Clube: atualizar celular login ' + (cliente.nome || nomeLogin);
          var persistir = celularAtualizado ? salvarClientesNoGitHub(dados, commitMsg) : Promise.resolve(true);

          return persistir.then(function() {
            _clienteAtual = cliente;
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
        setResultado('Antes de registrar código, faça login em "Já sou cadastrado / Digitar código".', 'erro');
        if (formCodigoWrap) formCodigoWrap.style.display = 'none';
        return;
      }

      var codigo = (inputCodigo && inputCodigo.value ? inputCodigo.value : '').trim().toUpperCase();
      if (!codigo) {
        setResultado('Digite o código de fidelidade.', 'erro');
        return;
      }

      if (_clienteAtual.bloqueado || getTentativasCodigo() > MAX_TENT_CODIGO) {
        setResultado('⛔ Conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
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
              setResultado('⛔ Código inválido. 4ª tentativa: conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
              if (formCodigoWrap) formCodigoWrap.style.display = 'none';
              mostrarWppBtn(
                wppLink('Bloqueio no Clube Fidelidade após 4 tentativas incorretas.\nNome: ' + (_clienteAtual.nome || '-') + '\nWhatsApp: ' + mascaraTel(telBloq)),
                '💬 Solicitar desbloqueio ao atendente'
              );
            } else if (t.restantes === 0) {
              setResultado('❌ Código inválido. ' + t.total + '/3 tentativas usadas. ⚠️ Próxima tentativa bloqueará sua conta!', 'erro');
            } else {
              setResultado('❌ Código inválido. ' + t.total + '/3 tentativas usadas. Restam ' + t.restantes + ' tentativa(s).', 'erro');
            }
            return;
          }

          if (entrada.status !== STATUS_DISPONIVEL) {
            var t2 = incrementarTentativaCodigo();
            if (t2.bloqueado) {
              _clienteAtual.bloqueado = true;
              setResultado('⛔ Código já utilizado. 4ª tentativa: conta bloqueada por segurança.', 'erro');
              if (formCodigoWrap) formCodigoWrap.style.display = 'none';
              mostrarWppBtn(wppLink('Bloqueio no Clube Fidelidade. Nome: ' + (_clienteAtual.nome || '-')), '💬 Solicitar desbloqueio');
            } else {
              setResultado('Código já utilizado. Confira o código com a loja.', 'erro');
            }
            return;
          }

          var usados = _clienteAtual.codigosUsados || [];
          if (usados.indexOf(codigo) !== -1) {
            setResultado('Você já usou este código anteriormente.', 'erro');
            return;
          }

          resetarTentativasCodigo();
          var pts = _clienteAtual.saldoPontos || 0;
          var telCliente = _clienteAtual.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
          var msg = 'Clube Fidelidade - Registrar ponto\nNome: ' + _clienteAtual.nome + '\nTel: ' + telCliente + '\nCódigo: ' + codigo + '\nPontos atuais: ' + pts;

          setResultado('Código registrado com sucesso! Seus pontos foram atualizados.', 'ok');
          mostrarWppBtn(wppLink(msg), '💬 Enviar código para registrar ponto');
          if (inputCodigo) inputCodigo.value = '';
        })
        .catch(function() {
          setResultado('Erro ao validar código. Tente novamente.', 'erro');
        })
        .finally(function() {
          btnRegistrar.disabled = false;
          btnRegistrar.textContent = 'Registrar código';
        });
    });
  }
})();
