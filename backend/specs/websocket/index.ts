// Server → Client
export { pedidoNovoWsSpec } from './pedido_novo.spec';
export { pedidoAtualizadoWsSpec } from './pedido_atualizado.spec';
export { localizacaoEntregadorWsSpec } from './localizacao_entregador.spec';
export { ticketMensagemWsSpec } from './ticket_mensagem.spec';
export { ticketStatusWsSpec } from './ticket_status.spec';
export { ticketNovoWsSpec } from './ticket_novo.spec';
export { corridaOfertaWsSpec } from './corrida_oferta.spec';
export { chatMensagemNovaWsSpec } from './chat_mensagem_nova.spec';
export { produtoVariacoesWsSpec } from './produto_variacoes.spec';
export { estoqueAtualizadoWsSpec } from './estoque_atualizado.spec';
export { estoqueAlertaWsSpec } from './estoque_alerta.spec';
export { vitrineAtualizadaWsSpec } from './vitrine_atualizada.spec';

// Client → Server
export { localizacaoUpdateWsSpec } from './localizacao_update.spec';
export { entregadorJoinWsSpec, usuarioJoinWsSpec, lojistaJoinWsSpec } from './join_rooms.spec';

// ── Coleção centralizada ──────────────────────────────────────────────────────

import { pedidoNovoWsSpec } from './pedido_novo.spec';
import { pedidoAtualizadoWsSpec } from './pedido_atualizado.spec';
import { localizacaoEntregadorWsSpec } from './localizacao_entregador.spec';
import { ticketMensagemWsSpec } from './ticket_mensagem.spec';
import { ticketStatusWsSpec } from './ticket_status.spec';
import { ticketNovoWsSpec } from './ticket_novo.spec';
import { corridaOfertaWsSpec } from './corrida_oferta.spec';
import { chatMensagemNovaWsSpec } from './chat_mensagem_nova.spec';
import { produtoVariacoesWsSpec } from './produto_variacoes.spec';
import { estoqueAtualizadoWsSpec } from './estoque_atualizado.spec';
import { estoqueAlertaWsSpec } from './estoque_alerta.spec';
import { vitrineAtualizadaWsSpec } from './vitrine_atualizada.spec';
import { localizacaoUpdateWsSpec } from './localizacao_update.spec';
import { entregadorJoinWsSpec, usuarioJoinWsSpec, lojistaJoinWsSpec } from './join_rooms.spec';

export const WEBSOCKET_SPECS = {
  serverToClient: [
    pedidoNovoWsSpec,
    pedidoAtualizadoWsSpec,
    localizacaoEntregadorWsSpec,
    ticketMensagemWsSpec,
    ticketStatusWsSpec,
    ticketNovoWsSpec,
    corridaOfertaWsSpec,
    chatMensagemNovaWsSpec,
    produtoVariacoesWsSpec,
    estoqueAtualizadoWsSpec,
    estoqueAlertaWsSpec,
    vitrineAtualizadaWsSpec,
  ],
  clientToServer: [
    localizacaoUpdateWsSpec,
    entregadorJoinWsSpec,
    usuarioJoinWsSpec,
    lojistaJoinWsSpec,
  ],
} as const;
