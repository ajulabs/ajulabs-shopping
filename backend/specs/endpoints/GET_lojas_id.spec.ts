import type { EndpointSpec } from '../types';

export const getLojaByIdSpec = {
  name: 'GET_lojas_id',
  method: 'GET',
  path: '/lojas/:id',
  description: 'Retorna detalhes completos de uma loja incluindo horários e produtos disponíveis. Rota pública.',
  auth: 'none',

  preconditions: [],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    loja: {
      id: 'uuid',
      nome: 'string',
      descricao: 'string',
      categoria: 'string',
      avaliacao: 'number (0-5)',
      totalAvaliacoes: 'number',
      logoUrl: 'string | null',
      bannerUrl: 'string | null',
      tempoEntregaMin: 'number (min)',
      tempoEntregaMax: 'number (min)',
      taxaEntrega: 'number (R$)',
      telefone: 'string',
      aberta: 'boolean',
      aceitaAgendamento: 'boolean',
      endereco: { rua: 'string', numero: 'string', bairro: 'string', cep: 'string', cidade: 'string', complemento: 'string | null' },
      horarios: [{ diaSemana: 'number (0=dom)', abertura: 'string (HH:mm)', fechamento: 'string (HH:mm)' }],
      produtos: [{ id: 'uuid', nome: 'string', preco: 'number', imagemUrl: 'string', categoria: 'string', destaque: 'boolean', disponivel: 'boolean' }],
    },
  },

  examples: [
    {
      description: 'Loja de esportes com produtos em destaque',
      input: { id: 'loja_xyz789' },
      output: {
        loja: {
          id: 'loja_xyz789',
          nome: 'SportCenter Aracaju',
          descricao: 'Artigos esportivos para toda a família',
          categoria: 'esportes',
          avaliacao: 4.8,
          totalAvaliacoes: 120,
          logoUrl: 'https://storage.ajulabs.com/lojas/sportcenter-logo.jpg',
          bannerUrl: null,
          tempoEntregaMin: 30,
          tempoEntregaMax: 60,
          taxaEntrega: 5.0,
          telefone: '+5579988887777',
          aberta: true,
          aceitaAgendamento: false,
          endereco: { rua: 'Av. Beira Mar', numero: '500', bairro: 'Atalaia', cep: '49037000', cidade: 'Aracaju', complemento: null },
          horarios: [
            { diaSemana: 1, abertura: '08:00', fechamento: '18:00' },
            { diaSemana: 2, abertura: '08:00', fechamento: '18:00' },
          ],
          produtos: [
            { id: 'prod_tenis', nome: 'Tênis Running Pro', preco: 149.9, imagemUrl: 'https://...', categoria: 'calcados', destaque: true, disponivel: true },
          ],
        },
      },
    },
    {
      description: 'Loja não encontrada',
      input: { id: 'loja_inexistente' },
      output: { error: 'Loja não encontrada' },
    },
  ],

  errors: [
    { code: 'NOT_FOUND', statusCode: 404, message: 'Loja não encontrada' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar loja' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
