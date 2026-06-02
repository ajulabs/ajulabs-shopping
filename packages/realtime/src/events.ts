import type {
  LocationPayload,
  StatusPayload,
  ChatMensagemNovaPayload,
  VariacaoProduto,
} from '@ajulabs/types';

export type { LocationPayload, StatusPayload, ChatMensagemNovaPayload };

export interface TicketMensagemPayload {
  id: string;
  ticketId: string;
  remetente: string;
  remetenteNome?: string;
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
  consumidorNome?: string;
}

export interface ProdutoVariacaoPayload {
  produtoId: string;
  variacoes: VariacaoProduto[];
}

export interface EstoqueAtualizadoPayload {
  produtoId: string;
  produtoNome: string;
  estoque: number;
  estoqueMinimo: number;
}

export interface EstoqueAlertaPayload {
  produtoId: string;
  produtoNome: string;
  estoque: number;
  estoqueMinimo: number;
  nivel: 'atencao' | 'critico' | 'zerado';
}

export interface ServerEvents {
  'localizacao:entregador': (payload: LocationPayload) => void;
  'pedido:status': (payload: StatusPayload) => void;
  'pedido:novo': (payload: PedidoNovoPayload) => void;
  'pedido:atualizado': (payload: { pedidoId: string; status: string }) => void;
  'corrida:oferta': (payload: CorridaOfertaPayload) => void;
  'corrida:aceita': (payload: { pedidoId: string; entregadorId: string }) => void;
  'ticket:mensagem': (payload: TicketMensagemPayload) => void;
  'ticket:status': (payload: { ticketId: string; status: string }) => void;
  'ticket:novo': (payload: TicketNovoPayload) => void;
  'chat:mensagem:nova': (payload: ChatMensagemNovaPayload) => void;
  'produto:variacoes': (payload: ProdutoVariacaoPayload) => void;
  'estoque:atualizado': (payload: EstoqueAtualizadoPayload) => void;
  'estoque:alerta': (payload: EstoqueAlertaPayload) => void;
}

export interface ClientEvents {
  'usuario:join': (usuarioId: string) => void;
  'entregador:join': (entregadorId: string) => void;
  'lojista:join': (lojaId: string) => void;
  'localizacao:update': (payload: Omit<LocationPayload, 'pedidoId'> & { pedidoId: string }) => void;
}
