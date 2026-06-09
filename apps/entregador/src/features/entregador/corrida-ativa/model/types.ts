export const STAGES = ['to-store', 'at-store', 'to-customer', 'delivered'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  'to-store': 'Indo ao estabelecimento',
  'at-store': 'Aguardando retirada',
  'to-customer': 'Indo ao cliente',
  delivered: 'Entrega concluída',
};

export interface ActiveRide {
  id: string;
  loja: {
    nome: string;
    logoUrl?: string;
    endereco: string;
    bairro: string;
    cep?: string;
    lat?: number;
    lng?: number;
  };
  cliente: {
    nome: string;
    telefone?: string;
    endereco: string;
    bairro: string;
    complemento?: string;
    cep?: string;
    lat?: number;
    lng?: number;
  };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}
