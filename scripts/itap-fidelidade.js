(function() {
  'use strict';

  var GH_RAW = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
  var ITAP_WORKER_API = 'https://itap-worker.missias123.workers.dev';
  var WPP_NUM = '5516996062046';
  var META_10 = 10;
  var META_30 = 30;
  var STATUS_DISPONIVEL = 'disponível';
  var STATUS_USADO = 'usado';
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
  var _cadastroRegrasAceitas = false;

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

  var FEEDBACK_COLORS = { ok: '#1b5e20', erro: '#b71c1c', aviso: '#e65100' };
  var FEEDBACK_BACKGROUNDS = { ok: '#e8f5e9', erro: '#ffebee', aviso: '#fff3e0' };
  function setResultadoCodigo(msg, tipo) {
    if (!resultadoCodigo) { setResultado(msg, tipo); return; }
    if (!msg) { resultadoCodigo.style.display = 'none'; resultadoCodigo.textContent = ''; return; }
    resultadoCodigo.textContent = msg;
    resultadoCodigo.style.display = 'block';
    resultadoCodigo.style.color = FEEDBACK_COLORS[tipo] || '#333';
    resultadoCodigo.style.background = FEEDBACK_BACKGROUNDS[tipo] || '#f5f5f5';
    resultadoCodigo.style.border = '1.5px solid ' + (FEEDBACK_COLORS[tipo] || '#ccc');
    resultadoCodigo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setResultadoCadastro(msg, tipo) {
    if (!resultadoCadastro) return;
    resultadoCadastro.style.display = msg ? 'block' : 'none';
    resultadoCadastro.textContent = msg || '';
    resultadoCadastro.className = 'resultado' + (tipo ? ' ' + tipo : '');
  }

  function wppLink(msg) {
    return 'https://wa.me/' + WPP_NUM + '?text=' + encodeURIComponent(msg);
  }

  function encaminharCadastroFidWhatsApp(nome, dataBr, tel) {
    var msg = '🍦 *NOVO CADASTRO FIDELIDADE — Itapolitana Cajuru*\n\n' +
              '*Nome:* ' + nome + '\n' +
              '*Data Nasc:* ' + dataBr + '\n' +
              '*WhatsApp:* ' + tel + '\n\n' +
              'Estou ciente das regras e quero participar do Clube de Fidelidade! 🎉';
    window.open(wppLink(msg), '_blank');
  }

  function mostrarWppBtn(url, texto) {
    if (!btnWppResgatar) return;
    btnWppResgatar.href = url;
    btnWppResgatar.textContent = texto || '💬 Falar no WhatsApp';
    btnWppResgatar.style.display = 'inline-flex';
  }

  function esconderWppBtn() {
    if (btnWppResgatar) btnWppResgatar.style.display = 'none';
  }

  function cadastroNomeValido() {
    return !!(inputCadNome && inputCadNome.value.trim().length >= 3);
  }

  function cadastroDataValida() {
    return !!(inputCadNasc && parseDataBrToIso(inputCadNasc.value));
  }

  function cadastroCelularValido() {
    var telRaw = inputCadTel ? inputCadTel.value.replace(/\D/g, '') : '';
    return BRAZILIAN_MOBILE_REGEX.test(telRaw);
  }

  function getGhToken() {
    try {
      return localStorage.getItem('itap_gh_token') || '';
    } catch (e) {
      return '';
    }
  }

  function parseDataBrToIso(dataBr) {
    var v = String(dataBr || '').trim();
    var m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    var dia = parseInt(m[1], 10);
    var mes = parseInt(m[2], 10);
    var ano = parseInt(m[3], 10);
    if (ano < 1900 || ano > new Date().getFullYear()) return null;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    var d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== (mes - 1) || d.getDate() !== dia) return null;
    return String(ano) + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
  }

  // ── Worker API helpers ──────────────────────────────────────────────────────

  function cadastrarClienteWorker(nome, dataNasc, cel) {
    return fetch(ITAP_WORKER_API + '/api/clientes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: nome, dataNasc: dataNasc, cel: cel })
    }).then(function(r) { 
      if (r.status === 409) {
        throw { type: 'DUPLICADO', message: 'Você já possui cadastro no Clube de Fidelidade! Acesse sua conta.' };
      }
      return r.json(); 
    });
  }

  function loginClienteWorker(nome, dataNasc, cel) {
    return fetch(ITAP_WORKER_API + '/api/clientes/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: nome, dataNasc: dataNasc, cel: cel })
    }).then(function(r) { return r.json(); });
  }

  function resgatarCodigoWorker(clienteId, idHash, codigo) {
    return fetch(ITAP_WORKER_API + '/api/fidelidade/resgatar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ clienteId: clienteId, idHash: idHash, codigo: codigo })
    }).then(function(r) { return r.json(); });
  }

  // ── GitHub Direct Fallback (Admin Mode) ─────────────────────────────────────

  async function resgatarCodigoDiretoGitHub(nome, cel, codigo) {
    var tk = getGhToken();
    if (!tk) throw new Error('Token ausente');

    var path = 'dados/fidelidade.json';
    var apiUrl = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/' + path;
    
    var r = await fetch(apiUrl, { headers: { Authorization: 'token ' + tk } });
    if (!r.ok) throw new Error('Erro ao ler fidelidade');
    var d = await r.json();
    var sha = d.sha;
    var fid = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(d.content.replace(/\n/g, '')).split(''), c => c.charCodeAt(0))));

    var codigos = fid['códigos'] || fid.codigos || {};
    var entrada = codigos[codigo];

    if (!entrada || entrada.status !== STATUS_DISPONIVEL) {
      return { ok: false, tipo: 'invalido' };
    }

    // Marcar como usado
    entrada.status = STATUS_USADO;
    entrada.usado_por = nome;
    entrada.usado_cel = cel;
    entrada.usado_em = new Date().toISOString();
    fid.usados = (fid.usados || 0) + 1;

    // Atualizar pontos do cliente no sorteioInscritos (fallback de armazenamento)
    if (!fid.sorteioInscritos) fid.sorteioInscritos = [];
    
    // Normalizar busca para evitar duplicados por formatação
    var celLimpo = cel.replace(/\D/g,'');
    var inscrito = fid.sorteioInscritos.find(i => {
      var iCel = (i.cel || '').replace(/\D/g,'');
      return i.nome === nome || iCel === celLimpo;
    });

    var ptsGanhos = fid.config && fid.config.pontosPorCodigo ? Number(fid.config.pontosPorCodigo) : 0.5;

    if (inscrito) {
      inscrito.pontos = (Number(inscrito.pontos) || 0) + ptsGanhos;
      inscrito.ultimo_ponto = entrada.usado_em;
      if (!inscrito.cel) inscrito.cel = mascaraTel(cel);
    } else {
      inscrito = {
        nome: nome,
        cel: mascaraTel(cel),
        pontos: ptsGanhos,
        ultimo_ponto: entrada.usado_em,
        cadastro: entrada.usado_em
      };
      fid.sorteioInscritos.push(inscrito);
    }

    // Usar TextEncoder para evitar problemas com caracteres especiais no btoa
    var jsonStr = JSON.stringify(fid, null, 2);
    var bytes = new TextEncoder().encode(jsonStr);
    var novoConteudo = btoa(String.fromCharCode.apply(null, bytes));
    var save = await fetch(apiUrl, {
      method: 'PUT',
      headers: { Authorization: 'token ' + tk, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fidelidade: baixa manual codigo ' + codigo, content: novoConteudo, sha: sha })
    });

    if (!save.ok) throw new Error('Erro ao salvar no GitHub');
    return { ok: true, pontos: inscrito ? inscrito.pontos : 1 };
  }

  function ghRawFetch(path) {
    var apiUrl = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/' + path;
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

  function renderPainelResgate(pts, nome, cel) {
    if (!painelResgate) return;
    if (pts === null) { painelResgate.innerHTML = ''; painelResgate.style.display = 'none'; return; }

    var html = '<div class="resgate-container">';
    html += '<h3>🎁 Seus Prêmios Disponíveis</h3>';
    
    // Meta 10
    var progresso10 = Math.min(100, (pts / META_10) * 100);
    html += '<div class="meta-box' + (pts >= META_10 ? ' alcancada' : '') + '">';
    html += '  <div class="meta-info"><span>10 Pontos: 1 Picolé de Fruta</span> <strong>' + pts + '/10</strong></div>';
    html += '  <div class="progress-bar"><div class="progress-fill" style="width:' + progresso10 + '%"></div></div>';
    if (pts >= META_10) html += '  <button class="btn-resgate" onclick="window.solicitarResgate(\'1 Picolé de Fruta\', 10)">Resgatar Agora</button>';
    html += '</div>';

    // Meta 30
    var progresso30 = Math.min(100, (pts / META_30) * 100);
    html += '<div class="meta-box' + (pts >= META_30 ? ' alcancada' : '') + '">';
    html += '  <div class="meta-info"><span>30 Pontos: 1 Milk Shake 300ml</span> <strong>' + pts + '/30</strong></div>';
    html += '  <div class="progress-bar"><div class="progress-fill" style="width:' + progresso30 + '%"></div></div>';
    if (pts >= META_30) html += '  <button class="btn-resgate" onclick="window.solicitarResgate(\'1 Milk Shake 300ml\', 30)">Resgatar Agora</button>';
    html += '</div>';

    html += '</div>';
    painelResgate.innerHTML = html;
    painelResgate.style.display = 'block';
  }

  window.solicitarResgate = function(premio, custo) {
    if (!_clienteAtual) return;
    var msg = 'Olá! Gostaria de resgatar meu prêmio do Clube Fidelidade.\n\n' +
              'Prêmio: ' + premio + '\n' +
              'Custo: ' + custo + ' pontos\n' +
              'Nome: ' + _clienteAtual.nome + '\n' +
              'Celular: ' + mascaraTel(_clienteAtual.cel);
    window.open(wppLink(msg), '_blank');
  };

  function mostrarPainelCliente(cliente) {
    if (!cliente) return;
    var nome = cliente.nome || 'Cliente';
    var pts = Number(cliente.saldoPontos || 0);
    if (painelBoasVindas) painelBoasVindas.textContent = 'Bem-vindo(a), ' + nome + '!';
    if (painelPontos) painelPontos.textContent = 'Você tem ' + pts + ' pontos acumulados.';
    if (secaoLogin) secaoLogin.style.display = 'none';
    if (secaoPainel) secaoPainel.style.display = 'block';
    if (formCodigoWrap) formCodigoWrap.style.display = 'grid';
    setResultadoCodigo('', '');
    renderPainelResgate(pts, nome, cliente.cel || (inputTel ? inputTel.value.replace(/\D/g, '') : ''));
  }

  if (btnEntrar) {
    btnEntrar.addEventListener('click', function() {
      var nomeLogin = (inputNome && inputNome.value ? inputNome.value : '').trim();
      var nascBr = (inputNasc && inputNasc.value ? inputNasc.value : '').trim();
      var nascIso = parseDataBrToIso(nascBr);
      var tel = (inputTel && inputTel.value ? inputTel.value : '').replace(/\D/g, '');

      if (!nomeLogin || nomeLogin.length < 3 || !nascIso || !tel) {
        setResultado('Preencha todos os campos corretamente para entrar.', 'erro');
        return;
      }

      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Consultando...';

      loginClienteWorker(nomeLogin, nascIso, tel)
        .then(function(res) {
          if (res.found) {
            _clienteAtual = res.cliente;
            _clienteAtualId = res.clienteId;
            setResultado('Login realizado com sucesso.', 'ok');
            mostrarPainelCliente(_clienteAtual);
          } else {
            // Fallback Admin: Se tiver token, permite entrar mesmo sem achar no Worker
            if (getGhToken()) {
              _clienteAtual = { nome: nomeLogin, cel: tel, saldoPontos: 0, id_hash: 'ADMIN' };
              _clienteAtualId = 'ADMIN';
              setResultado('Modo Admin: Cadastro não encontrado no Worker, usando validação direta.', 'aviso');
              mostrarPainelCliente(_clienteAtual);
            } else {
              setResultado('Cadastro não encontrado. Verifique os dados ou cadastre-se.', 'erro');
            }
          }
        })
        .catch(function() {
          if (getGhToken()) {
            _clienteAtual = { nome: nomeLogin, cel: tel, saldoPontos: 0, id_hash: 'ADMIN' };
            _clienteAtualId = 'ADMIN';
            mostrarPainelCliente(_clienteAtual);
          } else {
            setResultado('Erro na conexão. Tente novamente mais tarde.', 'erro');
          }
        })
        .finally(function() {
          btnEntrar.disabled = false;
          btnEntrar.textContent = 'Entrar na minha fidelidade';
        });
    });
  }

  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', function() {
      if (!_clienteAtual) return;
      var codigo = (inputCodigo && inputCodigo.value ? inputCodigo.value : '').trim().toUpperCase();
      if (!codigo) return;

      btnRegistrar.disabled = true;
      btnRegistrar.textContent = 'Validando...';

      var resgateFunc = (_clienteAtualId === 'ADMIN') ? 
        resgatarCodigoDiretoGitHub(_clienteAtual.nome, _clienteAtual.cel, codigo) :
        resgatarCodigoWorker(_clienteAtualId, _clienteAtual.id_hash, codigo);

      resgateFunc
        .then(function(res) {
          if (res.ok) {
            _clienteAtual.saldoPontos = res.pontos;
            setResultadoCodigo('✅ Código registrado com sucesso!', 'ok');
            mostrarPainelCliente(_clienteAtual);
            if (inputCodigo) inputCodigo.value = '';
          } else {
            setResultadoCodigo('❌ Código inválido ou já utilizado.', 'erro');
          }
        })
        .catch(function() {
          setResultadoCodigo('⚠️ Erro ao validar código. Tente novamente.', 'erro');
        })
        .finally(function() {
          btnRegistrar.disabled = false;
          btnRegistrar.textContent = 'Registrar código';
        });
    });
  }

  if (btnMostrarCadastro) btnMostrarCadastro.addEventListener('click', function() {
    if (secaoCadastro) secaoCadastro.style.display = 'block';
    if (secaoLogin) secaoLogin.style.display = 'none';
  });

  if (btnMostrarLogin) btnMostrarLogin.addEventListener('click', function() {
    if (secaoLogin) secaoLogin.style.display = 'block';
    if (secaoCadastro) secaoCadastro.style.display = 'none';
  });

  function atualizarEstadoBotaoCadastro() {
    if (!btnCadastrar) return;
    var valido = cadastroNomeValido() && cadastroDataValida() && cadastroCelularValido();
    btnCadastrar.disabled = !valido;
  }

  var cbAceiteFid = document.getElementById('aceite-fidelidade-inline');
  if (cbAceiteFid) {
    cbAceiteFid.addEventListener('change', function() {
      if (btnAceitarRegras) {
        btnAceitarRegras.disabled = !cbAceiteFid.checked;
      }
    });
  }

  if (btnAceitarRegras) btnAceitarRegras.addEventListener('click', function() {
    _cadastroRegrasAceitas = true;
    if (etapaCadastroForm) {
      etapaCadastroForm.style.display = 'block';
      // Habilitar TODOS os campos imediatamente para evitar travamentos
      [inputCadNome, inputCadNasc, inputCadTel].forEach(function(el) {
        if (el) {
          el.disabled = false;
          el.classList.remove('form-control-disabled');
        }
      });
      setTimeout(function() {
        etapaCadastroForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (inputCadNome) inputCadNome.focus();
      }, 100);
    }
    btnAceitarRegras.textContent = 'Regras aceitas ✓';
    btnAceitarRegras.classList.add('aceito');
  });

  function preencherLoginComDadosCadastro(nome, dataBr, tel) {
    if (inputNome) inputNome.value = nome;
    if (inputNasc) inputNasc.value = dataBr;
    if (inputTel) inputTel.value = tel;
    
    // Disparar evento de input para revelar os campos de login
    if (inputNome) inputNome.dispatchEvent(new Event('input'));
  }

  function atualizarFluxoCadastroFid() {
    var nomeOk = cadastroNomeValido();
    var dataOk = cadastroDataValida();
    var celOk = cadastroCelularValido();

    if (inputCadNasc) {
      inputCadNasc.disabled = !nomeOk;
      inputCadNasc.classList.toggle('form-control-disabled', !nomeOk);
    }
    if (inputCadTel) {
      inputCadTel.disabled = !dataOk;
      inputCadTel.classList.toggle('form-control-disabled', !dataOk);
    }
    if (btnCadastrar) {
      btnCadastrar.disabled = !(nomeOk && dataOk && celOk);
    }
  }

  if (inputCadNome) inputCadNome.addEventListener('input', atualizarFluxoCadastroFid);
  if (inputCadNasc) inputCadNasc.addEventListener('input', atualizarFluxoCadastroFid);
  if (inputCadTel) inputCadTel.addEventListener('input', atualizarFluxoCadastroFid);

  if (inputCadNome) inputCadNome.addEventListener('input', atualizarEstadoBotaoCadastro);
  if (inputCadNasc) inputCadNasc.addEventListener('input', atualizarEstadoBotaoCadastro);
  if (inputCadTel) inputCadTel.addEventListener('input', atualizarEstadoBotaoCadastro);

  // Lógica para revelar campos de login conforme preenchimento
  if (inputNome) {
    inputNome.addEventListener('input', function() {
      var nome = inputNome.value.trim();
      var wrapData = document.getElementById('login-wrap-data');
      var wrapCel = document.getElementById('login-wrap-cel');
      var wrapBtn = document.getElementById('login-wrap-btn');

      if (nome.length >= 3) {
        if (wrapData) wrapData.style.display = 'block';
        if (inputNasc) {
          inputNasc.disabled = false;
          inputNasc.classList.remove('form-control-disabled');
        }
        if (wrapCel) wrapCel.style.display = 'block';
        if (inputTel) {
          inputTel.disabled = false;
          inputTel.classList.remove('form-control-disabled');
        }
        if (wrapBtn) wrapBtn.style.display = 'block';
        if (btnEntrar) {
          btnEntrar.disabled = false;
          btnEntrar.classList.remove('form-control-disabled');
        }
      }
    });
  }

  if (btnCadastrar) {
    btnCadastrar.addEventListener('click', function() {
      var nome = (inputCadNome && inputCadNome.value ? inputCadNome.value : '').trim();
      var dataBr = (inputCadNasc && inputCadNasc.value ? inputCadNasc.value : '').trim();
      var telRaw = (inputCadTel && inputCadTel.value ? inputCadTel.value : '').replace(/\D/g, '');
      var dataIso = parseDataBrToIso(dataBr);

      if (!nome || !dataIso || !telRaw) return;

      btnCadastrar.disabled = true;
      btnCadastrar.textContent = 'Cadastrando...';

      cadastrarClienteWorker(nome, dataIso, telRaw)
        .then(function() {
          setResultadoCadastro('✅ Cadastro realizado com sucesso! Entrando...', 'ok');
          preencherLoginComDadosCadastro(nome, dataBr, mascaraTel(telRaw));
          setTimeout(function() {
            if (btnMostrarLogin) btnMostrarLogin.click();
            if (btnEntrar) btnEntrar.click(); // Tenta logar automaticamente
          }, 1500);
        })
        .catch(function(err) {
          if (err && err.type === 'DUPLICADO') {
            setResultadoCadastro(err.message, 'aviso');
            preencherLoginComDadosCadastro(nome, dataBr, mascaraTel(telRaw));
            if (btnMostrarLogin) {
              setTimeout(function() { btnMostrarLogin.click(); }, 2000);
            }
          } else {
            // Se o worker falhar por rede, tentamos salvar via GitHub se houver token, ou avisamos do erro
            setResultadoCadastro('❌ Erro ao salvar cadastro. Tente novamente em instantes.', 'erro');
          }
        })
        .finally(function() {
          btnCadastrar.disabled = false;
          btnCadastrar.textContent = '✅ Finalizar Cadastro';
        });
    });
  }

  if (inputCadTel) inputCadTel.addEventListener('input', function() { inputCadTel.value = mascaraTel(inputCadTel.value); });
  if (inputTel) inputTel.addEventListener('input', function() { inputTel.value = mascaraTel(inputTel.value); });
  if (inputCadNasc) inputCadNasc.addEventListener('input', function() { inputCadNasc.value = formatarDataInputBr(inputCadNasc.value); });
  if (inputNasc) inputNasc.addEventListener('input', function() { inputNasc.value = formatarDataInputBr(inputNasc.value); });
  if (inputCodigo) inputCodigo.addEventListener('input', function() { inputCodigo.value = inputCodigo.value.toUpperCase(); });

  function formatarDataInputBr(raw) {
    var nums = String(raw || '').replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 2) return nums;
    if (nums.length <= 4) return nums.slice(0, 2) + '/' + nums.slice(2);
    return nums.slice(0, 2) + '/' + nums.slice(2, 4) + '/' + nums.slice(4);
  }

})();
