export { buscarProdutosSpec } from './buscar_produtos.spec';
export { listarPedidosSpec } from './listar_pedidos.spec';
export { criarTicketSpec } from './criar_ticket.spec';

import { buscarProdutosSpec } from './buscar_produtos.spec';
import { listarPedidosSpec } from './listar_pedidos.spec';
import { criarTicketSpec } from './criar_ticket.spec';

export const TOOL_SPECS = [buscarProdutosSpec, listarPedidosSpec, criarTicketSpec] as const;
