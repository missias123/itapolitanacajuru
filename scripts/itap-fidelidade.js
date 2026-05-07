/* Clube de Fidelidade — lógica principal
 * Extraído de fidelidade.html na Fase 3 da refatoração arquitetural.
 */
    (function() {
      'use strict';

      /* ── constantes ────────────────────────────────────────────────── */
      var GH_RAW = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
      var GH_API = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';
      var WPP_NUM = '5516996062046';
      var META_10 = 10;
      var META_30 = 30;
      var STATUS_DISPONIVEL = 'disponível';
      var SALDO_CACHE_PREFIX = 'itap_fidelidade_saldo_';
      var SALDO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

      /* ── referências DOM ───────────────────────────────────────────── */
      var inputTel          = document.getElementById('cliente-telefone');
      var inputCodigo       = document.getElementById('cliente-codigo');
      var btnEntrar         = document.getElementById('btn-entrar');
      var btnRegistrar      = document.getElementById('btn-registrar-ponto');
      var resultado         = document.getElementById('resultado-consulta');
      var formCodigoWrap    = document.getElementById('form-codigo-wrap');
      var formCadastroWrap  = document.getElementById('form-cadastro-wrap');
      var btnWppResgatar    = document.getElementById('btn-wpp-resgatar-consulta');
      var fillBar10         = document.getElementById('progresso-fill');
      var fillBar30         = document.getElementById('progresso-fill30');
      var ptsTexto10        = document.getElementById('progresso-pts-texto');
      var ptsTexto30        = document.getElementById('progresso-pts30-texto');
      var progressoHint     = document.getElementById('progresso-hint');

      /* estado da sessão */
      var _clienteAtual = null;
      var _nomeSessao = 'Cliente';

      /* ── helpers ───────────────────────────────────────────────────── */
      function mascaraTel(v) {
        var d = (v || '').replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
        if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
        return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      }

      function primeiroNome(nomeCompleto) {
        return (nomeCompleto || 'Cliente').split(' ')[0];
      }

      function setResultado(msg, tipo) {
        if (!resultado) return;
        resultado.textContent = msg;
        resultado.className = 'resultado' + (tipo ? ' ' + tipo : '');
      }

      /* helper para atualizar qualquer elemento de resultado pelo ID */
      function setResultadoEl(id, msg, tipo) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.className = 'resultado' + (tipo ? ' ' + tipo : '');
      }

      function atualizarBarras(pts) {
        if (!fillBar10 || !fillBar30 || !ptsTexto10 || !ptsTexto30 || !progressoHint) return;
        var pct10 = Math.min(100, Math.round((pts / META_10) * 100));
        var pct30 = Math.min(100, Math.round((pts / META_30) * 100));

        fillBar10.style.width = pct10 + '%';
        fillBar10.parentElement.setAttribute('aria-valuenow', pts);
        ptsTexto10.textContent = pts + ' / ' + META_10 + ' pts';

        fillBar30.style.width = pct30 + '%';
        fillBar30.parentElement.setAttribute('aria-valuenow', pts);
        ptsTexto30.textContent = pts + ' / ' + META_30 + ' pts';

        var nomeRef = primeiroNome(_nomeSessao || (_clienteAtual && _clienteAtual.nome) || 'Cliente');
        if (pts <= 0) {
          progressoHint.textContent = 'Registre cupons para acumular pontos!';
        } else if (pts < META_10) {
          progressoHint.textContent = nomeRef + ', você tem ' + pts + ' de 10 pontos para o Milkshake.';
        } else {
          progressoHint.textContent = nomeRef + ', você tem ' + Math.min(pts, META_30) + ' de 30 pontos para a Caixa 7 bolas.';
        }
      }

      function wppLink(texto) {
        return 'https://wa.me/' + WPP_NUM + '?text=' + encodeURIComponent(texto);
      }

      function mostrarWppBtn(href, texto) {
        if (!btnWppResgatar) return;
        btnWppResgatar.textContent = texto;
        btnWppResgatar.style.display = 'block';
      }

      function chaveSaldoCache(tel) {
        return SALDO_CACHE_PREFIX + String(tel || '').replace(/\D/g, '');
      }

      function gerarIdHash() {
        var b = new Uint8Array(4);
        crypto.getRandomValues(b);
        return Array.from(b).map(function(x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase();
      }

      function salvarSaldoEmCache(tel, pontos, nome) {
        try {
          var payload = {
            pontos: Number(pontos || 0),
            nome: nome || 'Cliente',
            atualizadoEm: new Date().toISOString()
          };
          localStorage.setItem(chaveSaldoCache(tel), JSON.stringify(payload));
        } catch (e) {}
      }

      function lerSaldoDoCache(tel) {
        try {
          var bruto = localStorage.getItem(chaveSaldoCache(tel));
          if (!bruto) return null;
          return JSON.parse(bruto);
        } catch (e) {
          return null;
        }
      }

      function eSaldoRecente(cache) {
        if (!cache || !cache.atualizadoEm) return false;
        var ts = new Date(cache.atualizadoEm).getTime();
        if (!ts) return false;
        return (Date.now() - ts) <= SALDO_CACHE_MAX_AGE_MS;
      }

      function formatarDataHoraPtBr(iso) {
        try {
          return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          return 'agora há pouco';
        }
      }

      function tentarUsarSaldoCacheOffline(tel) {
        var cache = lerSaldoDoCache(tel);
        if (!eSaldoRecente(cache)) {
          try { localStorage.removeItem(chaveSaldoCache(tel)); } catch (e) {}
          return false;
        }
        var pts = Number(cache.pontos || 0);
        var nome = primeiroNome(cache.nome || 'Cliente');
        _nomeSessao = nome;
        atualizarBarras(pts);
        setResultado(
          'Olá, ' + nome + '! Você está vendo seus pontos guardados da última consulta em ' +
          formatarDataHoraPtBr(cache.atualizadoEm) +
          '. Eles serão atualizados quando a internet voltar.',
          'ok'
        );
        formCodigoWrap.style.display = 'none';
        if (btnWppResgatar) btnWppResgatar.style.display = 'none';
        return true;
      }

      // UX FINAL: pré-preenche telefone e saudação quando houver sessão recente no cache.
      function tentarRestaurarSessaoVisivel() {
        try {
          var melhor = null;
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i) || '';
            if (k.indexOf(SALDO_CACHE_PREFIX) !== 0) continue;
            var bruto = localStorage.getItem(k);
            if (!bruto) continue;
            var data = JSON.parse(bruto);
            if (!data || !data.atualizadoEm) continue;
            var ts = new Date(data.atualizadoEm).getTime() || 0;
            if (!melhor || ts > melhor.ts) {
              melhor = { key: k, data: data, ts: ts };
            }
          }
          if (!melhor) return;
          var telLimpo = melhor.key.replace(SALDO_CACHE_PREFIX, '').replace(/\D/g, '');
          if (telLimpo) inputTel.value = mascaraTel(telLimpo);
          var nome = primeiroNome((melhor.data && melhor.data.nome) || 'Cliente');
          _nomeSessao = nome;
          setResultado('Olá de volta, ' + nome + '! Seus pontos foram carregados da última sessão.', 'ok');
        } catch (e) {}
      }

      /* ── busca via GitHub API (sem CDN) para atualização imediata no site ─
         Quando o admin salva dados/clientes.json ou dados/fidelidade.json,
         a mudança fica visível instantaneamente via API (sem cache de CDN).
         Fallback: raw.githubusercontent.com com cache-buster ?t=Date.now(). ── */
      function ghRawFetch(path) {
        var apiUrl = GH_API + path;
        var tk = '';
        try { tk = localStorage.getItem('itap_gh_token') || ''; } catch (e) {}
        var opts = { cache: 'no-store' };
        if (tk) opts.headers = { 'Authorization': 'token ' + tk, 'Accept': 'application/vnd.github.v3+json' };
        return fetch(apiUrl, opts)
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(ghResp) {
            if (!ghResp.content) throw new Error('conteudo ausente');
            var raw = new TextDecoder().decode(
              Uint8Array.from(atob(ghResp.content.replace(/\n/g, '')).split(''), function(c) { return c.charCodeAt(0); })
            );
            return JSON.parse(raw);
          })
          .catch(function() {
            /* fallback: raw URL com cache-buster */
            return fetch(GH_RAW + path + '?t=' + Date.now(), { cache: 'no-store' })
              .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
          });
      }

      /* ── controle de tentativas erradas de código ──────────────────────────
         Regra: o cliente tem 3 tentativas; na 4ª a conta é bloqueada por segurança.
         "DIGITAR CÓDIGO" só está disponível dentro da Área do Cliente (após login),
         nunca fora do cadastro — regra do programa de fidelidade.              ── */
      var TENT_COD_PREFIX = 'itap_tent_cod_';
      var MAX_TENT_CODIGO = 3; /* 3 tentativas; na 4ª, bloqueia */

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
        var bloqueado = total > MAX_TENT_CODIGO; /* 4ª = bloqueado */
        return { total: total, bloqueado: bloqueado, restantes: Math.max(0, MAX_TENT_CODIGO - total) };
      }

      function resetarTentativasCodigo() {
        var tel = (_clienteAtual && _clienteAtual.cel) || (inputTel ? inputTel.value.replace(/\D/g, '') : '');
        if (tel) localStorage.removeItem(TENT_COD_PREFIX + tel);
      }

      /* ── inicializar selects de data de nascimento ───────────────────── */
      (function iniciarSelectsData() {
        var selDia = document.getElementById('cad-dia');
        var selAno = document.getElementById('cad-ano');
        for (var d = 1; d <= 31; d++) {
          var o = document.createElement('option');
          o.value = String(d).padStart(2, '0');
          o.textContent = String(d).padStart(2, '0');
          selDia.appendChild(o);
        }
        var anoAtual = new Date().getFullYear();
        for (var a = anoAtual; a >= 1940; a--) {
          var oa = document.createElement('option');
          oa.value = String(a);
          oa.textContent = String(a);
          selAno.appendChild(oa);
        }
      })();

      /* ── CADASTRO NO CLUBE ───────────────────────────────────────────────
         Integração com admin: dados salvos em dados/clientes.json via GitHub API.
         IDs críticos: cad-nome, cad-tel-view, cad-dia, cad-mes, cad-ano, cad-aceite, btn-cadastrar-clube.
         NÃO alterar esses IDs sem atualizar o admin-painel.html correspondente.
         O fluxo de pontos/cupons (cliente-telefone, form-codigo-wrap, btn-entrar,
         btn-registrar-ponto) está SEPARADO e NÃO foi alterado.
      ───────────────────────────────────────────────────────────────────── */
      function mostrarFormCadastro(tel) {
        var cadTelView = document.getElementById('cad-tel-view');
        if (cadTelView && tel && tel.trim()) cadTelView.value = mascaraTel(tel);
        /* formulário já está sempre visível; scroll suave até ele */
        if (formCadastroWrap) formCadastroWrap.scrollIntoView({behavior:'smooth', block:'start'});
        var cadNome = document.getElementById('cad-nome');
        if (cadNome && !(cadNome.value || '').trim()) cadNome.focus();
      }

      /* ── Fluxo sequencial: após cadastro bem-sucedido, direcionar automaticamente
         o cliente para a Área do Cliente com o telefone pré-preenchido.
         "DIGITAR CÓDIGO" só aparece aqui dentro (nunca fora) — regra do programa. ── */
      function ativarAreaClientePosCadastro(telRaw, nomePrimeiro, pontos) {
        /* pré-preenche o campo de login da Área do Cliente */
        if (inputTel) inputTel.value = mascaraTel(telRaw);
        /* atualiza barras de progresso */
        atualizarBarras(pontos || 0);
        /* mostra campo de código se ainda não tem pontos suficientes para resgatar */
        if (formCodigoWrap && (pontos || 0) < META_10) {
          setResultado('Bem-vindo(a), ' + nomePrimeiro + '! 🎉 Cadastro confirmado. Insira o código do seu cupom abaixo para registrar seu primeiro ponto.', 'ok');
          formCodigoWrap.style.display = 'grid';
        }
        /* scroll suave até a Área do Cliente */
        var secArea = document.getElementById('titulo-area-cliente');
        if (secArea) setTimeout(function() { secArea.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
      }

      function ocultarFormCadastro() {
        /* formulário permanece visível após cadastro — apenas limpa os campos */
        var campos = ['cad-nome', 'cad-tel-view', 'cad-dia', 'cad-mes', 'cad-ano'];
        campos.forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        var aceite = document.getElementById('cad-aceite');
        if (aceite) aceite.checked = false;
      }

      /* ── Máscara no campo de telefone do formulário de cadastro ─── */
      var cadTelInput = document.getElementById('cad-tel-view');
      if (cadTelInput) {
        cadTelInput.addEventListener('input', function() {
          cadTelInput.value = mascaraTel(cadTelInput.value);
        });
      }

      document.getElementById('btn-cadastrar-clube').addEventListener('click', function() {
        var nome    = (document.getElementById('cad-nome').value || '').trim();
        var dia     = document.getElementById('cad-dia').value;
        var mes     = document.getElementById('cad-mes').value;
        var ano     = document.getElementById('cad-ano').value;
        var aceite  = document.getElementById('cad-aceite').checked;
        /* lê o telefone do próprio campo do formulário (agora editável) */
        var cadTelEl = document.getElementById('cad-tel-view');
        var telRaw  = (cadTelEl ? cadTelEl.value : '').replace(/\D/g, '');

        if (!nome || nome.length < 3) {
          setResultadoEl('resultado-cliente', '⚠️ Informe seu nome completo.', 'erro'); return;
        }
        if (telRaw.length < 10) {
          setResultadoEl('resultado-cliente', '⚠️ Número de WhatsApp inválido. Corrija o número no campo acima.', 'erro'); return;
        }
        if (!dia || !mes || !ano) {
          setResultadoEl('resultado-cliente', '⚠️ Informe sua data de nascimento completa.', 'erro'); return;
        }
        if (!aceite) {
          setResultadoEl('resultado-cliente', '⚠️ Você precisa aceitar as regras do programa para se cadastrar.', 'erro'); return;
        }

        var dataNasc = ano + '-' + mes + '-' + dia;
        var btn = document.getElementById('btn-cadastrar-clube');
        btn.disabled = true;
        btn.textContent = 'Cadastrando…';
        setResultadoEl('resultado-cliente', 'Aguarde, registrando seu cadastro…', '');

        var tk = (function(){ try { return localStorage.getItem('itap_gh_token') || ''; } catch(e){ return ''; } })();

        if (!tk) {
          /* sem token → redireciona WhatsApp */
          var msg = '🎟️ *Cadastro no Clube de Fidelidade — Sorveteria Itapolitana Cajuru*\n\n' +
            '*Nome:* ' + nome + '\n' +
            '*WhatsApp:* ' + mascaraTel(telRaw) + '\n' +
            '*Data de nascimento:* ' + dia + '/' + mes + '/' + ano + '\n\n' +
            'Confirmo que li e aceito o Regulamento do Clube de Fidelidade. ✅';
          window.open('https://wa.me/' + WPP_NUM + '?text=' + encodeURIComponent(msg), '_blank');
          setResultadoEl('resultado-cliente', '✅ Seu pedido de cadastro foi enviado via WhatsApp! A loja confirmará em breve.', 'ok');
          ocultarFormCadastro();
          /* scroll até a Área do Cliente para o cliente aguardar a confirmação */
          var secAreaWpp = document.getElementById('titulo-area-cliente');
          if (secAreaWpp) setTimeout(function() { secAreaWpp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
          btn.disabled = false;
          btn.textContent = '🎟️ Cadastrar no Clube';
          return;
        }

        /* com token → salva direto no GitHub */
        var CLIENTES_PATH = 'dados/clientes.json';
        fetch(GH_API + CLIENTES_PATH, {
          headers: { 'Authorization': 'token ' + tk, 'Accept': 'application/vnd.github.v3+json' }
        })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(ghResp) {
          var sha = ghResp.sha;
          var rawJson = new TextDecoder().decode(Uint8Array.from(atob(ghResp.content.replace(/\n/g,'')).split(''), function(c){return c.charCodeAt(0);}));
          var dados = JSON.parse(rawJson);

          /* verificar duplicidade */
          var idx = dados.indice_celular || {};
          if (idx[telRaw]) {
            setResultadoEl('resultado-cliente', 'ℹ️ Este número já está cadastrado. Use a seção "Consultar pontos" abaixo para entrar.', '');
            btn.disabled = false;
            btn.textContent = '🎟️ Cadastrar no Clube';
            return;
          }

          /* gerar próximo ID */
          var existentes = Object.keys(dados.clientes || {});
          var maxNum = 0;
          existentes.forEach(function(k) {
            var m = k.match(/USR-2026-(\d+)/);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
          });
          var novoId = 'USR-2026-' + String(maxNum + 1).padStart(4, '0');

          /* criar novo cliente */
          var agora = new Date().toISOString();
          dados.clientes[novoId] = {
            id_permanente: novoId,
            id_hash: gerarIdHash(),
            nome: nome,
            dataNasc: dataNasc,
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
          idx[telRaw] = novoId;
          dados.indice_celular = idx;

          var enc = new TextEncoder().encode(JSON.stringify(dados, null, 2));
          var chunks = [];
          var CHUNK = 8192;
          for (var ci = 0; ci < enc.length; ci += CHUNK) {
            chunks.push(String.fromCharCode.apply(null, enc.subarray(ci, ci + CHUNK)));
          }
          var novoConteudo = btoa(chunks.join(''));
          return fetch(GH_API + CLIENTES_PATH, {
            method: 'PUT',
            headers: { 'Authorization': 'token ' + tk, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Clube: novo cadastro ' + nome, content: novoConteudo, sha: sha })
          }).then(function(r) {
            if (!r.ok) throw new Error('Erro ao salvar: ' + r.status);
            _clienteAtual = dados.clientes[novoId];
            _nomeSessao = primeiroNome(nome);
            salvarSaldoEmCache(telRaw, 0, nome);
            atualizarBarras(0);
            setResultadoEl('resultado-cliente', '🎉 Cadastro realizado com sucesso! Bem-vindo(a), ' + primeiroNome(nome) + '!', 'ok');
            ocultarFormCadastro();
            /* fluxo sequencial: regulamento → cadastro → área do cliente → digitar código */
            ativarAreaClientePosCadastro(telRaw, primeiroNome(nome), 0);
          });
        })
        .catch(function(e) {
          setResultadoEl('resultado-cliente', '⚠️ Erro ao cadastrar (' + e.message + '). Tente novamente.', 'erro');
        })
        .finally(function() {
          btn.disabled = false;
          btn.textContent = '🎟️ Cadastrar no Clube';
        });
      });

      /* ── máscara ────────────────────────────────────────────────────── */
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
      tentarRestaurarSessaoVisivel();

      /* ── CONSULTAR PONTOS ────────────────────────────────────────────── */
      if (btnEntrar) {
      btnEntrar.addEventListener('click', function() {
        var tel = inputTel.value.replace(/\D/g, '');
        if (!tel || tel.length < 10) {
          setResultado('Digite seu WhatsApp para continuar.', 'erro');
          return;
        }

        if (!navigator.onLine) {
          if (tentarUsarSaldoCacheOffline(tel)) return;
          setResultado('Sem conexão no momento. Conecte-se à internet para consultar seus pontos.', 'erro');
          return;
        }

        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Consultando…';
        _clienteAtual = null;
        formCodigoWrap.style.display = 'none';
        if (btnWppResgatar) btnWppResgatar.style.display = 'none';

        ghRawFetch('dados/clientes.json')
          .then(function(dados) {
            var idx = dados.indice_celular || {};
            var usrKey = idx[tel];

            if (!usrKey || !dados.clientes[usrKey]) {
              /* telefone não cadastrado — redirecionar ao formulário acima */
              setResultado('Número não encontrado. Use o formulário "Cadastro gratuito" acima para se inscrever no Clube!', 'erro');
              /* pré-preenche o campo de telefone do formulário de cadastro */
              mostrarFormCadastro(tel);
              return;
            }

            _clienteAtual = dados.clientes[usrKey];
            var pts = _clienteAtual.saldoPontos || 0;
            var nome = primeiroNome(_clienteAtual.nome);
            _nomeSessao = nome;
            salvarSaldoEmCache(tel, pts, _clienteAtual.nome || nome);

            atualizarBarras(pts);

            if (_clienteAtual.bloqueado) {
              setResultado('⚠️ Conta com restrição. Fale conosco pelo WhatsApp para regularizar.', 'erro');
              mostrarWppBtn(wppLink('Olá! Minha conta no Clube Fidelidade está bloqueada. Cel: ' + tel), '💬 Falar com atendente');
              return;
            }

            if (pts >= META_30) {
              setResultado('Login feito! Seus pontos foram carregados. ' + nome + ', você tem ' + pts + ' pontos e já pode resgatar a Caixa 7 bolas.', 'ok');
              mostrarWppBtn(wppLink('Clube Fidelidade - Quero resgatar meu prêmio!\nNome: ' + _clienteAtual.nome + '\nPontos: ' + pts), '💬 Resgatar Caixa 7 bolas via WhatsApp');
            } else if (pts >= META_10) {
              setResultado('Login feito! Seus pontos foram carregados. ' + nome + ', você tem ' + pts + ' pontos e já pode resgatar um Milkshake 300ml.', 'ok');
              mostrarWppBtn(wppLink('Clube Fidelidade - Quero resgatar meu prêmio!\nNome: ' + _clienteAtual.nome + '\nPontos: ' + pts), '💬 Resgatar Milkshake via WhatsApp');
            } else {
              setResultado('Login feito! Seus pontos foram carregados. ' + nome + ', faltam ' + (META_10 - pts) + ' para o primeiro prêmio.', '');
              formCodigoWrap.style.display = 'grid';
            }
          })
          .catch(function() {
            if (tentarUsarSaldoCacheOffline(tel)) return;
            setResultado('Não foi possível consultar agora. Verifique sua conexão ou fale via WhatsApp.', 'erro');
            mostrarWppBtn(wppLink('Olá! Preciso consultar meus pontos no Clube de Fidelidade.'), '💬 Consultar pontos via WhatsApp');
          })
          .finally(function() {
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar / Consultar meus pontos';
          });
      }); // end btnEntrar click
      } // end if (btnEntrar)

      /* ── VALIDAR CÓDIGO ─────────────────────────────────────────────────────
         Regra de segurança: máx 3 tentativas erradas; na 4ª, conta é bloqueada.
         "DIGITAR CÓDIGO" só fica acessível dentro da Área do Cliente (após login),
         nunca fora — impede que qualquer pessoa tente adivinhar códigos aleatórios. ── */
      if (btnRegistrar) {
      btnRegistrar.addEventListener('click', function() {
        var codigo = (inputCodigo.value || '').trim().toUpperCase();
        if (!codigo) {
          setResultado('Digite o código do cupom.', 'erro');
          return;
        }
        if (!_clienteAtual) {
          setResultado('Entre com seu WhatsApp antes de registrar códigos.', 'erro');
          return;
        }

        /* verificar se conta já está bloqueada */
        if (_clienteAtual.bloqueado || getTentativasCodigo() > MAX_TENT_CODIGO) {
          setResultado('⛔ Conta bloqueada por segurança. Fale conosco via WhatsApp para regularizar.', 'erro');
          mostrarWppBtn(wppLink('Minha conta no Clube Fidelidade está bloqueada. WhatsApp: ' + (_clienteAtual.cel || '')), '💬 Solicitar desbloqueio');
          if (formCodigoWrap) formCodigoWrap.style.display = 'none';
          return;
        }

        btnRegistrar.disabled = true;
        btnRegistrar.textContent = 'Validando…';

        ghRawFetch('dados/fidelidade.json')
          .then(function(fid) {
            /* chave literal conforme dados/fidelidade.json (UTF-8) */
            var codigos = fid['códigos'] || fid['codigos'] || {};
            var entrada = codigos[codigo];

            /* ── código não existe: contar tentativa errada ── */
            if (!entrada) {
              var t = incrementarTentativaCodigo();
              if (t.bloqueado) {
                /* 4ª tentativa errada: bloquear conta */
                _clienteAtual.bloqueado = true;
                var telBloq = _clienteAtual.cel || inputTel.value.replace(/\D/g, '');
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

            /* ── código já utilizado: também conta tentativa errada ── */
            if (entrada.status !== STATUS_DISPONIVEL) {
              var t2 = incrementarTentativaCodigo();
              if (t2.bloqueado) {
                _clienteAtual.bloqueado = true;
                setResultado('⛔ Código já utilizado. 4ª tentativa: conta bloqueada por segurança.', 'erro');
                if (formCodigoWrap) formCodigoWrap.style.display = 'none';
                mostrarWppBtn(wppLink('Bloqueio no Clube Fidelidade. Nome: ' + (_clienteAtual.nome || '-')), '💬 Solicitar desbloqueio');
              } else {
                setResultado('⚠️ Este código já foi utilizado. Cada cupom vale apenas uma vez. (' + t2.total + '/3 tentativas)', 'erro');
              }
              return;
            }

            /* ── cliente já usou este código: aviso simples, sem contar tentativa ── */
            var usados = _clienteAtual.codigosUsados || [];
            if (usados.indexOf(codigo) !== -1) {
              setResultado('Você já usou este código anteriormente.', 'erro');
              return;
            }

            /* ── código válido: resetar tentativas e encaminhar via WhatsApp ── */
            resetarTentativasCodigo();
            var pts = _clienteAtual.saldoPontos || 0;
            var telCliente = _clienteAtual.cel || inputTel.value.replace(/\D/g, '');
            var msg = 'Clube Fidelidade - Registrar ponto\nNome: ' + _clienteAtual.nome + '\nTel: ' + telCliente + '\nCódigo: ' + codigo + '\nPontos atuais: ' + pts;
            var msgApi = (entrada && (entrada.mensagem || entrada.msg)) ? String(entrada.mensagem || entrada.msg).trim() : 'Código validado com sucesso.';
            setResultado(msgApi + ' Seus pontos foram atualizados.', 'ok');
            mostrarWppBtn(wppLink(msg), '💬 Enviar código para registrar ponto');
            inputCodigo.value = '';
          })
          .catch(function() {
            setResultado('Erro ao validar código. Tente novamente.', 'erro');
          })
          .finally(function() {
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = '✅ Validar Código';
          });
      }); // end btnRegistrar click
      } // end if (btnRegistrar)
    })();
