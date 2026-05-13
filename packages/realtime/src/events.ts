import type { LocationPayload, StatusPayload } from '@ajulabs/types';

export type { LocationPayload, StatusPayload };

export interface ServerEvents {
  'localizacao:entregador': (payload: LocationPayload) => void;
  'pedido:status': (payload: StatusPayload) => void;
}

export interface ClientEvents {
  'usuario:join': (usuarioId: string) => void;
  'entregador:join': (entregadorId: string) => void;
  'lojista:join': (lojaId: string) => void;
  'localizacao:update': (payload: Omit<LocationPayload, 'pedidoId'> & { pedidoId: string }) => void;
}
