import type { WebSocketSpec } from '../types';

export const corridaOfertaWsSpec = {
  name: 'ws_corrida_oferta',
  event: 'corrida:oferta',
  direction: 'server→client',
  description: 'Emitido para TODOS os entregadores online quando um pedido fica pronto para retirada. Entregadores podem aceitar ou rejeitar.',
  room: 'entregadores (broadcast para todos os entregadores online)',

  payload: {
    pedidoId: 'uuid',
    lojaId: 'uuid',
    lojaNome: 'string',
    lojaEndereco: 'string',
    enderecoEntrega: 'string',
    distanciaKm: 'number | undefined',
    valorEntrega: 'number (R$)',
    totalPedido: 'number (R$)',
    itens: [{ nome: 'string', quantidade: 'number' }],
  },

  examples: [
    {
      description: 'Pedido de loja de esportes pronto para retirada',
      payload: {
        pedidoId: 'ped_abc123',
        lojaId: 'loja_xyz789',
        lojaNome: 'SportCenter Aracaju',
        lojaEndereco: 'Av. Beira Mar, 500, Atalaia',
        enderecoEntrega: 'Rua das Flores, 100, Salgado',
        distanciaKm: 3.2,
        valorEntrega: 8.0,
        totalPedido: 185.31,
        itens: [{ nome: 'Camiseta Básica M', quantidade: 1 }],
      },
    },
    {
      description: 'Pedido de salgaderia próxima',
      payload: {
        pedidoId: 'ped_def456',
        lojaId: 'loja_salgados',
        lojaNome: 'Salgaderia do Zé',
        lojaEndereco: 'Rua Laranjeiras, 200, Salgado',
        enderecoEntrega: 'Rua das Acácias, 50, Centro',
        distanciaKm: 1.5,
        valorEntrega: 5.0,
        totalPedido: 28.0,
        itens: [{ nome: 'Coxinha Catupiry (6 unid)', quantidade: 1 }],
      },
    },
  ],

  preconditions: [
    'Ao menos 1 entregador online e conectado ao socket na sala "entregadores"',
    'Pedido avançou para status "pronto" via PATCH /lojista/pedidos/:id/status',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
