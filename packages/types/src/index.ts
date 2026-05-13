// ─── Entidades base ───────────────────────────────────────────

export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  complemento?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: Endereco;
  avatar?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
}

export interface Produto {
  id: string;
  lojaId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  imagens?: string[];
  categoria: string;
  disponivel: boolean;
  estoque?: number;
  destaque?: boolean;
}

export interface Loja {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagem: string;
  logo?: string;
  endereco: Endereco;
  avaliacao: number;
  totalAvaliacoes: number;
  tempoEntregaMin: number;
  tempoEntregaMax: number;
  taxaEntrega: number;
  aberta: boolean;
  destaque?: boolean;
}

// ─── Carrinho ─────────────────────────────────────────────────

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Carrinho {
  lojaId: string | null;
  itens: ItemCarrinho[];
}

// ─── Pedido ───────────────────────────────────────────────────

export type StatusPedido =
  | 'aguardando'
  | 'confirmado'
  | 'preparando'
  | 'pronto'
  | 'saiu_entrega'
  | 'entregue'
  | 'cancelado';

export interface ItemPedido {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
}

export interface EntregadorResumo {
  id: string;
  nome: string;
  fotoUrl?: string | null;
  tipoTransporte: string;
}

export interface Pedido {
  id: string;
  lojaId: string;
  lojaNome: string;
  consumidorId: string;
  itens: ItemPedido[];
  status: StatusPedido;
  enderecoEntrega: Endereco;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  criadoEm: string;
  atualizadoEm: string;
  estimativaEntrega?: string;
  codigoEntrega?: string;
  entregador?: EntregadorResumo | null;
}

// ─── Chat ─────────────────────────────────────────────────────

export type RemetenteMensagem = 'usuario' | 'aju';

export interface ProdutoCard {
  id: string;
  lojaId: string;
  nome: string;
  loja: string;
  preco: number;
  precoOriginal?: number;
  tempoEntrega: string;
  imagemUrl: string;
}

export interface RespostaAju {
  texto: string;
  produtos?: ProdutoCard[];
  sugestoes?: string[];
}


export interface MensagemChat {
  id: string;
  remetente: RemetenteMensagem;
  conteudo: string;
  resposta?: RespostaAju;
  criadaEm: string;
}

// ─── Navegação ────────────────────────────────────────────────

export type TabConsumer = 'chat' | 'vitrines' | 'carrinho' | 'pedidos' | 'perfil';
export type TabLojista = 'pedidos' | 'produtos' | 'dashboard';

// ─── Realtime / Tracking ──────────────────────────────────────

export interface LocationPayload {
  pedidoId: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
  ts?: number;
}

export interface StatusPayload {
  pedidoId: string;
  status: StatusPedido;
}

export interface NavStep {
  instruction: string;
  distance: number;
  duration: number;
  modifier?: string;
  location: { lat: number; lng: number };
}

// ─── Checkout ─────────────────────────────────────────────────

export interface EnderecoSalvo {
  id: string;
  apelido: string;
  rua: string;
  bairro: string;
  cep: string;
  padrao: boolean;
}

export type MetodoPagamento = 'pix' | 'cartao';

export interface ResumoCheckout {
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  metodoPagamento: MetodoPagamento;
  enderecoId: string;
}