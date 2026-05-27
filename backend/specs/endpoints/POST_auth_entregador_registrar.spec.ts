import type { EndpointSpec } from '../types';

export const postAuthEntregadorRegistrarSpec = {
  name: 'POST_auth_entregador_registrar',
  method: 'POST',
  path: '/auth/entregador/registrar',
  description: 'Registra novo entregador no AjuLabs.',
  auth: 'none',

  preconditions: [
    'CPF, telefone e email não cadastrados anteriormente',
  ],

  input: {
    nome: { type: 'string', required: true, constraints: ['min 2 caracteres'] },
    cpf: { type: 'string', required: true, constraints: ['CPF válido'] },
    telefone: { type: 'string', required: true, constraints: ['formato +55XXXXXXXXXXX'] },
    email: { type: 'string', required: true, constraints: ['email válido'] },
    senha: { type: 'string', required: true, constraints: ['min 8 chars', '1 maiúscula', '1 número'] },
    tipoTransporte: { type: 'enum', required: true, constraints: ["'bike' | 'moto' | 'carro'"] },
  },

  output: {
    token: { type: 'string' },
    refreshToken: { type: 'string' },
    entregador: {
      id: 'uuid',
      nome: 'string',
      statusConta: "enum: 'pendente' | 'ativo' | 'bloqueado'",
    },
  },

  examples: [
    {
      description: 'Registro de motoboy em Aracaju',
      input: {
        nome: 'Pedro Lima',
        cpf: '987.654.321-00',
        telefone: '+5579977775555',
        email: 'pedro@moto.com',
        senha: 'Moto@2024',
        tipoTransporte: 'moto',
      },
      output: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        entregador: { id: 'ent_abc123', nome: 'Pedro Lima', statusConta: 'pendente' },
      },
    },
    {
      description: 'CPF já cadastrado',
      input: {
        nome: 'Ana Costa',
        cpf: '987.654.321-00',
        telefone: '+5579966664444',
        email: 'ana@bike.com',
        senha: 'Bike@2024',
        tipoTransporte: 'bike',
      },
      output: { error: 'CPF, telefone ou email já cadastrado' },
    },
  ],

  errors: [
    { code: 'DUPLICATE_ENTREGADOR', statusCode: 400, message: 'CPF, telefone ou email já cadastrado' },
    { code: 'INVALID_CPF', statusCode: 400, message: 'CPF inválido' },
    { code: 'INVALID_TRANSPORT', statusCode: 400, message: 'tipoTransporte deve ser bike, moto ou carro' },
    { code: 'WEAK_PASSWORD', statusCode: 400, message: 'Senha fraca' },
    { code: 'RATE_LIMIT', statusCode: 429, message: 'Muitas tentativas' },
  ],

  sideEffects: [
    'Cria registro em Entregador com statusConta = "pendente" e senhaHash (bcrypt)',
    'Gera JWT de acesso + refreshToken',
  ],
} satisfies EndpointSpec;
