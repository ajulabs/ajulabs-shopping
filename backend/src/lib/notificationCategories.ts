/**
 * Categorias de notificação suportadas pelo backend.
 *
 * Cada categoria pertence a um tipo de dono (consumidor/lojista/entregador).
 * Default: todas ligadas. Usuário pode optar por desligar via /v1/notification-preferences.
 *
 * Ao adicionar uma nova categoria:
 * 1. Adicione aqui no enum + array correspondente
 * 2. Passe o nome da categoria na função `notificar*` do pushSender via campo `categoria`
 * 3. (Opcional) Exponha na UI de preferências do app correspondente
 */

export type NotifCategoriaConsumer = 'pedido_status' | 'promocoes' | 'chat_pedido';

export type NotifCategoriaLojista = 'pedido_novo' | 'ticket_novo' | 'chat_pedido';

export type NotifCategoriaEntregador = 'corrida_oferta' | 'chat_pedido';

export type NotifCategoria =
  | NotifCategoriaConsumer
  | NotifCategoriaLojista
  | NotifCategoriaEntregador;

export const CATEGORIAS_CONSUMER: NotifCategoriaConsumer[] = [
  'pedido_status',
  'promocoes',
  'chat_pedido',
];
export const CATEGORIAS_LOJISTA: NotifCategoriaLojista[] = [
  'pedido_novo',
  'ticket_novo',
  'chat_pedido',
];
export const CATEGORIAS_ENTREGADOR: NotifCategoriaEntregador[] = ['corrida_oferta', 'chat_pedido'];

/**
 * Lista de categorias válidas para um tipo de dono. Útil para validação
 * em rotas e para popular a UI de preferências (sem hardcodar nas duas pontas).
 */
export function categoriasPara(tipo: 'consumidor' | 'lojista' | 'entregador'): NotifCategoria[] {
  switch (tipo) {
    case 'consumidor':
      return [...CATEGORIAS_CONSUMER];
    case 'lojista':
      return [...CATEGORIAS_LOJISTA];
    case 'entregador':
      return [...CATEGORIAS_ENTREGADOR];
  }
}

/**
 * Metadados de UI (label, descrição) — usado pela rota GET pra evitar
 * que o frontend hardcode strings.
 */
export const CATEGORIA_META: Record<NotifCategoria, { label: string; descricao: string }> = {
  pedido_status: {
    label: 'Status do pedido',
    descricao: 'Confirmação, preparação e entrega',
  },
  promocoes: {
    label: 'Promoções',
    descricao: 'Ofertas especiais das lojas parceiras',
  },
  pedido_novo: {
    label: 'Novo pedido',
    descricao: 'Aviso quando um cliente faz um pedido novo na sua loja',
  },
  ticket_novo: {
    label: 'Novo ticket de suporte',
    descricao: 'Aviso quando um cliente abre um ticket sobre um pedido',
  },
  corrida_oferta: {
    label: 'Nova corrida',
    descricao: 'Aviso quando uma entrega fica disponível na região',
  },
  chat_pedido: {
    label: 'Mensagens do chat',
    descricao: 'Aviso quando você recebe uma mensagem no chat de um pedido',
  },
};
