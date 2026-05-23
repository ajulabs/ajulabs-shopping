import { enviarPushParaUsuario } from './pushSender';
import { logger } from './logger';
import { prisma } from '../utils/prisma';

/**
 * Mapeia status do pedido para mensagem amigável no push.
 * Status 'aguardando' não é notificado (é o estado inicial, quando o
 * próprio consumidor acabou de criar o pedido).
 */
const COPY_STATUS_PEDIDO: Record<string, { title: string; bodyTpl: (lojaNome: string) => string }> = {
  confirmado: {
    title: 'Pedido confirmado',
    bodyTpl: loja => `${loja} aceitou seu pedido e já vai começar a preparar.`,
  },
  preparando: {
    title: 'Preparando seu pedido',
    bodyTpl: loja => `${loja} está preparando seu pedido. Já já fica pronto!`,
  },
  pronto: {
    title: 'Pedido pronto!',
    bodyTpl: loja => `Seu pedido na ${loja} está pronto e aguardando entregador.`,
  },
  saiu_entrega: {
    title: 'Saiu para entrega 🛵',
    bodyTpl: loja => `Seu pedido da ${loja} já está a caminho!`,
  },
  entregue: {
    title: 'Pedido entregue 🎉',
    bodyTpl: loja => `Seu pedido da ${loja} foi entregue. Bom proveito!`,
  },
  cancelado: {
    title: 'Pedido cancelado',
    bodyTpl: loja => `Seu pedido na ${loja} foi cancelado.`,
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

    await enviarPushParaUsuario(consumidorId, {
      title: copy.title,
      body: copy.bodyTpl(lojaNome),
      data: { type: 'pedido:status', pedidoId, status },
    });
  } catch (err) {
    logger.error({ err, consumidorId, pedidoId, status }, 'falha ao notificar status pedido');
  }
}
