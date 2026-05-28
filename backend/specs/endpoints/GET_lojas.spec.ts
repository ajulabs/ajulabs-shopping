import type { EndpointSpec } from '../types';

export const getLojasSpec = {
  name: 'GET_lojas',
  method: 'GET',
  path: '/lojas',
  description: 'Lista todas as lojas do marketplace, opcionalmente filtradas por categoria. Ordenadas por avaliação. Rota pública.',
  auth: 'none',

  preconditions: [],

  input: {
    categoria: { type: 'string', required: false, constraints: ['query param — filtra por categoria da loja'] },
  },

  output: {
    lojas: [
      {
        id: 'uuid',
        nome: 'string',
        descricao: 'string',
        categoria: 'string',
        avaliacao: 'number (0-5)',
        totalAvaliacoes: 'number',
        logoUrl: 'string | null',
        bannerUrl: 'string | null',
        tempoEntregaMin: 'number (minutos)',
        tempoEntregaMax: 'number (minutos)',
        taxaEntrega: 'number (R$)',
        aberta: 'boolean',
        endereco: { rua: 'string', bairro: 'string', cidade: 'string', cep: 'string' },
        _count: { produtos: 'number' },
      },
    ],
  },

  examples: [
    {
      description: 'Lista todas as lojas — retorna por ordem de avaliação',
      input: {},
      output: {
        lojas: [
          { id: 'loja_xyz', nome: 'SportCenter Aracaju', categoria: 'esportes', avaliacao: 4.8, totalAvaliacoes: 120, logoUrl: null, bannerUrl: null, tempoEntregaMin: 30, tempoEntregaMax: 60, taxaEntrega: 5.0, aberta: true, endereco: { rua: 'Av. Beira Mar', bairro: 'Atalaia', cidade: 'Aracaju', cep: '49037000' }, _count: { produtos: 45 } },
          { id: 'loja_salgados', nome: 'Salgaderia do Zé', categoria: 'alimentacao', avaliacao: 4.5, totalAvaliacoes: 80, logoUrl: null, bannerUrl: null, tempoEntregaMin: 20, tempoEntregaMax: 40, taxaEntrega: 4.0, aberta: true, endereco: { rua: 'Rua Laranjeiras', bairro: 'Salgado', cidade: 'Aracaju', cep: '49000010' }, _count: { produtos: 12 } },
        ],
      },
    },
    {
      description: 'Filtro por categoria alimentação',
      input: { categoria: 'alimentacao' },
      output: {
        lojas: [
          { id: 'loja_salgados', nome: 'Salgaderia do Zé', categoria: 'alimentacao', avaliacao: 4.5, totalAvaliacoes: 80, logoUrl: null, bannerUrl: null, tempoEntregaMin: 20, tempoEntregaMax: 40, taxaEntrega: 4.0, aberta: true, endereco: {}, _count: { produtos: 12 } },
        ],
      },
    },
  ],

  errors: [
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar lojas' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
