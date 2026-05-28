import type { EndpointSpec } from '../types';

export const postAuthRefreshSpec = {
  name: 'POST_auth_refresh',
  method: 'POST',
  path: '/auth/refresh',
  description: 'Renova o JWT de acesso usando um refreshToken válido. Funciona para todos os tipos de usuário (consumidor, lojista, entregador).',
  auth: 'none',

  preconditions: [
    'refreshToken não expirado (validade 30d)',
    'refreshToken assinado com a chave secreta correta',
  ],

  input: {
    refreshToken: { type: 'string', required: true, constraints: ['JWT válido não expirado'] },
  },

  output: {
    token: { type: 'string', description: 'Novo JWT de acesso (expira 7d)' },
    refreshToken: { type: 'string', description: 'Novo refreshToken (expira 30d)' },
  },

  examples: [
    {
      description: 'Renovação bem-sucedida do token de consumidor',
      input: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh...' },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.novoToken...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.novoRefresh...',
      },
    },
    {
      description: 'RefreshToken expirado ou inválido',
      input: { refreshToken: 'tokenInvalido' },
      output: { error: 'Refresh token inválido ou expirado' },
    },
  ],

  errors: [
    { code: 'INVALID_REFRESH_TOKEN', statusCode: 401, message: 'Refresh token inválido ou expirado' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'refreshToken ausente' },
  ],

  sideEffects: [
    'Gera novo par token + refreshToken com mesmo payload (id, tipo)',
  ],
} satisfies EndpointSpec;
