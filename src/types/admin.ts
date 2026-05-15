export type StatusEncomenda =
  | 'novo'
  | 'confirmado'
  | 'em_producao'
  | 'em_rota'
  | 'entregue'
  | 'cancelado';

export interface EventoTimeline {
  id: string;
  status: StatusEncomenda;
  descricao: string;
  criadoEm: string;
}

export interface Encomenda {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  status: StatusEncomenda;
  itens: string[];
  observacao?: string;
  criadoEm: string;
  atualizadoEm: string;
  timeline: EventoTimeline[];
}

export interface MovimentoPontos {
  id: string;
  tipo: 'credito' | 'debito';
  pontos: number;
  motivo: string;
  criadoEm: string;
}

export interface CodigoFidelidade {
  codigo: string;
  pontosNecessarios: number;
  ativo: boolean;
}

export interface ContaFidelidade {
  clienteId: string;
  clienteNome: string;
  telefone: string;
  pontos: number;
  historico: MovimentoPontos[];
  codigos: CodigoFidelidade[];
  atualizadoEm: string;
}

export interface InconsistenciaAuditoria {
  id: string;
  tipo: 'pedido_sem_timeline' | 'pontos_negativos' | 'status_invalido';
  severidade: 'baixa' | 'media' | 'alta';
  descricao: string;
  resolvido: boolean;
  criadoEm: string;
  resolvidoEm?: string;
}

export interface Auditoria {
  ultimaExecucao: string;
  inconsistencias: InconsistenciaAuditoria[];
}
