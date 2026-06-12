export { buscarProdutosSpec } from './buscar_produtos.spec';
export { listarPedidosSpec } from './listar_pedidos.spec';
export { criarTicketSpec } from './criar_ticket.spec';
export { rastrearPedidoSpec } from './rastrear_pedido.spec';
export { buscarInfoLojaSpec } from './buscar_info_loja.spec';

import { buscarProdutosSpec } from './buscar_produtos.spec';
import { listarPedidosSpec } from './listar_pedidos.spec';
import { criarTicketSpec } from './criar_ticket.spec';
import { rastrearPedidoSpec } from './rastrear_pedido.spec';
import { buscarInfoLojaSpec } from './buscar_info_loja.spec';

export const TOOL_SPECS = [
  buscarProdutosSpec,
  listarPedidosSpec,
  criarTicketSpec,
  rastrearPedidoSpec,
  buscarInfoLojaSpec,
] as const;
