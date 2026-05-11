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

  function abrirRegrasSorteioPromo() {
    var bloco = document.getElementById('bloco-regras-sorteio-promo');
    var form  = document.getElementById('form-sorteio-inline');
    if (!bloco) return;
    bloco.style.display = bloco.style.display === 'none' ? 'block' : 'none';
    if (form) form.style.display = 'none';
    if (bloco.style.display === 'block') {
      setTimeout(function() { bloco.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);
    }
  }

  function verificarAceiteSorteioPromo() {
    var cb   = document.getElementById('aceite-sorteio-inline');
    var btn  = document.getElementById('btn-aceitar-sorteio-inline');
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
    form.style.display = 'block';
    setTimeout(function() { form.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);
  }

  function mascaraTelPromo(el) {
    var v = el.value.replace(/\D/g,'');
    if (v.length > 11) v = v.slice(0,11);
    if (v.length > 6)      v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
    else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length > 0) v = '(' + v;
    el.value = v;
  }

  function mostrarMsgSorteio(txt, tipo) {
    var el = document.getElementById('msg-sorteio-inline');
    if (!el) return;
    el.textContent = txt;
    el.style.display = 'block';
    el.style.background = tipo === 'ok' ? '#e8f5e9' : '#fff3e0';
    el.style.color = tipo === 'ok' ? '#2e7d32' : '#e65100';
    el.style.border = tipo === 'ok' ? '1px solid #a5d6a7' : '1px solid #ffcc80';
    setTimeout(function() { if (el.textContent === txt) el.style.display = 'none'; }, 5000);
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

  async function enviarSorteioPromo() {
    // ── Honeypot anti-bot ──
    var hp = document.getElementById('sort-hp');
    if (hp && hp.value) { mostrarMsgSorteio('Erro de validacao. Tente novamente.', 'aviso'); return; }

    // ── Rate limiting ──
    var msgRate = _promoVerificarRate();
    if (msgRate) { mostrarMsgSorteio(msgRate, 'aviso'); return; }

    var nome = (document.getElementById('sort-nome').value || '').replace(/[<>&"'/\\]/g, '').trim();
    var cel  = (document.getElementById('sort-cel').value || '').replace(/\D/g,'');
    var dia  = (document.getElementById('sort-dia').value || '').trim();
    var mes  = (document.getElementById('sort-mes').value || '').trim();
    var ano  = (document.getElementById('sort-ano').value || '').trim();

    // ── Validações completas ──
    if (!nome || nome.length < 5) {
      mostrarMsgSorteio('Informe seu nome completo (nome e sobrenome, mínimo 5 letras).', 'aviso'); return;
    }
    if (nome.trim().split(/\s+/).length < 2) {
      mostrarMsgSorteio('Informe nome e sobrenome completos.', 'aviso'); return;
    }
    if (cel.length < 10 || cel.length > 11) {
      mostrarMsgSorteio('Informe um celular válido com DDD (10 ou 11 dígitos).', 'aviso'); return;
    }
    var ddd = parseInt(cel.slice(0,2));
    if (ddd < 11 || ddd > 99) {
      mostrarMsgSorteio('DDD inválido. Informe um celular com DDD correto.', 'aviso'); return;
    }
    var diaInt = parseInt(dia), mesInt = parseInt(mes), anoInt = parseInt(ano);
    if (!dia || !mes || !ano || ano.length < 4 || diaInt < 1 || diaInt > 31 || mesInt < 1 || mesInt > 12 || anoInt < 1900 || anoInt > new Date().getFullYear()) {
      mostrarMsgSorteio('Informe uma data de nascimento válida (Dia, Mês e Ano).', 'aviso'); return;
    }
    // ── Validação de idade mínima (14 anos) ──
    var hoje = new Date();
    var nasc = new Date(anoInt, mesInt - 1, diaInt);
    var idade = hoje.getFullYear() - nasc.getFullYear();
    var antesAniv = hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
    if (antesAniv) idade--;
    if (idade < 14) {
      mostrarMsgSorteio('E necessario ter no minimo 14 anos para participar do sorteio.', 'aviso'); return;
    }

    _promoRegistrarTentativa();

    // Bloquear botão durante verificação
    var btn = document.getElementById('btn-enviar-sorteio-promo');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Verificando...'; }
    mostrarMsgSorteio('⏳ Verificando cadastro, aguarde...', 'ok');
    try {
      // 1. Ler fidelidade.json do GitHub
      var r = await fetch(_GH_FID + '?t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!r.ok) throw new Error('Erro ' + r.status);
      var d = await r.json();
      var sha = d.sha;
      var bin = atob(d.content.replace(/\n/g,''));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var fid = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      var inscritos = fid.sorteioInscritos || [];
      var celLimpo = cel.replace(/\D/g,'');
      var nomeNorm = normalizarNomePromo(nome);
      var dataNasc = dia.padStart(2,'0') + '/' + mes.padStart(2,'0') + '/' + ano;
      var dataNascIso = ano + '-' + mes.padStart(2,'0') + '-' + dia.padStart(2,'0');
      var celFmt = '(' + cel.slice(0,2) + ') ' + cel.slice(2,7) + '-' + cel.slice(7);

      // ── 2a. Buscar/criar cliente por identidade (nome + dataNasc) e atualizar celular ──
      var cResp = await fetch(_GH_CLIENTES + '?t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!cResp.ok) throw new Error('Erro ao consultar clientes: ' + cResp.status);
      var cApi = await cResp.json();
      var cSha = cApi.sha;
      var cBin = atob(cApi.content.replace(/\n/g,''));
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
          var m = k.match(/USR-2026-(\d+)/);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        idUnico = 'USR-2026-' + String(maxNum + 1).padStart(4, '0');
        var agoraIso = new Date().toISOString();
        clientesMap[idUnico] = {
          id_permanente: idUnico,
          id_hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
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

      // ── 2a. Verificar identidade por NOME + DATA e atualizar celular, se mudou ──
      var jaInscritoNomeData = inscritos.find(function(c) {
        var cNome = normalizarNomePromo(c.nome || '');
        return cNome === nomeNorm && c.dataNasc === dataNasc;
      });
      if (jaInscritoNomeData) {
        var numExistenteNomeData = inscritos.indexOf(jaInscritoNomeData) + 1;
        var celAtualInscricao = (jaInscritoNomeData.cel || '').replace(/\D/g, '');
        jaInscritoNomeData.id = idUnico;
        if (celAtualInscricao === celLimpo) {
          mostrarMsgSorteio('❌ Você já está cadastrado(a) neste sorteio. Número de inscrição: #' + String(numExistenteNomeData).padStart(3,'0'), 'aviso');
          if (btn) { btn.disabled = false; btn.textContent = '🎉 Cadastrar no Sorteio'; }
          return;
        }
        jaInscritoNomeData.cel = celFmt;
        jaInscritoNomeData.hora = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        fid.sorteioInscritos = inscritos;
        var conteudoAtualizado = btoa(unescape(encodeURIComponent(JSON.stringify(fid, null, 2))));
        await fetch(_GH_FID, {
          method: 'PUT',
          headers: { 'Authorization': 'token ' + _GH_TK_P, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Atualizar celular sorteio: ' + nome, content: conteudoAtualizado, sha: sha })
        });
        mostrarMsgSorteio('Cadastro encontrado! Atualizamos seu número de celular. Sua participação na promoção foi registrada.', 'ok');
        if (btn) { btn.disabled = false; btn.textContent = '🎉 Cadastrar no Sorteio'; }
        return;
      }

      // ── 2b. Verificar duplicata por CELULAR (outro cadastro) ──
      var jaInscritoCel = inscritos.find(function(c) {
        return (c.cel || '').replace(/\D/g,'') === celLimpo;
      });
      if (jaInscritoCel) {
        var numExistente = inscritos.indexOf(jaInscritoCel) + 1;
        mostrarMsgSorteio('❌ Você já está cadastrado(a) neste sorteio com este celular! Número de inscrição: #' + String(numExistente).padStart(3,'0'), 'aviso');
        if (btn) { btn.disabled = false; btn.textContent = '🎉 Cadastrar no Sorteio'; }
        return;
      }
      // 3. Adicionar novo inscrito

      inscritos.push({
        id: idUnico,
        nome: nome,
        cel: celFmt,
        dataNasc: dataNasc,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
      });
      fid.sorteioInscritos = inscritos;
      var numInscricao = inscritos.length;
      // 4. Salvar no GitHub
      var novoConteudo = btoa(unescape(encodeURIComponent(JSON.stringify(fid, null, 2))));
      var resp = await fetch(_GH_FID, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + _GH_TK_P, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Inscrito no sorteio: ' + nome, content: novoConteudo, sha: sha })
      });
      if (!resp.ok) throw new Error('Erro ao salvar: ' + resp.status);
      // 5. Abrir WhatsApp com número de inscrição
      var numStr = String(numInscricao).padStart(3,'0');
      var msg = '🍦 *SORTEIO MENSAL — Sorveteria Itapolitana Cajuru*\n\n' +
        '*ID Permanente:* ' + idUnico + '\n' +
        '*Número de Inscrição:* #' + numStr + '\n' +
        '*Nome:* ' + nome + '\n' +
        '*Celular:* ' + celFmt + '\n' +
        '*Data de nascimento:* ' + dataNasc + '\n\n' +
        '⚠️ *ATENÇÃO IMPORTANTE:*\n' +
        'Os dados informados acima devem ser *idênticos* aos do seu documento oficial com foto (RG ou CNH).\n\n' +
        '🚫 *O PRÊMIO NÃO SERÁ ENTREGUE* se o nome ou a data de nascimento do documento divergirem do cadastro.\n\n' +
        'Para retirar o prêmio, apresente *pessoalmente*:\n' +
        '📄 Documento oficial com foto (RG ou CNH) — original\n' +
        '📲 Celular cadastrado com WhatsApp ativo\n\n' +
        'Estou ciente das regras e concordo com o regulamento do sorteio. 🎉';
      window.open('https://wa.me/' + WHATS_SORVETERIA + '?text=' + encodeURIComponent(msg), '_blank');
      if (clienteNovoCriado) {
        mostrarMsgSorteio('Cadastro realizado e participação na promoção registrada com sucesso!', 'ok');
      } else if (celularClienteAtualizado) {
        mostrarMsgSorteio('Cadastro encontrado! Atualizamos seu número de celular. Sua participação na promoção foi registrada.', 'ok');
      } else {
        mostrarMsgSorteio('✅ Cadastro confirmado! Seu número é #' + numStr + '. Envie a mensagem no WhatsApp para finalizar!', 'ok');
      }
      // Limpar formulário
      document.getElementById('sort-nome').value = '';
      document.getElementById('sort-cel').value = '';
      document.getElementById('sort-dia').value = '';
      document.getElementById('sort-mes').value = '';
      document.getElementById('sort-ano').value = '';
    } catch(e) {
      console.error('[Itap] Erro no cadastro:', e);
      mostrarMsgSorteio('⚠️ Erro ao verificar cadastro. Tente novamente em instantes.', 'aviso');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🎉 Cadastrar no Sorteio'; }
    }
  }
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
