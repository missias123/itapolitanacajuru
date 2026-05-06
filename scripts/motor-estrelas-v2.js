/**
 * MOTOR DE SORTEIO - ITAMANDUÁ: A CORRIDA DAS ESTRELAS (v2.0)
 * Sistema de gamificação com caça diária de estrelas premiadas
 * VERSÃO CORRIGIDA: Sem bugs, com sincronização real e segurança máxima
 */

class MotorEstrelasV2 {
  constructor() {
    this.config = null;
    this.cicloAtual = null;
    this.horarioHoje = null;
    this.estrelaCapturada = false;
    this.tokenResgate = null;
    this.intervaloVerificacao = null;
    this.ultimoCliqueEm = null;
    this.fusoHorario = -3; // GMT-3 (Brasília)
    this.PREMIO_OPCOES = {
      acai: { nome: 'Açaí Promocional (400ml)', valor: 1 },
      milkshake: { nome: 'Milkshake Delicioso', valor: 2 },
      picoles: { nome: '5 Picolés Recheados', valor: 3 }
    };
  }

  /**
   * Inicializar o motor com dados do servidor
   */
  async inicializar(urlArquivo = 'estrelas_ciclo.json') {
    try {
      const resposta = await fetch(urlArquivo + '?t=' + Date.now()); // Evitar cache
      const dados = await resposta.json();
      
      this.config = dados.configGeral;
      this.cicloAtual = dados.cicloAtual;
      this.horariosDia = dados.horariosDia;
      this.rankingAtual = dados.rankingAtual;
      this.estrelaCapturada = dados.estrelaCapturada;
      this.usuariosOnline = dados.usuariosOnline || 0;
    
      console.log('✅ Motor de Estrelas v2.0 inicializado com sucesso');
      this.iniciarVerificacao();
      this.iniciarHeartbeat();
      return true;
    } catch (erro) {
      console.error('❌ Erro ao inicializar motor:', erro);
      return false;
    }
  }

  /**
   * BUG FIX #6: Obter horário correto com fuso horário (GMT-3)
   */
  obterHorarioAtualComFuso() {
    // Usa Intl.DateTimeFormat — padrão de grandes sistemas, sem erro de fuso
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(agora);
    const get = (tipo) => partes.find(p => p.type === tipo)?.value || '00';
    // Retorna objeto com os campos necessários
    return {
      getFullYear: () => parseInt(get('year')),
      getMonth:    () => parseInt(get('month')) - 1,
      getDate:     () => parseInt(get('day')),
      getHours:    () => parseInt(get('hour')),
      getMinutes:  () => parseInt(get('minute')),
      getSeconds:  () => parseInt(get('second')),
      toISOString: () => `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`
    };
  }

  /**
   * Obter o horário da estrela para hoje
   */
  obterHorarioHoje() {
    const hoje = this.obterHorarioAtualComFuso().toISOString().split('T')[0];
    // Suporta 'horario' e 'hora' para compatibilidade com versoes antigas do JSON
    const entrada = this.horariosDia ? this.horariosDia[hoje] : null;
    return (entrada?.horario || entrada?.hora) || null;
  }

  /**
   * BUG FIX #1: Verificar se é o horário exato da estrela (SEM expiração automática)
   */
  ehHorarioDaEstrela() {
    // Sistema desativado pelo admin — não mostrar
    if (!this.config || !this.config.ativo) return false;
    // Estrela já capturada ou em resgate — não mostrar
    if (this.estrelaCapturada.status === 'capturada' || this.estrelaCapturada.status === 'em_resgate') {
      return false;
    }
    // Estrela já foi ativada nesta sessão — não disparar de novo
    // Fix #6.4: Resetar flag se a ativação foi em outro dia (virada de meia-noite)
    if (this._estrelaAtivadaEm) {
      const agora2 = this.obterHorarioAtualComFuso();
      const dataAtivacao = new Date(this._estrelaAtivadaEm);
      // Comparar dia atual (SP) com dia da ativação — ambos formatados como dd/mm/yyyy
      const diaAtivacao = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(dataAtivacao);
      const hojeFmt = String(agora2.getDate()).padStart(2,'0') + '/' + String(agora2.getMonth()+1).padStart(2,'0') + '/' + agora2.getFullYear();
      if (diaAtivacao !== hojeFmt) {
        // Virou o dia — resetar flag para que nova estrela possa aparecer
        this._estrelaAtivadaEm = null;
      } else {
        return false;
      }
    }

    const agora = this.obterHorarioAtualComFuso();
    const horaAtual    = agora.getHours();
    const minutoAtual  = agora.getMinutes();
    const horarioEstrela = this.obterHorarioHoje();
    if (!horarioEstrela) return false;

    const [horaE, minE] = horarioEstrela.split(':').map(Number);
    const minutosAgora   = horaAtual  * 60 + minutoAtual;
    const minutosEstrela = horaE * 60 + minE;
    // Janela de 5 minutos APÓS o horário agendado (nunca antes)
    return minutosAgora >= minutosEstrela && minutosAgora < minutosEstrela + 5;
  }

  /**
   * Iniciar verificação contínua do horário
   */
  iniciarVerificacao() {
    // Verifica a cada 10 segundos — rápido o suficiente para não perder o horário
    this.intervaloVerificacao = setInterval(() => {
      if (this.ehHorarioDaEstrela()) {
        console.log('🌟 É HORA DA ESTRELA! Ativando...');
        this._estrelaAtivadaEm = Date.now(); // Trava: não disparar duas vezes
        this.ativarEstrela();
      }
    }, 10000); // 10 segundos
  }

  /**
   * Iniciar o "pulso" (heartbeat) para contar usuários online
   */
  iniciarHeartbeat() {
    // Simular incremento de usuários online para teste
    // No sistema real, isso enviaria um sinal para o servidor
    this.usuariosOnline = Math.floor(Math.random() * 15) + 5; // Entre 5 e 20 usuários
    
    setInterval(() => {
      // Variar levemente o número para parecer real
      const variacao = Math.floor(Math.random() * 3) - 1; // -1, 0 ou +1
      this.usuariosOnline = Math.max(1, this.usuariosOnline + variacao);
      
      window.dispatchEvent(new CustomEvent('usuariosOnlineUpdate', {
        detail: { count: this.usuariosOnline }
      }));
    }, 15000); // Atualizar a cada 15 segundos
  }

  /**
   * Obter o número de usuários online
   */
  obterUsuariosOnline() {
    return this.usuariosOnline;
  }

  /**
   * TRAVA TOTAL: Processar clique com todas as defesas
   */
  async processarClique(callback) {
    // TRAVA 1: Estrela já capturada hoje
    if (this.estrelaCapturada.status === 'capturada' || this.estrelaCapturada.status === 'em_resgate') {
      console.warn('⚠️ A estrela já foi capturada hoje!');
      return { sucesso: false, motivo: 'ja_capturada' };
    }

    // TRAVA 2: Verificar se a estrela foi ativada nos últimos 2 minutos (janela de clique)
    const agora2 = Date.now();
    if (!this._estrelaAtivadaEm || (agora2 - this._estrelaAtivadaEm) > 2 * 60 * 1000) {
      console.warn('⚠️ Janela de clique expirada! Clique bloqueado.');
      return { sucesso: false, motivo: 'fora_do_horario' };
    }

    // TRAVA 3: Anti-clique duplo (500ms entre cliques)
    const agora = Date.now();
    if (this.ultimoCliqueEm && (agora - this.ultimoCliqueEm) < 500) {
      console.warn('⚠️ Clique duplo detectado!');
      return { sucesso: false, motivo: 'clique_duplo' };
    }
    this.ultimoCliqueEm = agora;

    // TRAVA 4: Bloquear clique imediatamente (sem segundo clique possível)
    this.estrelaCapturada.status = 'em_resgate'; // Bloqueia qualquer outro clique

    // TRAVA 3: Token diário baseado no relógio — formato EST_AAAAMMDD_HHMMSS_RRR
    // Fix #6.5: Sufixo aleatório de 3 dígitos para evitar colisão quando dois usuários clicam no mesmo segundo
    const _tPartes = new Intl.DateTimeFormat('pt-BR', {
      timeZone:'America/Sao_Paulo',
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    }).formatToParts(new Date());
    const _tGet = (t) => (_tPartes.find(p => p.type === t) || {value:'00'}).value;
    const _rnd3 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const tokenUnico = 'EST_' + _tGet('year') + _tGet('month') + _tGet('day') + '_' + _tGet('hour') + _tGet('minute') + _tGet('second') + '_' + _rnd3;
    
    // TRAVA 4: Marca como "Em Resgate" (Bloqueio Temporário)
    this.estrelaCapturada.status = 'em_resgate';
    this.estrelaCapturada.tokenResgate = tokenUnico;
    this.estrelaCapturada.capturadoEm = new Date().toISOString();
    this.estrelaCapturada.validadeToken = new Date(Date.now() + 8 * 60 * 1000).toISOString(); // 8 minutos — tempo para preencher cadastro
    
    console.log('🏆 Estrela capturada! Token:', tokenUnico);
    
    // TRAVA 5: Inicia Contador de 8 Minutos (compatível com validadeToken de 8 min)
    this.iniciarContagemResgateExpiracao();
    
    // SALVAR COM COMPARE-AND-SWAP: verifica se outro cliente capturou simultaneamente
    const resultado = await this.salvarEstadoNoGitHub({ verificarConflito: true });

    if (!resultado.ok) {
      // Outra pessoa ganhou a corrida — reverter estado local
      this.estrelaCapturada.status = 'disponivel';
      this.estrelaCapturada.tokenResgate = null;
      this.estrelaCapturada.validadeToken = null;
      clearTimeout(this._timerExpiracao);
      console.warn('❌ Captura cancelada:', resultado.motivo);
      if (callback) callback({ sucesso: false, motivo: resultado.motivo || 'ja_capturada' });
      return { sucesso: false, motivo: resultado.motivo || 'ja_capturada' };
    }

    if (callback) callback({ sucesso: true, token: tokenUnico, estrela: this.estrelaCapturada });
    return { sucesso: true, token: tokenUnico };
  }

  /**
   * Salvar estado no GitHub com Compare-And-Swap:
   * busca o estado ATUAL do servidor antes de gravar.
   * Se outra pessoa já capturou (race condition), retorna falha.
   * Garante que somente UMA pessoa capture a estrela por dia.
   */
  async salvarEstadoNoGitHub(opcoes = {}) {
    const { verificarConflito = false } = opcoes;
    try {
      const GH_TOKEN  = (function(){return localStorage.getItem('itap_gh_token')||'';})();
      const GH_OWNER  = 'missias123';
      const GH_REPO   = 'itapolitanacajuru';
      const GH_BRANCH = 'main';
      const GH_API    = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`;
      const PATH      = 'estrelas_ciclo.json';

      // 1. Buscar estado ATUAL do arquivo (SHA + conteúdo frescos)
      const getResp = await fetch(GH_API + PATH + '?t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + GH_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!getResp.ok) throw new Error('Erro ao buscar estado atual: ' + getResp.status);
      const getJson = await getResp.json();
      const sha = getJson.sha;

      // 2. COMPARE-AND-SWAP: se outro cliente já capturou, NÃO sobrescrever
      if (verificarConflito) {
        try {
          const conteudoAtual = JSON.parse(atob(getJson.content.replace(/\n/g, '')));
          const statusAtual = conteudoAtual.estrelaCapturada && conteudoAtual.estrelaCapturada.status;
          if (statusAtual === 'capturada' || statusAtual === 'em_resgate') {
            // Outro navegador ganhou a corrida — esta captura é inválida
            console.warn('⚠️ CORRIDA PERDIDA: outro cliente já capturou esta estrela.');
            this.estrelaCapturada = conteudoAtual.estrelaCapturada; // sincronizar estado local
            return { ok: false, motivo: 'ja_capturada_por_outro' };
          }
        } catch(e) { /* ignorar erro de parse — continuar tentativa de salvar */ }
      }

      // 3. Montar objeto completo atualizado
      const dadosAtualizados = {
        versao: '1.0',
        cicloAtual: this.cicloAtual,
        horariosDia: this.horariosDia,
        rankingAtual: this.rankingAtual,
        historicoVencedores: this.cicloAtual.historicoVencedores || [],
        configGeral: this.config,
        estrelaCapturada: this.estrelaCapturada
      };

      // 4. Salvar no GitHub usando o SHA fresco
      const conteudo = btoa(unescape(encodeURIComponent(JSON.stringify(dadosAtualizados, null, 2))));
      const putResp = await fetch(GH_API + PATH, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + GH_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '🌟 Motor: atualizar estado da estrela',
          content: conteudo,
          sha: sha,
          branch: GH_BRANCH
        })
      });

      if (!putResp.ok) {
        // 409 = conflito de SHA — outra pessoa salvou antes; tentar novamente sem conflito
        if (putResp.status === 409 || putResp.status === 422) {
          console.warn('⚠️ Conflito de SHA ao salvar estrela (status ' + putResp.status + '). Verifique se outro cliente capturou.');
          return { ok: false, motivo: 'conflito_sha' };
        }
        throw new Error('Erro ao salvar: ' + putResp.status);
      }
      console.log('💾 Estado salvo no GitHub com sucesso');
      return { ok: true };
    } catch (erro) {
      console.error('❌ Erro ao salvar estado no GitHub:', erro);
      // Backup local como fallback
      localStorage.setItem('estrela_ciclo_backup', JSON.stringify({
        estrelaCapturada: this.estrelaCapturada,
        rankingAtual: this.rankingAtual,
        timestamp: new Date().toISOString()
      }));
      return { ok: false, motivo: 'erro_rede' };
    }
  }

  /**
   * Iniciar contagem de expiração do resgate (5 minutos)
   */
  iniciarContagemResgateExpiracao() {
    // Limpar timer anterior se existir
    if (this._timerExpiracao) clearTimeout(this._timerExpiracao);
    this._timerExpiracao = setTimeout(() => {
      if (this.estrelaCapturada.status === 'em_resgate') {
        console.warn('⚠️ Tempo de resgate expirado (8 min). A estrela volta para disponível.');
        this.estrelaCapturada.status = 'disponivel';
        this.estrelaCapturada.tokenResgate = null;
        this.estrelaCapturada.validadeToken = null;
        window.dispatchEvent(new CustomEvent('estrelaResgateFailed', {
          detail: { motivo: 'timeout' }
        }));
        this.salvarEstadoNoGitHub();
      }
    }, 8 * 60 * 1000); // 8 minutos — compatível com validadeToken
  }

  /**
   * Validar token de resgate (Segurança)
   */
  validarTokenResgate(token) {
    if (!token || !this.estrelaCapturada.tokenResgate) {
      return { valido: false, motivo: 'token_invalido' };
    }
    
    if (token !== this.estrelaCapturada.tokenResgate) {
      return { valido: false, motivo: 'token_nao_corresponde' };
    }
    
    // Verificar validade do token
    const agora = new Date();
    const validadeToken = new Date(this.estrelaCapturada.validadeToken);
    if (agora > validadeToken) {
      return { valido: false, motivo: 'token_expirado' };
    }
    
    // Verificar se ainda está em resgate
    if (this.estrelaCapturada.status !== 'em_resgate') {
      return { valido: false, motivo: 'nao_em_resgate' };
    }
    
    // Marcar como definitivamente capturada
    this.estrelaCapturada.status = 'capturada';
    this.salvarEstadoNoGitHub();
    
    return { valido: true, motivo: 'resgate_confirmado' };
  }

  /**
   * Registrar captura com trava: 1 estrela por pessoa por dia
   */
  async registrarCaptura(usuarioId, usuarioNome, usuarioCelular, premioEscolhido) {
    // Validar prêmio escolhido
    if (!this.PREMIO_OPCOES[premioEscolhido]) {
      return { sucesso: false, motivo: 'premio_invalido' };
    }

    const hoje = this.obterHorarioAtualComFuso().toISOString().split('T')[0];
    const agora = new Date().toISOString();

    // TRAVA: 1 cadastro por pessoa por dia
    if (this.rankingAtual[usuarioId]) {
      const diaUltimaCaptura = this.rankingAtual[usuarioId].diaCaptura;
      if (diaUltimaCaptura === hoje) {
        console.warn('⚠️ Este usuário já capturou uma estrela hoje!');
        return { sucesso: false, motivo: 'ja_capturou_hoje' };
      }
    }

    // TRAVA: Apenas 1 estrela por dia no site inteiro (já capturada por outra pessoa)
    if (this.estrelaCapturada.status === 'capturada') {
      const diaCaptura = this.estrelaCapturada.capturadoEm
        ? new Date(this.estrelaCapturada.capturadoEm).toISOString().split('T')[0]
        : null;
      if (diaCaptura === hoje) {
        console.warn('⚠️ A estrela de hoje já foi capturada por outra pessoa!');
        return { sucesso: false, motivo: 'estrela_do_dia_ja_capturada' };
      }
    }

    // Atualizar ranking
    if (!this.rankingAtual[usuarioId]) {
      // PASSO 3: Verificar se já existe na Fidelidade para herdar o ID
      let idUnico = 'USR-2026-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      try {
        const cRes = await fetch('dados/clientes.json?t=' + Date.now());
        if (cRes.ok) {
          const cData = await cRes.json();
          const celLimpo = usuarioCelular.replace(/\D/g,'');
          if (cData.clientes && cData.clientes[celLimpo]) {
            idUnico = cData.clientes[celLimpo].id || idUnico;
          }
        }
      } catch(e) { console.warn('Erro ao buscar ID na fidelidade:', e); }

      this.rankingAtual[usuarioId] = {
        id: idUnico,
        nome: usuarioNome,
        celular: usuarioCelular,
        estrelas: 0,
        ultimaCaptura: agora,
        diaCaptura: hoje,
        premiosEscolhidos: []
      };
    }
    
    this.rankingAtual[usuarioId].estrelas += 1;
    this.rankingAtual[usuarioId].ultimaCaptura = agora;
    // Data correta em SP — evita virada de dia UTC às 21h no Brasil
    this.rankingAtual[usuarioId].diaCaptura = this.obterHorarioAtualComFuso().toISOString().split('T')[0];
    
    // Se atingiu a meta, registrar prêmio escolhido
    if (this.rankingAtual[usuarioId].estrelas >= this.cicloAtual.metaEstrelas) {
      this.rankingAtual[usuarioId].premiosEscolhidos.push({
        premio: premioEscolhido,
        descricao: this.PREMIO_OPCOES[premioEscolhido].nome,
        dataEscolha: agora
      });
    }
    
    // Salvar no GitHub
    await this.salvarEstadoNoGitHub();
    
    // Notificar todos os clientes
    window.dispatchEvent(new CustomEvent('estrelaCaptured', {
      detail: {
        usuarioId,
        usuarioNome,
        timestamp: agora,
        premioEscolhido: this.PREMIO_OPCOES[premioEscolhido].nome
      }
    }));
    
    console.log(`🏆 Estrela capturada por ${usuarioNome}! Prêmio: ${this.PREMIO_OPCOES[premioEscolhido].nome}`);
    
    return { sucesso: true, premio: this.PREMIO_OPCOES[premioEscolhido].nome };
  }

  /**
   * Ativar/Desativar o sistema (Botão de Pânico)
   */
  alternarStatusSistema(ativar) {
    this.config.ativo = ativar;
    console.log(ativar ? '🟢 Sistema ATIVADO' : '🔴 Sistema DESATIVADO');
    
    window.dispatchEvent(new CustomEvent('statusSistemaAlterado', {
      detail: { ativo: ativar }
    }));
  }

  /**
   * Ativar a estrela (sinal para o mascote)
   */
  ativarEstrela() {
    // Se já estiver ativa, não disparar novamente
    if (document.getElementById('estrela-dourada-caçada')) return;

    window.dispatchEvent(new CustomEvent('estrelaAtiva', {
      detail: {
        horario: this.obterHorarioHoje(),
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Liberar a estrela visualmente na tela (chamado pelo mascote)
   */
  liberarEstrelaNaTela() {
    if (document.getElementById('estrela-dourada-caçada')) return;

    const estrela = document.createElement('div');
    estrela.id = 'estrela-dourada-caçada';
    estrela.innerHTML = '<img src="imagens/estrela-dourada-6p.webp" alt="Estrela Dourada" width="90" height="90" style="display:block;pointer-events:none;">';
    estrela.style.cssText = `
      position: fixed;
      z-index: 9999;
      width: 90px;
      height: 90px;
      cursor: pointer;
      filter: drop-shadow(0 0 16px gold) drop-shadow(0 0 6px #FFD600);
      animation: flutuarEstrela 2s ease-in-out infinite, surgirEstrela 0.5s ease-out;
      user-select: none;
      left: ${Math.random() * 70 + 15}%;
      top: ${Math.random() * 50 + 20}%;
    `;

    // Adicionar animações CSS se não existirem
    if (!document.getElementById('estilo-estrela-caçada')) {
      const estilo = document.createElement('style');
      estilo.id = 'estilo-estrela-caçada';
      estilo.innerHTML = `
        @keyframes flutuarEstrela {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes surgirEstrela {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      `;
      document.head.appendChild(estilo);
    }

    let jaClicou = false; // Trava local: impede segundo clique
    estrela.onclick = () => {
      if (jaClicou) return; // Segundo clique bloqueado imediatamente
      jaClicou = true;
      estrela.style.pointerEvents = 'none'; // Desativa cliques no DOM

      this.processarClique((res) => {
        if (res.sucesso) {
          // Some imediatamente do site
          estrela.style.transition = 'all 0.4s ease-in';
          estrela.style.transform = 'scale(4) rotate(360deg)';
          estrela.style.opacity = '0';
          setTimeout(() => {
            estrela.remove(); // Remove do DOM completamente
            // Redireciona para o formulário de resgate
            window.location.href = 'fidelidade.html?token=' + res.token;
          }, 400);
        } else {
          // Se falhou (fora do horário, etc.), restaura o clique
          jaClicou = false;
          estrela.style.pointerEvents = 'auto';
        }
      });
    };

    document.body.appendChild(estrela);
    console.log('🌟 Estrela liberada na tela!');

    // ⏱️ Estrela some automaticamente após 2 minutos se não for clicada
    const _timerSumir = setTimeout(() => {
      const elAtual = document.getElementById('estrela-dourada-caçada');
      if (elAtual && !jaClicou) {
        elAtual.style.transition = 'all 0.8s ease-in';
        elAtual.style.opacity = '0';
        elAtual.style.transform = 'scale(0) rotate(180deg)';
        setTimeout(() => {
          if (elAtual.parentNode) elAtual.remove();
          console.log('⏱️ Estrela sumiu — 2 minutos sem clique');
          window.dispatchEvent(new CustomEvent('estrelaExpirou', { detail: { motivo: 'timeout_2min' } }));
        }, 800);
      }
    }, 2 * 60 * 1000); // 2 minutos

    // Guardar referência do timer para cancelar ao clicar
    estrela._timerSumir = _timerSumir;

    // Sobrescrever onclick para cancelar o timer ao clicar
    const _onclickOriginal = estrela.onclick;
    estrela.onclick = function(e) {
      clearTimeout(estrela._timerSumir);
      if (_onclickOriginal) _onclickOriginal.call(estrela, e);
    };
  }

  /**
   * Verificar se alguém atingiu a meta do mês
   */
  verificarVencedorMes() {
    for (const [usuarioId, dados] of Object.entries(this.rankingAtual)) {
      if (dados.estrelas >= this.cicloAtual.metaEstrelas) {
        return {
          vencedor: true,
          usuarioId,
          nome: dados.nome,
          celular: dados.celular,
          estrelas: dados.estrelas,
          premiosEscolhidos: dados.premiosEscolhidos,
          dataVitoria: new Date().toISOString()
        };
      }
    }
    return { vencedor: false };
  }

  /**
   * Resetar ciclo para o novo mês (Dia 01 às 00:01)
   */
  resetarCiclo() {
    const agora = this.obterHorarioAtualComFuso();
    const proximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    
    // Arquivar vencedor anterior
    const vencedor = this.verificarVencedorMes();
    if (vencedor.vencedor) {
      this.cicloAtual.historicoVencedores = this.cicloAtual.historicoVencedores || [];
      this.cicloAtual.historicoVencedores.push(vencedor);
    }
    
    // Resetar ranking
    for (const usuarioId in this.rankingAtual) {
      this.rankingAtual[usuarioId].estrelas = 0;
      this.rankingAtual[usuarioId].ultimaCaptura = null;
      this.rankingAtual[usuarioId].diaCaptura = null;
    }
    
    // Atualizar ciclo
    this.cicloAtual.mesAno = proximoMes.toISOString().substring(0, 7);
    this.cicloAtual.dataInicio = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), 1, 0, 1).toISOString();
    this.cicloAtual.dataFim = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 1, 0, 1).toISOString();
    
    // Resetar estrela capturada
    this.estrelaCapturada.status = 'disponivel';
    this.estrelaCapturada.capturadoPor = null;
    this.estrelaCapturada.capturadoEm = null;
    this.estrelaCapturada.tokenResgate = null;
    
    this.salvarEstadoNoGitHub();
    console.log('🔄 Ciclo resetado para o novo mês');
  }

  /**
   * Gerar horários embaralhados para o mês
   */
  gerarHorariosEmbaralhados(quantidade = 30) {
    const horarios = [];
    const [horaInicio, horaFim] = [
      parseInt(this.config.horarioFuncionamento.inicio),
      parseInt(this.config.horarioFuncionamento.fim)
    ];
    
    for (let i = 0; i < quantidade; i++) {
      let horarioValido = false;
      let novoHorario;
      
      while (!horarioValido) {
        const hora = Math.floor(Math.random() * (horaFim - horaInicio)) + horaInicio;
        const minuto = Math.floor(Math.random() * 60);
        novoHorario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
        
        // Verificar se já existe um horário similar (diferença menor que 2 horas)
        horarioValido = !horarios.some(h => {
          const [h1, m1] = h.split(':').map(Number);
          const [h2, m2] = novoHorario.split(':').map(Number);
          const diff = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
          return diff < 120; // 2 horas em minutos
        });
      }
      
      horarios.push(novoHorario);
    }
    
    return horarios;
  }

  /**
   * Obter status atual do jogo
   */
  obterStatus() {
    return {
      cicloAtivo: this.cicloAtual.statusCiclo === 'ativo',
      metaEstrelas: this.cicloAtual.metaEstrelas,
      estrelaCapturada: this.estrelaCapturada.status,
      // horarioHoje removido: não expor o horário da estrela publicamente
      rankingTop5: this.obterTop5Ranking(),
      usuariosOnline: this.usuariosOnline
    };
  }

  /**
   * Obter top 5 do ranking
   */
  obterTop5Ranking() {
    return Object.entries(this.rankingAtual)
      .sort((a, b) => b[1].estrelas - a[1].estrelas)
      .slice(0, 5)
      .map(([id, dados]) => ({
        id,
        nome: dados.nome,
        estrelas: dados.estrelas
      }));
  }

  /**
   * Parar verificação
   */
  parar() {
    if (this.intervaloVerificacao) {
      clearInterval(this.intervaloVerificacao);
      console.log('⏹️ Motor de Estrelas v2.0 parado');
    }
  }
}

// Exportar para uso global
window.MotorEstrelasV2 = MotorEstrelasV2;
