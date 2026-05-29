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

export interface VariacaoProduto {
  id: string;
  produtoId: string;
  nome: string;
  estoque: number;
  preco?: number | null;
}

export interface AvaliacaoLoja {
  id: string;
  lojaId: string;
  usuarioId: string;
  pedidoId: string;
  nota: number;
  comentario?: string | null;
  criadoEm: string;
  usuario: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
}

export interface AvaliacaoEntregador {
  id: string;
  entregadorId: string;
  usuarioId: string;
  pedidoId: string;
  nota: number;
  criadoEm: string;
}

export interface AvaliacaoProduto {
  id: string;
  produtoId: string;
  usuarioId: string;
  pedidoId: string;
  nota: number;
  criadoEm: string;
}

export interface AvaliacaoProdutoInput {
  produtoId: string;
  nota: number;
  comentario?: string;
}

export interface AvaliacaoPedidoPayload {
  pedidoId: string;
  notaLoja: number;
  notaEntregador: number;
  comentarioEntregador?: string;
  avaliacoesProdutos: AvaliacaoProdutoInput[];
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
  tags?: string[];
  disponivel: boolean;
  estoque?: number;
  estoqueMinimo?: number;
  destaque?: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  variacoes?: VariacaoProduto[];
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
  variacaoId?: string;
  variacaoNome?: string;
  precoEfetivo?: number;
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
  lojaLogoUrl?: string | null;
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
  avaliado?: boolean;
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
  variacoes?: { id: string; nome: string; preco: number | null }[];
}

export interface PedidoCard {
  numero: number;
  id: string;
  loja: string;
  total: number;
  data: string;
  itens: string[];
  status: string;
}

export interface RastreioChat {
  pedidoId: string;
  destinoLat?: number | null;
  destinoLng?: number | null;
}

export interface RespostaAju {
  tipo?: 'resposta' | 'selecionarPedido' | 'confirmarPedido' | 'ticketCriado';
  texto: string;
  produtos?: ProdutoCard[];
  sugestoes?: string[];
  pedidos?: PedidoCard[];
  pedido?: PedidoCard;
  conversaId?: string;
  rastreio?: RastreioChat;
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
  // campos raw para edição
  ruaRaw?: string;
  numero?: string;
  bairroRaw?: string;
  cidade?: string;
  complemento?: string;
  // coordenadas geocodificadas
  lat?: number | null;
  lng?: number | null;
  geoSource?: string | null;
}

export type NivelEstoque = 'saudavel' | 'atencao' | 'critico' | 'zerado';

export type TipoMovimentacao =
  | 'entrada_manual'
  | 'saida_manual'
  | 'venda'
  | 'cancelamento'
  | 'devolucao'
  | 'ajuste_inventario'
  | 'reserva'
  | 'liberacao_reserva';

export interface MovimentacaoEstoque {
  id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  estoqueAntes: number;
  estoqueDepois: number;
  motivo?: string | null;
  pedidoId?: string | null;
  criadoEm: string;
  produto: { id: string; nome: string; imagemUrl?: string | null };
}

export interface EstoqueDashboard {
  totalProdutos: number;
  produtosAtivos: number;
  produtosSemEstoque: number;
  produtosBaixoEstoque: number;
  produtosAtencao: number;
  valorTotalEstoque: number;
  alertas: (Omit<Produto, 'imagem' | 'descricao' | 'categoria'> & { nivel: NivelEstoque })[];
  movimentacoesRecentes: MovimentacaoEstoque[];
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

// ─── Chat entre participantes do pedido ───────────────────────

export type TipoParticipanteChat = 'CONSUMER' | 'LOJISTA' | 'ENTREGADOR';

export interface ChatMensagemPedido {
  id: string;
  chatId: string;
  conteudo: string;
  remetenteType: TipoParticipanteChat;
  remetenteId: string;
  destinatarioType: TipoParticipanteChat;
  destinatarioId: string;
  remetenteNome?: string;
  lido: boolean;
  criadoEm: string;
}

export interface ChatPedidoInfo {
  id: string;
  pedidoId: string;
  status: 'ativo' | 'encerrado';
  participantes: TipoParticipanteChat[];
  mensagens: ChatMensagemPedido[];
  lojaNome?: string;
  lojaLogo?: string;
  entregadorNome?: string;
  consumidorNome?: string;
  ultimaMensagem?: ChatMensagemPedido;
  naoLidas?: number;
}

export interface ChatMensagemNovaPayload {
  chatId: string;
  pedidoId: string;
  mensagem: ChatMensagemPedido;
}
