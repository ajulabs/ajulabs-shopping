import type { EndpointSpec } from '../types';

export const postAuthUsuarioLoginSpec = {
  name: 'POST_auth_usuario_login',
  method: 'POST',
  path: '/auth/usuario/login',
  description: 'Autentica consumidor com CPF e senha, retorna JWT.',
  auth: 'none',

  preconditions: [
    'Usuário previamente registrado',
  ],

  input: {
    cpf: { type: 'string', required: true, constraints: ['aceita formatado ou somente dígitos'] },
    senha: { type: 'string', required: true, constraints: ['min 1 caractere'] },
  },

  output: {
    token: { type: 'string', description: 'JWT de acesso' },
    refreshToken: { type: 'string', description: 'JWT de renovação' },
    usuario: {
      id: 'uuid',
      nome: 'string',
      telefone: 'string',
      email: 'string',
    },
  },

  examples: [
    {
      description: 'Login bem-sucedido',
      input: { cpf: '123.456.789-09', senha: 'Senha@123' },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usuario: { id: 'usr_abc123', nome: 'Maria Silva', telefone: '+5579999998888', email: 'maria@example.com' },
      },
    },
    {
      description: 'CPF ou senha incorretos',
      input: { cpf: '000.000.000-00', senha: 'senhaErrada' },
      output: { error: 'CPF ou senha inválidos' },
    },
  ],

  errors: [
    { code: 'INVALID_CREDENTIALS', statusCode: 401, message: 'CPF ou senha inválidos' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos' },
    { code: 'RATE_LIMIT', statusCode: 429, message: 'Muitas tentativas de login' },
  ],

  sideEffects: [
    'Gera novo JWT de acesso + refreshToken',
  ],
} satisfies EndpointSpec;
