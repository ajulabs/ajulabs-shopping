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
  lojaLogoUrl?: string;
  lojaEndereco?: string;
  lojaBairro?: string;
  entregaEndereco?: string;
  entregaBairro?: string;
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

export interface VitrineAtualizadaPayload {
  lojaId: string;
  produtoId?: string;
  acao?: 'novo' | 'atualizado' | 'removido';
}

export interface ServerEvents {
  'localizacao:entregador': (payload: LocationPayload) => void;
  'pedido:status': (payload: StatusPayload) => void;
  'pedido:novo': (payload: PedidoNovoPayload) => void;
  'pedido:atualizado': (payload: { pedidoId: string; status: string }) => void;
  'corrida:oferta': (payload: CorridaOfertaPayload) => void;
  'corrida:aceita': (payload: { pedidoId: string; entregadorId: string }) => void;
  'corrida:cancelada': (payload: { pedidoId: string }) => void;
  /**
   * Emitido para a sala `entregador:<id>` quando o pedido ativo desse
   * entregador foi cancelado pelo lojista (ou por outro dispositivo do
   * próprio entregador). Permite o app sair da tela de corrida ativa
   * imediatamente, sem esperar bater num 404 no confirmarRetirada.
   */
  'pedido:cancelado': (payload: { pedidoId: string }) => void;
  'ticket:mensagem': (payload: TicketMensagemPayload) => void;
  'ticket:status': (payload: { ticketId: string; status: string }) => void;
  'ticket:novo': (payload: TicketNovoPayload) => void;
  'chat:mensagem:nova': (payload: ChatMensagemNovaPayload) => void;
  'produto:variacoes': (payload: ProdutoVariacaoPayload) => void;
  'estoque:atualizado': (payload: EstoqueAtualizadoPayload) => void;
  'estoque:alerta': (payload: EstoqueAlertaPayload) => void;
  'vitrine:atualizada': (payload: VitrineAtualizadaPayload) => void;
}

export interface ClientEvents {
  'usuario:join': (usuarioId: string) => void;
  'entregador:join': (entregadorId: string) => void;
  'lojista:join': (lojaId: string) => void;
  'produto:join': (produtoId: string) => void;
  'produto:leave': (produtoId: string) => void;
  'vitrine:join': (lojaId: string) => void;
  'vitrine:leave': (lojaId: string) => void;
  'localizacao:update': (payload: Omit<LocationPayload, 'pedidoId'> & { pedidoId: string }) => void;
}
