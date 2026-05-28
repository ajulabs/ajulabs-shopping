/**
 * Tracker de qual chat de pedido está atualmente aberto no app.
 *
 * Usado pelo listener de push pra suprimir notificações de chat quando
 * a tela do chat alvo está visível — o socket já entrega a mensagem em
 * tempo real, então duplicar como notificação seria ruim.
 *
 * A tela de chat chama `setCurrentChatPedido(pedidoId)` no mount e
 * `setCurrentChatPedido(null)` no unmount.
 */
let currentPedidoId: string | null = null;

export function setCurrentChatPedido(pedidoId: string | null): void {
  currentPedidoId = pedidoId;
}

export function getCurrentChatPedido(): string | null {
  return currentPedidoId;
}
