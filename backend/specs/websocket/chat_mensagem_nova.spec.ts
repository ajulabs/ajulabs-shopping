import type { WebSocketSpec } from '../types';

export const chatMensagemNovaWsSpec = {
  name: 'ws_chat_mensagem_nova',
  event: 'chat:mensagem:nova',
  direction: 'server→client',
  description: 'Emitido para o destinatário de uma mensagem de chat em tempo real. Suporta chat entre consumidor, lojista e entregador.',
  room: 'usuario:{id} | loja:{id} | entregador:{id} (dependendo do tipo do destinatário)',

  payload: {
    id: 'uuid — ID da mensagem',
    conversaId: 'uuid',
    remetenteId: 'uuid',
    remetenteTipo: "'CONSUMER' | 'LOJISTA' | 'ENTREGADOR'",
    texto: 'string',
    lido: 'boolean',
    criadoEm: 'ISO datetime',
  },

  examples: [
    {
      description: 'Consumidor envia mensagem para lojista',
      payload: {
        id: 'msg_abc123',
        conversaId: 'conv_xyz',
        remetenteId: 'usr_abc',
        remetenteTipo: 'CONSUMER',
        texto: 'Vocês têm a camiseta no tamanho GGG?',
        lido: false,
        criadoEm: '2026-05-27T12:00:00Z',
      },
    },
    {
      description: 'Lojista responde para consumidor',
      payload: {
        id: 'msg_def456',
        conversaId: 'conv_xyz',
        remetenteId: 'ljs_abc',
        remetenteTipo: 'LOJISTA',
        texto: 'Olá! Infelizmente não temos GGG no estoque, mas podemos fazer sob encomenda.',
        lido: false,
        criadoEm: '2026-05-27T12:02:00Z',
      },
    },
    {
      description: 'Entregador envia mensagem para consumidor',
      payload: {
        id: 'msg_ghi789',
        conversaId: 'conv_ent',
        remetenteId: 'ent_abc',
        remetenteTipo: 'ENTREGADOR',
        texto: 'Estou na portaria do seu condomínio.',
        lido: false,
        criadoEm: '2026-05-27T14:55:00Z',
      },
    },
  ],

  preconditions: [
    'Destinatário conectado via socket na sala correspondente',
    'Mensagem criada via POST /chat/mensagens ou rota equivalente',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
