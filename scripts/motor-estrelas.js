/**
 * MOTOR DE SORTEIO - ITAMANDUÁ: A CORRIDA DAS ESTRELAS
 * Sistema de gamificação com caça diária de estrelas premiadas
 * Versão: 1.0 (TESTE)
 */

class MotorEstrelas {
  constructor() {
    this.config = null;
    this.cicloAtual = null;
    this.horarioHoje = null;
    this.estrelaCapturada = false;
    this.tokenResgate = null;
    this.intervaloVerificacao = null;
  }

  /**
   * Inicializar o motor com dados do servidor
   */
  async inicializar(urlArquivo = 'estrelas_ciclo.json') {
    try {
      const resposta = await fetch(urlArquivo);
      const dados = await resposta.json();
      
      this.config = dados.configGeral;
      this.cicloAtual = dados.cicloAtual;
      this.horariosDia = dados.horariosDia;
      this.rankingAtual = dados.rankingAtual;
    this.estrelaCapturada = dados.estrelaCapturada;
    this.usuariosOnline = dados.usuariosOnline || 0;
    this.ultimoCliqueEm = null;
    this.tokenResgate = null;
    
    console.log('✅ Motor de Estrelas inicializado com sucesso');
    this.iniciarVerificacao();
    this.iniciarHeartbeat();
    return true;
  } catch (erro) {
      console.error('❌ Erro ao inicializar motor:', erro);
      return false;
    }
  }

  /**
   * Obter o horário da estrela para hoje
   */
  obterHorarioHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    return this.horariosDia[hoje]?.horario || null;
  }

  /**
   * Verificar se é o horário exato da estrela
   */
  ehHorarioDaEstrela() {
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, '0');
    const minutoAtual = String(agora.getMinutes()).padStart(2, '0');
    const horarioAtual = `${horaAtual}:${minutoAtual}`;
    
    const horarioEstrela = this.obterHorarioHoje();
    
    if (!horarioEstrela) return false;
    
    // Verificar se está no minuto exato (com margem de 1 minuto)
    const [horaEstrela, minutoEstrela] = horarioEstrela.split(':');
    const diferenca = Math.abs(
      (parseInt(horaAtual) * 60 + parseInt(minutoAtual)) -
      (parseInt(horaEstrela) * 60 + parseInt(minutoEstrela))
    );
    
    return diferenca <= 1 && !this.estrelaCapturada.status;
  }

  /**
   * Iniciar verificação contínua do horário
   */
  iniciarVerificacao() {
    this.intervaloVerificacao = setInterval(() => {
      if (this.ehHorarioDaEstrela()) {
        console.log('🌟 É HORA DA ESTRELA! Ativando...');
        this.ativarEstrela();
      }
    }, this.config.tempoSincronizacao);
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
   * Processar clique na estrela com trava de concorrência
   */
  async processarClique(callback) {
    // TRAVA 1: Verificação Local (Primeira Defesa)
    if (this.estrelaCapturada.status === 'usado') {
      console.warn('⚠️ A estrela já foi capturada!');
      return { sucesso: false, motivo: 'ja_capturada' };
    }

    // TRAVA 2: Verificação de Timestamp (Evita Cliques Duplos)
    const agora = Date.now();
    if (this.ultimoCliqueEm && (agora - this.ultimoCliqueEm) < 500) {
      console.warn('⚠️ Clique duplo detectado! Aguarde 500ms.');
      return { sucesso: false, motivo: 'clique_duplo' };
    }
    this.ultimoCliqueEm = agora;

    // TRAVA 3: Gera Token Único de Sessão
    const tokenUnico = 'EST_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    
    // TRAVA 4: Marca como "Em Resgate" (Bloqueio Temporário)
    this.estrelaCapturada.status = 'em_resgate';
    this.estrelaCapturada.tokenResgate = tokenUnico;
    this.estrelaCapturada.capturadoEm = new Date().toISOString();
    
    console.log('🏆 Estrela capturada! Token:', tokenUnico);
    
    // TRAVA 5: Inicia Contador de 5 Minutos (Se não resgatar, volta)
    this.iniciarContagemResgateExpiracao();
    
    if (callback) callback({ sucesso: true, token: tokenUnico, estrela: this.estrelaCapturada });
    return { sucesso: true, token: tokenUnico };
  }

  /**
   * Iniciar contagem de expiração do resgate (5 minutos)
   */
  iniciarContagemResgateExpiracao() {
    setTimeout(() => {
      if (this.estrelaCapturada.status === 'em_resgate') {
        console.warn('⚠️ Tempo de resgate expirado! A estrela volta para o pool.');
        this.estrelaCapturada.status = 'disponivel';
        this.estrelaCapturada.tokenResgate = null;
        
        // Disparar evento de expiração
        window.dispatchEvent(new CustomEvent('estrelaResgateFailed', {
          detail: { motivo: 'timeout' }
        }));
      }
    }, 5 * 60 * 1000); // 5 minutos
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
    
    // Verificar se ainda está em resgate
    if (this.estrelaCapturada.status !== 'em_resgate') {
      return { valido: false, motivo: 'nao_em_resgate' };
    }
    
    // Marcar como definitivamente usada
    this.estrelaCapturada.status = 'usado';
    return { valido: true, motivo: 'resgate_confirmado' };
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
    window.dispatchEvent(new CustomEvent('estrelaAtiva', {
      detail: {
        horario: this.obterHorarioHoje(),
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Registrar captura da estrela
   */
  async capturarEstrela(usuarioId, usuarioNome, usuarioCelular) {
    const agora = new Date().toISOString();
    
    // Gerar token de resgate (válido por 5 minutos)
    this.tokenResgate = this.gerarTokenResgate();
    
    // Atualizar status
    this.estrelaCapturada.status = true;
    this.estrelaCapturada.capturadoPor = usuarioId;
    this.estrelaCapturada.capturadoEm = agora;
    this.estrelaCapturada.tokenResgate = this.tokenResgate;
    this.estrelaCapturada.validadeToken = new Date(Date.now() + 300000).toISOString();
    
    // Atualizar ranking
    if (!this.rankingAtual[usuarioId]) {
      this.rankingAtual[usuarioId] = {
        nome: usuarioNome,
        celular: usuarioCelular,
        estrelas: 0,
        ultimaCaptura: agora,
        diaCaptura: new Date().toISOString().split('T')[0]
      };
    }
    
    this.rankingAtual[usuarioId].estrelas += 1;
    this.rankingAtual[usuarioId].ultimaCaptura = agora;
    this.rankingAtual[usuarioId].diaCaptura = new Date().toISOString().split('T')[0];
    
    // Notificar todos os clientes
    window.dispatchEvent(new CustomEvent('estrelaCaptured', {
      detail: {
        usuarioId,
        usuarioNome,
        timestamp: agora,
        tokenResgate: this.tokenResgate
      }
    }));
    
    console.log(`🏆 Estrela capturada por ${usuarioNome}!`);
    return this.tokenResgate;
  }

  /**
   * Gerar token de resgate único
   */
  gerarTokenResgate() {
    return 'EST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Validar token de resgate
   */
  validarTokenResgate(token) {
    if (!this.estrelaCapturada.tokenResgate) return false;
    if (this.estrelaCapturada.tokenResgate !== token) return false;
    
    const agora = new Date();
    const validadeToken = new Date(this.estrelaCapturada.validadeToken);
    
    if (agora > validadeToken) {
      console.log('⏰ Token expirado!');
      return false;
    }
    
    return true;
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
          dataVitoria: new Date().toISOString()
        };
      }
    }
    return { vencedor: false };
  }

  /**
   * Resetar ciclo para o novo mês
   */
  resetarCiclo() {
    const agora = new Date();
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
    this.estrelaCapturada.status = false;
    this.estrelaCapturada.capturadoPor = null;
    this.estrelaCapturada.capturadoEm = null;
    this.estrelaCapturada.tokenResgate = null;
    
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
      horarioHoje: this.obterHorarioHoje(),
      rankingTop5: this.obterTop5Ranking()
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
      console.log('⏹️ Motor de Estrelas parado');
    }
  }
}

// Exportar para uso global
window.MotorEstrelas = MotorEstrelas;
