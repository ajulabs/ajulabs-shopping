import {
  enviarPushParaConsumidor,
  enviarPushParaLojista,
  enviarPushParaEntregador,
} from './pushSender';
import { logger } from './logger';
import { prisma } from '../utils/prisma';

/**
 * Mapeia status do pedido para mensagem amigável no push.
 * Status 'aguardando' não é notificado (é o estado inicial, quando o
 * próprio consumidor acabou de criar o pedido).
 */
const COPY_STATUS_PEDIDO: Record<string, { title: string; bodyTpl: (lojaNome: string) => string }> =
  {
    confirmado: {
      title: 'Pedido confirmado',
      bodyTpl: (loja) => `${loja} aceitou seu pedido e já vai começar a preparar.`,
    },
    preparando: {
      title: 'Preparando seu pedido',
      bodyTpl: (loja) => `${loja} está preparando seu pedido. Já já fica pronto!`,
    },
    pronto: {
      title: 'Pedido pronto!',
      bodyTpl: (loja) => `Seu pedido na ${loja} está pronto e aguardando entregador.`,
    },
    saiu_entrega: {
      title: 'Saiu para entrega 🛵',
      bodyTpl: (loja) => `Seu pedido da ${loja} já está a caminho!`,
    },
    entregue: {
      title: 'Pedido entregue 🎉',
      bodyTpl: (loja) => `Seu pedido da ${loja} foi entregue. Bom proveito!`,
    },
    cancelado: {
      title: 'Pedido cancelado',
      bodyTpl: (loja) => `Seu pedido na ${loja} foi cancelado.`,
    },
  };

/**
 * Envia push ao consumidor sobre mudança de status do pedido.
 * Best-effort: nunca lança — falha de push não pode quebrar o fluxo de pedido.
 */
export async function notificarStatusPedido(
  consumidorId: string,
  pedidoId: string,
  status: string,
): Promise<void> {
  const copy = COPY_STATUS_PEDIDO[status];
  if (!copy) return;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { loja: { select: { nome: true } } },
    });
    const lojaNome = pedido?.loja?.nome ?? 'sua loja';

    await enviarPushParaConsumidor(consumidorId, {
      title: copy.title,
      body: copy.bodyTpl(lojaNome),
      data: { type: 'pedido:status', pedidoId, status },
      categoria: 'pedido_status',
    });
  } catch (err) {
    logger.error({ err, consumidorId, pedidoId, status }, 'falha ao notificar status pedido');
  }
}

interface PedidoNovoPayload {
  total: number;
  itens: Array<{ nome: string; quantidade: number }>;
}

/**
 * Avisa o lojista dono da loja sobre um novo pedido.
 * Best-effort: nunca lança.
 */
export async function notificarPedidoNovo(
  lojaId: string,
  pedidoId: string,
  payload: PedidoNovoPayload,
): Promise<void> {
  try {
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: { nome: true, lojistaId: true },
    });
    if (!loja) return;

    const totalItens = payload.itens.reduce((sum, i) => sum + i.quantidade, 0);
    const totalFmt = payload.total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    await enviarPushParaLojista(loja.lojistaId, {
      title: 'Novo pedido! 🛒',
      body: `${totalItens} ${totalItens === 1 ? 'item' : 'itens'} • ${totalFmt}`,
      data: { type: 'pedido:novo', pedidoId, lojaId },
      categoria: 'pedido_novo',
    });
  } catch (err) {
    logger.error({ err, lojaId, pedidoId }, 'falha ao notificar pedido novo');
  }
}

/**
 * Avisa o lojista dono da loja sobre um novo ticket de suporte aberto.
 * Best-effort: nunca lança.
 */
export async function notificarTicketNovo(
  lojaId: string,
  ticketId: string,
  motivo: string,
): Promise<void> {
  try {
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: { lojistaId: true },
    });
    if (!loja) return;

    await enviarPushParaLojista(loja.lojistaId, {
      title: 'Novo ticket de suporte',
      body: motivo.length > 100 ? `${motivo.slice(0, 97)}...` : motivo,
      data: { type: 'ticket:novo', ticketId, lojaId },
      categoria: 'ticket_novo',
    });
  } catch (err) {
    logger.error({ err, lojaId, ticketId }, 'falha ao notificar ticket novo');
  }
}

interface CorridaOfertaPayload {
  pedidoId: string;
  lojaNome: string;
  taxaEntrega: number;
}

/**
 * Avisa todos os entregadores online sobre uma nova corrida disponível.
 *
 * O socket realtime já notifica entregadores conectados. O push complementa
 * para quem está com o app fechado mas continua online (o que define
 * "disponível" hoje).
 *
 * Best-effort: nunca lança.
 */
export async function notificarCorridaOferta(payload: CorridaOfertaPayload): Promise<void> {
  try {
    const entregadores = await prisma.entregador.findMany({
      where: { online: true, statusConta: 'ativo' },
      select: { id: true },
    });
    if (entregadores.length === 0) return;

    const taxaFmt = payload.taxaEntrega.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const title = 'Nova corrida disponível 🛵';
    const body = `${payload.lojaNome} • Você recebe ${taxaFmt}`;

    await Promise.all(
      entregadores.map((e: { id: string }) =>
        enviarPushParaEntregador(e.id, {
          title,
          body,
          data: { type: 'corrida:oferta', pedidoId: payload.pedidoId },
          categoria: 'corrida_oferta',
          // Canal Android custom: som alto, ignora silencioso, full-screen intent.
          // Configurado no app em src/tasks/notificationChannels.ts.
          channelId: 'ride-alerts',
          priority: 'high',
        }),
      ),
    );
  } catch (err) {
    logger.error({ err, pedidoId: payload.pedidoId }, 'falha ao notificar corrida oferta');
  }
}

interface ChatMensagemPayload {
  destinatarioType: 'CONSUMER' | 'LOJISTA' | 'ENTREGADOR';
  destinatarioId: string;
  remetenteNome: string;
  conteudo: string;
  pedidoId: string;
  chatId: string;
}

/**
 * Notifica o destinatário de uma mensagem nova no chat de pedido.
 *
 * O app verifica `data.type === 'chat:mensagem'` e navega pra tela do
 * chat correspondente quando o usuário toca na notificação. O próprio
 * app também é responsável por descartar a notificação caso o chat já
 * esteja aberto (evita duplicar com a entrega em tempo real via socket).
 *
 * Best-effort: nunca lança.
 */
/**
 * Notifica o consumidor quando o lojista atualiza o status ou envia mensagem no ticket.
 * Best-effort: nunca lança.
 */
export async function notificarAtualizacaoTicket(
  consumidorId: string,
  protocolo: string,
  tipo: 'mensagem' | 'status',
  detalhe: string,
): Promise<void> {
  try {
    const title =
      tipo === 'mensagem' ? `Resposta no ticket ${protocolo}` : `Ticket ${protocolo} atualizado`;
    const body =
      tipo === 'mensagem'
        ? 'A loja respondeu sua reclamação. Toque para ver.'
        : `Status atualizado para: ${detalhe}`;
    await enviarPushParaConsumidor(consumidorId, {
      title,
      body,
      data: { type: 'ticket:update', protocolo },
      categoria: 'ticket_update',
    });
  } catch (err) {
    logger.error({ err, consumidorId, protocolo }, 'falha ao notificar atualização de ticket');
  }
}

export async function notificarChatMensagem(payload: ChatMensagemPayload): Promise<void> {
  try {
    const title = `Mensagem de ${payload.remetenteNome}`;
    // Limita preview do conteúdo pra notificação ficar legível.
    const body =
      payload.conteudo.length > 80 ? `${payload.conteudo.slice(0, 77)}...` : payload.conteudo;

    const data = {
      type: 'chat:mensagem',
      pedidoId: payload.pedidoId,
      chatId: payload.chatId,
    };

    const pushPayload = {
      title,
      body,
      data,
      categoria: 'chat_pedido',
      priority: 'high' as const,
    };

    if (payload.destinatarioType === 'CONSUMER') {
      await enviarPushParaConsumidor(payload.destinatarioId, pushPayload);
    } else if (payload.destinatarioType === 'LOJISTA') {
      await enviarPushParaLojista(payload.destinatarioId, pushPayload);
    } else {
      await enviarPushParaEntregador(payload.destinatarioId, pushPayload);
    }
  } catch (err) {
    logger.error(
      { err, pedidoId: payload.pedidoId, chatId: payload.chatId },
      'falha ao notificar chat mensagem',
    );
  }
}
