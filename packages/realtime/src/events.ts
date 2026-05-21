import type { LocationPayload, StatusPayload } from '@ajulabs/types';

export type { LocationPayload, StatusPayload };

export interface TicketMensagemPayload {
  id: string;
  ticketId: string;
  remetente: string;
  texto: string;
  criadoEm: string;
}

export interface PedidoNovoPayload {
  id: string;
  total: number;
  itens: { nome: string; quantidade: number }[];
  criadoEm: string;
}

export interface CorridaOfertaPayload {
  id: string;
  lojaId: string;
  lojaNome: string;
  total: number;
  taxaEntrega: number;
}

export interface TicketNovoPayload {
  id: string;
  protocolo: string;
  motivo: string;
  consumidorId: string;
}

export interface ServerEvents {
  'localizacao:entregador': (payload: LocationPayload) => void;
  'pedido:status': (payload: StatusPayload) => void;
  'pedido:novo': (payload: PedidoNovoPayload) => void;
  'pedido:atualizado': (payload: { pedidoId: string; status: string }) => void;
  'corrida:oferta': (payload: CorridaOfertaPayload) => void;
  'ticket:mensagem': (payload: TicketMensagemPayload) => void;
  'ticket:status': (payload: { ticketId: string; status: string }) => void;
  'ticket:novo': (payload: TicketNovoPayload) => void;
}

export interface ClientEvents {
  'usuario:join': (usuarioId: string) => void;
  'entregador:join': (entregadorId: string) => void;
  'lojista:join': (lojaId: string) => void;
  'localizacao:update': (payload: Omit<LocationPayload, 'pedidoId'> & { pedidoId: string }) => void;
}
