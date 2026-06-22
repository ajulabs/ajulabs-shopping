export { getSocket, disconnectSocket } from './client';
export type {
  ServerEvents,
  ClientEvents,
  LocationPayload,
  StatusPayload,
  TicketMensagemPayload,
  PedidoNovoPayload,
  CorridaOfertaPayload,
  TicketNovoPayload,
  ChatMensagemNovaPayload,
  ProdutoVariacaoPayload,
  EstoqueAtualizadoPayload,
  VitrineAtualizadaPayload,
} from './events';
export { useDeliveryTracking } from './hooks/useDeliveryTracking';
export { useLocationEmitter } from './hooks/useLocationEmitter';
export { usePedidosRealtime } from './hooks/usePedidosRealtime';
export { useTicketRealtime } from './hooks/useTicketRealtime';
export { useCorridasRealtime } from './hooks/useCorridasRealtime';
export { useCorridaAtivaRealtime } from './hooks/useCorridaAtivaRealtime';
export { usePedidoConsumerRealtime } from './hooks/usePedidoConsumerRealtime';
export { usePedidoLojistaRealtime } from './hooks/usePedidoLojistaRealtime';
export { useChatPedidoRealtime } from './hooks/useChatPedidoRealtime';
export { useProdutoEstoqueRealtime } from './hooks/useProdutoEstoqueRealtime';
export { useVitrineRealtime } from './hooks/useVitrineRealtime';
