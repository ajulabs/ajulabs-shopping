// Auth
export { postAuthUsuarioRegistrarSpec } from './POST_auth_usuario_registrar.spec';
export { postAuthUsuarioLoginSpec } from './POST_auth_usuario_login.spec';
export { postAuthLojistaRegistrarSpec } from './POST_auth_lojista_registrar.spec';
export { postAuthLojistaLoginSpec } from './POST_auth_lojista_login.spec';
export { postAuthEntregadorRegistrarSpec } from './POST_auth_entregador_registrar.spec';
export { postAuthRefreshSpec } from './POST_auth_refresh.spec';

// Pedidos (consumidor)
export { postPedidosSpec } from './POST_pedidos.spec';
export { getPedidosSpec } from './GET_pedidos.spec';
export { getPedidoByIdSpec } from './GET_pedidos_id.spec';
export { postPedidoRastrearSpec } from './POST_pedidos_id_rastrear.spec';
export { postPedidoCancelarSpec } from './POST_pedidos_id_cancelar.spec';

// Produtos (público/lojista)
export { postProdutosSpec } from './POST_produtos.spec';
export { getProdutoByIdSpec } from './GET_produtos_id.spec';
export { putProdutoByIdSpec } from './PUT_produtos_id.spec';
export { putLojistaProdutoSpec } from './PUT_lojista_produtos_id.spec';
export { postLojistaProdutosSpec } from './POST_lojista_produtos.spec';
export { postLojistaProdutosAnalisarSpec } from './POST_lojista_produtos_analisar.spec';
export { getProdutoAvisoEstoqueSpec } from './GET_produtos_id_aviso_estoque.spec';
export { postProdutoAvisoEstoqueSpec } from './POST_produtos_id_aviso_estoque.spec';
export { deleteProdutoAvisoEstoqueSpec } from './DELETE_produtos_id_aviso_estoque.spec';

// Lojas (público)
export { getLojasSpec } from './GET_lojas.spec';
export { getLojaByIdSpec } from './GET_lojas_id.spec';
export { getLojaProdutosSpec } from './GET_lojas_id_produtos.spec';

// Tickets (consumidor)
export { postTicketsSpec } from './POST_tickets.spec';
export { postTicketMensagemSpec } from './POST_tickets_id_mensagens.spec';

// Lojista
export { patchLojistasPedidoStatusSpec } from './PATCH_lojista_pedidos_id_status.spec';
export { getLojistaDashboardSpec } from './GET_lojista_lojas_id_dashboard.spec';

// Endereços
export { postEnderecosSpec } from './POST_enderecos.spec';

// Avaliações
export { postAvaliacoesSpec } from './POST_avaliacoes.spec';

// Entregador
export { postEntregadorCorridaAceitarSpec } from './POST_entregador_corridas_aceitar.spec';
export { postEntregadorConfirmarEntregaSpec } from './POST_entregador_corridas_confirmar_entrega.spec';
export { postEntregadorHeartbeatSpec } from './POST_entregador_heartbeat.spec';

// Chat Aju
export { getChatHistoricoSpec } from './GET_chat_historico.spec';
export { deleteChatHistoricoSpec } from './DELETE_chat_historico.spec';

// ── Coleção centralizada ──────────────────────────────────────────────────────

import { postAuthUsuarioRegistrarSpec } from './POST_auth_usuario_registrar.spec';
import { postAuthUsuarioLoginSpec } from './POST_auth_usuario_login.spec';
import { postAuthLojistaRegistrarSpec } from './POST_auth_lojista_registrar.spec';
import { postAuthLojistaLoginSpec } from './POST_auth_lojista_login.spec';
import { postAuthEntregadorRegistrarSpec } from './POST_auth_entregador_registrar.spec';
import { postAuthRefreshSpec } from './POST_auth_refresh.spec';
import { postPedidosSpec } from './POST_pedidos.spec';
import { getPedidosSpec } from './GET_pedidos.spec';
import { getPedidoByIdSpec } from './GET_pedidos_id.spec';
import { postPedidoRastrearSpec } from './POST_pedidos_id_rastrear.spec';
import { postPedidoCancelarSpec } from './POST_pedidos_id_cancelar.spec';
import { postProdutosSpec } from './POST_produtos.spec';
import { getProdutoByIdSpec } from './GET_produtos_id.spec';
import { putProdutoByIdSpec } from './PUT_produtos_id.spec';
import { putLojistaProdutoSpec } from './PUT_lojista_produtos_id.spec';
import { postLojistaProdutosSpec } from './POST_lojista_produtos.spec';
import { postLojistaProdutosAnalisarSpec } from './POST_lojista_produtos_analisar.spec';
import { getProdutoAvisoEstoqueSpec } from './GET_produtos_id_aviso_estoque.spec';
import { postProdutoAvisoEstoqueSpec } from './POST_produtos_id_aviso_estoque.spec';
import { deleteProdutoAvisoEstoqueSpec } from './DELETE_produtos_id_aviso_estoque.spec';
import { getLojasSpec } from './GET_lojas.spec';
import { getLojaByIdSpec } from './GET_lojas_id.spec';
import { getLojaProdutosSpec } from './GET_lojas_id_produtos.spec';
import { postTicketsSpec } from './POST_tickets.spec';
import { postTicketMensagemSpec } from './POST_tickets_id_mensagens.spec';
import { patchLojistasPedidoStatusSpec } from './PATCH_lojista_pedidos_id_status.spec';
import { getLojistaDashboardSpec } from './GET_lojista_lojas_id_dashboard.spec';
import { postEnderecosSpec } from './POST_enderecos.spec';
import { postAvaliacoesSpec } from './POST_avaliacoes.spec';
import { postEntregadorCorridaAceitarSpec } from './POST_entregador_corridas_aceitar.spec';
import { postEntregadorConfirmarEntregaSpec } from './POST_entregador_corridas_confirmar_entrega.spec';
import { postEntregadorHeartbeatSpec } from './POST_entregador_heartbeat.spec';
import { getChatHistoricoSpec } from './GET_chat_historico.spec';
import { deleteChatHistoricoSpec } from './DELETE_chat_historico.spec';

export const ENDPOINT_SPECS = [
  postAuthUsuarioRegistrarSpec,
  postAuthUsuarioLoginSpec,
  postAuthLojistaRegistrarSpec,
  postAuthLojistaLoginSpec,
  postAuthEntregadorRegistrarSpec,
  postAuthRefreshSpec,
  postPedidosSpec,
  getPedidosSpec,
  getPedidoByIdSpec,
  postPedidoRastrearSpec,
  postPedidoCancelarSpec,
  postProdutosSpec,
  getProdutoByIdSpec,
  putProdutoByIdSpec,
  putLojistaProdutoSpec,
  postLojistaProdutosSpec,
  postLojistaProdutosAnalisarSpec,
  getProdutoAvisoEstoqueSpec,
  postProdutoAvisoEstoqueSpec,
  deleteProdutoAvisoEstoqueSpec,
  getLojasSpec,
  getLojaByIdSpec,
  getLojaProdutosSpec,
  postTicketsSpec,
  postTicketMensagemSpec,
  patchLojistasPedidoStatusSpec,
  getLojistaDashboardSpec,
  postEnderecosSpec,
  postAvaliacoesSpec,
  postEntregadorCorridaAceitarSpec,
  postEntregadorConfirmarEntregaSpec,
  postEntregadorHeartbeatSpec,
  getChatHistoricoSpec,
  deleteChatHistoricoSpec,
] as const;
