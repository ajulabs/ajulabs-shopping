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
  comentarioLoja?: string;
  tagsLoja?: string[];
  notaEntregador: number;
  comentarioEntregador?: string;
  tagsEntregador?: string[];
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

export type CancelamentoPor = 'consumidor' | 'lojista' | 'admin';

export type MotivoCancelamentoConsumidor =
  | 'quero_mudar_pedido'
  | 'demora_excessiva'
  | 'erro_no_pedido'
  | 'outro';

export type MotivoCancelamentoLojista =
  | 'item_esgotado'
  | 'problema_cozinha'
  | 'horario_encerramento'
  | 'outro';

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
  canceladoPor?: CancelamentoPor | null;
  motivoCancelamento?: string | null;
  penalizouLojista?: boolean;
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
  tipo?: 'resposta' | 'selecionarPedido' | 'confirmarPedido' | 'ticketCriado' | 'ticketDuplicado';
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
  variacaoNome?: string | null;
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

export type PapelColaborador = 'admin' | 'gerente' | 'funcionario';
export type StatusSolicitacaoPreco = 'pendente' | 'aprovado' | 'rejeitado';

export interface Colaborador {
  id: string;
  lojaId: string;
  nome: string;
  email: string;
  papel: PapelColaborador;
  ativo: boolean;
  criadoEm: string;
}

export interface SolicitacaoPreco {
  id: string;
  produtoId: string;
  lojaId: string;
  solicitanteId: string;
  solicitante: { id: string; nome: string; email: string };
  produto: { id: string; nome: string; imagemUrl?: string | null };
  precoAtual: number;
  precoSolicitado: number;
  justificativa: string;
  status: StatusSolicitacaoPreco;
  revisadoPorId?: string | null;
  revisadoPorTipo?: string | null;
  revisadoPorNome?: string | null;
  revisadoEm?: string | null;
  notaRevisao?: string | null;
  criadoEm: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  lojaId: string;
  actorId: string;
  actorTipo: string;
  actorNome: string;
  actorPapel: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: Record<string, { before: unknown; after: unknown }> | null;
  ipAddress?: string | null;
}

// ========================================
// AVALIAÇÕES — Tags estruturadas
// ========================================

export interface TagAvaliacao {
  id: string;
  label: string;
  /**
   * 'positiva' — sugerida apenas em notas 4-5
   * 'negativa' — sugerida apenas em notas 1-3
   */
  sentimento: 'positiva' | 'negativa';
}

/** Tags marcáveis pelo consumidor ao avaliar uma loja. */
export const TAGS_AVALIACAO_LOJA: TagAvaliacao[] = [
  { id: 'embalagem-caprichada', label: 'Embalagem caprichada', sentimento: 'positiva' },
  { id: 'produto-perfeito', label: 'Produto chegou perfeito', sentimento: 'positiva' },
  { id: 'atendimento-atencioso', label: 'Atendimento atencioso', sentimento: 'positiva' },
  { id: 'cumpriu-prometido', label: 'Cumpriu o prometido', sentimento: 'positiva' },
  { id: 'preparo-demorado', label: 'Demorou pra preparar', sentimento: 'negativa' },
  { id: 'produto-divergente', label: 'Produto diferente do anúncio', sentimento: 'negativa' },
  { id: 'embalagem-danificada', label: 'Embalagem danificada', sentimento: 'negativa' },
];

/** Tags marcáveis pelo consumidor ao avaliar um entregador. */
export const TAGS_AVALIACAO_ENTREGADOR: TagAvaliacao[] = [
  { id: 'entregador-educado', label: 'Entregador educado', sentimento: 'positiva' },
  { id: 'pedido-rapido', label: 'Pedido rápido', sentimento: 'positiva' },
  { id: 'cuidadoso', label: 'Cuidadoso com a entrega', sentimento: 'positiva' },
  { id: 'comunicativo', label: 'Comunicativo', sentimento: 'positiva' },
  { id: 'entrega-demorada', label: 'Demorado', sentimento: 'negativa' },
  { id: 'sem-resposta-chat', label: 'Não respondeu o chat', sentimento: 'negativa' },
  { id: 'dificil-encontrar', label: 'Difícil de encontrar', sentimento: 'negativa' },
];

/** Lookup auxiliar para validações e renderização. */
export const TAGS_LOJA_IDS = new Set(TAGS_AVALIACAO_LOJA.map((t) => t.id));
export const TAGS_ENTREGADOR_IDS = new Set(TAGS_AVALIACAO_ENTREGADOR.map((t) => t.id));

export interface TagAgregada {
  tag: TagAvaliacao;
  count: number;
}

export interface DashboardAvaliacoes {
  media: number;
  total: number;
  /** Distribuição por nota: { '5': 42, '4': 18, ... } */
  distribuicao: Record<'1' | '2' | '3' | '4' | '5', number>;
  /** Tags positivas mais frequentes (top 3, ordenadas desc por count) */
  pontosFortes: TagAgregada[];
  /** Tags negativas mais frequentes — só aparecem se count >= 3 (evita expor casos isolados) */
  pontosAMelhorar: TagAgregada[];
  /** Lista cronológica reversa de avaliações com nome do autor */
  avaliacoes: AvaliacaoDetalhada[];
}

export interface AvaliacaoDetalhada {
  id: string;
  nota: number;
  comentario?: string | null;
  tags: string[];
  criadoEm: string;
  usuario: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
}
