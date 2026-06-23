export const STAGES = ['to-store', 'at-store', 'to-customer', 'delivered'] as const;
export type Stage = (typeof STAGES)[number];

export interface Ride {
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

export type RideWithStage = Ride & { stage: Stage };
