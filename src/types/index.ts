export type Role = 'operador' | 'mecanico';

export interface User {
  id: string;
  login: string;
  nome: string;
  role: Role;
  cargo: string;
  setor?: string;
}

export type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export type TipoFalha = 
  | 'mecanica' 
  | 'eletrica' 
  | 'hidraulica' 
  | 'pneumatica' 
  | 'lubrificacao' 
  | 'instrumentacao' 
  | 'outro';

export type StatusChamado = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';

export interface PecaUtilizada {
  id: string;
  nome: string;
  codigo?: string;
  quantidade: number;
  unidade?: string;
}

export interface Chamado {
  id: string;
  numero: string;
  titulo: string;
  equipamento: string;
  tag_equipamento: string;
  setor: string;
  prioridade: Prioridade;
  tipo_falha: TipoFalha;
  parou_producao: boolean;
  descricao_problema: string;
  foto_url?: string;
  status: StatusChamado;
  
  // Informações de abertura (Operador)
  criado_por: string; // login do operador
  nome_operador: string;
  data_abertura: string; // ISO date
  
  // Informações de atendimento (Mecânico)
  assumido_por?: string; // login do mecânico
  nome_mecanico?: string;
  data_inicio_atendimento?: string; // ISO date
  
  // Informações de encerramento (Mecânico)
  descricao_servico?: string; // o que foi feito
  causa_raiz?: string;
  pecas_utilizadas?: PecaUtilizada[];
  tempo_gasto_minutos?: number;
  condicao_final?: 'operacional' | 'em_observacao' | 'requer_revisao_futura';
  data_encerramento?: string; // ISO date
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
