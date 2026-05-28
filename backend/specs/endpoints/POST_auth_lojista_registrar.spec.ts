import type { EndpointSpec } from '../types';

export const postAuthLojistaRegistrarSpec = {
  name: 'POST_auth_lojista_registrar',
  method: 'POST',
  path: '/auth/lojista/registrar',
  description: 'Registra novo lojista e cria automaticamente a loja inicial.',
  auth: 'none',

  preconditions: [
    'CNPJ e email não cadastrados anteriormente',
  ],

  input: {
    cnpj: { type: 'string', required: true, constraints: ['CNPJ válido (14 dígitos)', 'aceita formatado ou somente dígitos'] },
    nomeResponsavel: { type: 'string', required: true, constraints: ['min 2 caracteres'] },
    email: { type: 'string', required: true, constraints: ['email válido'] },
    senha: { type: 'string', required: true, constraints: ['min 8 chars', '1 maiúscula', '1 número'] },
    telefone: { type: 'string', required: true, constraints: ['formato +55XXXXXXXXXXX'] },
  },

  output: {
    token: { type: 'string', description: 'JWT de acesso' },
    refreshToken: { type: 'string', description: 'JWT de renovação' },
    lojista: {
      id: 'uuid',
      nomeResponsavel: 'string',
      email: 'string',
      lojaId: 'uuid — ID da loja criada automaticamente',
      lojaNome: 'string',
    },
  },

  examples: [
    {
      description: 'Registro de lojista em Aracaju — loja criada automaticamente',
      input: {
        cnpj: '11.222.333/0001-81',
        nomeResponsavel: 'Carlos Andrade',
        email: 'carlos@loja.com',
        senha: 'Loja@2024',
        telefone: '+5579988887777',
      },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        lojista: {
          id: 'ljs_abc123',
          nomeResponsavel: 'Carlos Andrade',
          email: 'carlos@loja.com',
          lojaId: 'loja_xyz789',
          lojaNome: 'Carlos Andrade',
        },
      },
    },
    {
      description: 'CNPJ já cadastrado',
      input: {
        cnpj: '11.222.333/0001-81',
        nomeResponsavel: 'Outro Nome',
        email: 'outro@email.com',
        senha: 'Outra@123',
        telefone: '+5579977776666',
      },
      output: { error: 'CNPJ ou email já cadastrado' },
    },
  ],

  errors: [
    { code: 'DUPLICATE_LOJISTA', statusCode: 400, message: 'CNPJ ou email já cadastrado' },
    { code: 'INVALID_CNPJ', statusCode: 400, message: 'CNPJ inválido' },
    { code: 'WEAK_PASSWORD', statusCode: 400, message: 'Senha fraca' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos' },
    { code: 'RATE_LIMIT', statusCode: 429, message: 'Muitas tentativas' },
  ],

  sideEffects: [
    'Cria registro em Lojista com senhaHash (bcrypt)',
    'Cria Loja inicial com nome = nomeResponsavel, taxaEntrega=0, tempo 30-60min',
    'Gera JWT de acesso + refreshToken',
  ],
} satisfies EndpointSpec;
