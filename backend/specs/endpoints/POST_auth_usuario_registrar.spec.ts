import type { EndpointSpec } from '../types';

export const postAuthUsuarioRegistrarSpec = {
  name: 'POST_auth_usuario_registrar',
  method: 'POST',
  path: '/auth/usuario/registrar',
  description: 'Registra novo consumidor no marketplace AjuLabs.',
  auth: 'none',

  preconditions: [
    'CPF, telefone e email não cadastrados anteriormente',
  ],

  input: {
    nome: { type: 'string', required: true, constraints: ['min 2 caracteres'] },
    cpf: { type: 'string', required: true, constraints: ['CPF válido (dígitos verificadores)', 'aceita formatado "000.000.000-00" ou somente dígitos'] },
    telefone: { type: 'string', required: true, constraints: ['formato +55XXXXXXXXXXX (13 dígitos após +55)', 'ex: +5579999998888'] },
    email: { type: 'string', required: true, constraints: ['email válido'] },
    senha: { type: 'string', required: true, constraints: ['min 8 caracteres', 'ao menos 1 letra maiúscula', 'ao menos 1 número'] },
  },

  output: {
    token: { type: 'string', description: 'JWT de acesso (expira em 7d)' },
    refreshToken: { type: 'string', description: 'JWT de renovação (expira em 30d)' },
    usuario: {
      id: 'uuid',
      nome: 'string',
      telefone: 'string',
      email: 'string',
    },
  },

  examples: [
    {
      description: 'Registro bem-sucedido de consumidor em Aracaju',
      input: {
        nome: 'Maria Silva',
        cpf: '123.456.789-09',
        telefone: '+5579999998888',
        email: 'maria@example.com',
        senha: 'Senha@123',
      },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usuario: {
          id: 'usr_abc123',
          nome: 'Maria Silva',
          telefone: '+5579999998888',
          email: 'maria@example.com',
        },
      },
    },
    {
      description: 'Tentativa com CPF já cadastrado',
      input: {
        nome: 'João Souza',
        cpf: '123.456.789-09',
        telefone: '+5579888887777',
        email: 'joao@example.com',
        senha: 'Outra@456',
      },
      output: { error: 'CPF, telefone ou email já cadastrado' },
    },
  ],

  errors: [
    { code: 'DUPLICATE_USER', statusCode: 400, message: 'CPF, telefone ou email já cadastrado' },
    { code: 'INVALID_CPF', statusCode: 400, message: 'CPF inválido' },
    { code: 'WEAK_PASSWORD', statusCode: 400, message: 'Senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 número' },
    { code: 'INVALID_PHONE', statusCode: 400, message: 'Telefone deve estar no formato +55XXXXXXXXXXX' },
    { code: 'INVALID_EMAIL', statusCode: 400, message: 'Email inválido' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos (Zod)' },
    { code: 'RATE_LIMIT', statusCode: 429, message: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
  ],

  sideEffects: [
    'Cria registro em Usuario com senhaHash (bcrypt)',
    'Gera JWT de acesso + refreshToken',
  ],
} satisfies EndpointSpec;
