import type { EndpointSpec } from '../types';

export const postEnderecosSpec = {
  name: 'POST_enderecos',
  method: 'POST',
  path: '/enderecos',
  description: 'Cria novo endereço de entrega para o consumidor. Valida CEP via ViaCEP e geolocaliza automaticamente (GPS > CEP > endereço textual).',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
  ],

  input: {
    apelido: { type: 'string', required: true, constraints: ['min 1 caractere', 'ex: "Casa", "Trabalho"'] },
    rua: { type: 'string', required: true, constraints: ['min 1 caractere'] },
    numero: { type: 'string', required: true, constraints: ['min 1 caractere'] },
    bairro: { type: 'string', required: true, constraints: ['min 1 caractere'] },
    cep: { type: 'string', required: true, constraints: ['exatamente 8 dígitos numéricos', 'ex: "49000010"', 'validado via ViaCEP'] },
    cidade: { type: 'string', required: true, constraints: ['min 1 caractere'] },
    complemento: { type: 'string', required: false, constraints: ['ex: "Apto 201"'] },
    lat: { type: 'number', required: false, constraints: ['coordenada GPS do dispositivo'] },
    lng: { type: 'number', required: false, constraints: ['coordenada GPS do dispositivo'] },
    geoSource: { type: 'enum', required: false, constraints: ["'gps' | 'geocode' | 'manual'"] },
  },

  output: {
    endereco: {
      id: 'uuid',
      apelido: 'string',
      rua: 'string',
      numero: 'string',
      bairro: 'string',
      cep: 'string',
      cidade: 'string',
      complemento: 'string | null',
      padrao: 'boolean — true se for o primeiro endereço',
      lat: 'number | null',
      lng: 'number | null',
      accuracy: 'number | null (metros)',
      geoSource: "'gps' | 'geocode' | null",
      criadoEm: 'ISO datetime',
    },
  },

  examples: [
    {
      description: 'Primeiro endereço do usuário — torna-se padrão automaticamente',
      input: {
        apelido: 'Casa',
        rua: 'Rua das Flores',
        numero: '100',
        bairro: 'Salgado',
        cep: '49000010',
        cidade: 'Aracaju',
        complemento: 'Apto 201',
      },
      output: {
        endereco: {
          id: 'end_abc123',
          apelido: 'Casa',
          rua: 'Rua das Flores',
          numero: '100',
          bairro: 'Salgado',
          cep: '49000010',
          cidade: 'Aracaju',
          complemento: 'Apto 201',
          padrao: true,
          lat: -10.9167,
          lng: -37.0500,
          accuracy: 80,
          geoSource: 'geocode',
          criadoEm: '2026-05-27T10:00:00Z',
        },
      },
    },
    {
      description: 'Endereço com coordenadas GPS do dispositivo',
      input: {
        apelido: 'Trabalho',
        rua: 'Av. Hermes Fontes',
        numero: '200',
        bairro: 'Suissa',
        cep: '49050010',
        cidade: 'Aracaju',
        lat: -10.9100,
        lng: -37.0520,
        geoSource: 'gps',
      },
      output: {
        endereco: {
          id: 'end_def456',
          apelido: 'Trabalho',
          rua: 'Av. Hermes Fontes',
          numero: '200',
          bairro: 'Suissa',
          cep: '49050010',
          cidade: 'Aracaju',
          complemento: null,
          padrao: false,
          lat: -10.9100,
          lng: -37.0520,
          accuracy: 30,
          geoSource: 'gps',
          criadoEm: '2026-05-27T10:05:00Z',
        },
      },
    },
    {
      description: 'CEP inválido — rejeitado pelo ViaCEP',
      input: { apelido: 'Casa', rua: 'Rua X', numero: '1', bairro: 'Centro', cep: '00000000', cidade: 'Aracaju' },
      output: { error: 'CEP inválido ou não encontrado.' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'INVALID_CEP', statusCode: 422, message: 'CEP inválido ou não encontrado.' },
    { code: 'INVALID_CEP_FORMAT', statusCode: 400, message: 'CEP deve ter 8 dígitos numéricos' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos (Zod)' },
  ],

  sideEffects: [
    'Consulta ViaCEP para validar o CEP',
    'Geocodifica via CEP → endereço textual (fallback) para obter lat/lng',
    'Se for o primeiro endereço do usuário, define padrao = true',
    'Cria registro em EnderecoUsuario',
  ],
} satisfies EndpointSpec;
