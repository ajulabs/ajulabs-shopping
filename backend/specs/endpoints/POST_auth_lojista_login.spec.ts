import type { EndpointSpec } from '../types';

export const postAuthLojistaLoginSpec = {
  name: 'POST_auth_lojista_login',
  method: 'POST',
  path: '/auth/lojista/login',
  description: 'Autentica lojista com email OU CNPJ + senha. Cria loja automaticamente se não existir.',
  auth: 'none',

  preconditions: [
    'Lojista previamente registrado',
  ],

  input: {
    identificador: { type: 'string', required: false, constraints: ['email ou CNPJ — campo novo'] },
    cnpj: { type: 'string', required: false, constraints: ['CNPJ — campo legado, usar identificador preferencialmente'] },
    senha: { type: 'string', required: true },
  },

  output: {
    token: { type: 'string' },
    refreshToken: { type: 'string' },
    lojista: {
      id: 'uuid',
      nomeResponsavel: 'string',
      email: 'string',
      cnpj: 'string',
      lojaId: 'uuid | null',
      lojaNome: 'string | null',
    },
  },

  examples: [
    {
      description: 'Login com email',
      input: { identificador: 'carlos@loja.com', senha: 'Loja@2024' },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        lojista: { id: 'ljs_abc123', nomeResponsavel: 'Carlos Andrade', email: 'carlos@loja.com', cnpj: '11222333000181', lojaId: 'loja_xyz789', lojaNome: 'SportCenter Aracaju' },
      },
    },
    {
      description: 'Login com CNPJ (campo legado)',
      input: { cnpj: '11.222.333/0001-81', senha: 'Loja@2024' },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        lojista: { id: 'ljs_abc123', nomeResponsavel: 'Carlos Andrade', email: 'carlos@loja.com', cnpj: '11222333000181', lojaId: 'loja_xyz789', lojaNome: 'SportCenter Aracaju' },
      },
    },
  ],

  errors: [
    { code: 'MISSING_IDENTIFIER', statusCode: 400, message: 'Informe email ou CNPJ' },
    { code: 'INVALID_CREDENTIALS', statusCode: 401, message: 'Credenciais inválidas' },
    { code: 'RATE_LIMIT', statusCode: 429, message: 'Muitas tentativas de login' },
  ],

  sideEffects: [
    'Se loja não existe, cria Loja automaticamente (log de aviso)',
    'Gera JWT de acesso + refreshToken',
  ],
} satisfies EndpointSpec;
