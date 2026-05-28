import type { ValidationSpec } from '../types';

export const autenticacaoValidationSpec = {
  name: 'autenticacao_validation',
  description: 'Validações de autenticação JWT e controle de acesso por role (usuario, lojista, entregador).',

  rules: [
    { field: 'Authorization', type: 'string', required: true, constraints: ['Formato: "Bearer {JWT}"', 'JWT deve ser assinado com JWT_SECRET', 'JWT não expirado (padrão 7d)'] },
    { field: 'payload.id', type: 'string (uuid)', required: true, constraints: ['ID do usuário autenticado'] },
    { field: 'payload.tipo', type: 'enum', required: true, constraints: ["'usuario' | 'lojista' | 'entregador'"] },
    { field: 'authMiddleware', type: 'middleware', required: true, constraints: ['Valida token e injeta req.user = {id, tipo}', 'Retorna 401 se ausente ou inválido'] },
    { field: 'authUsuario', type: 'middleware', required: false, constraints: ["Garante req.user.tipo === 'usuario'", 'Retorna 403 se tipo diferente'] },
    { field: 'authLojista', type: 'middleware', required: false, constraints: ["Garante req.user.tipo === 'lojista'", 'Retorna 403 se tipo diferente'] },
    { field: 'authEntregador', type: 'middleware', required: false, constraints: ["Garante req.user.tipo === 'entregador'", 'Retorna 403 se tipo diferente'] },
    { field: 'refreshToken', type: 'string (JWT)', required: false, constraints: ['Validade padrão 30d', 'Payload: {id, tipo}', 'Assinado com REFRESH_SECRET'] },
  ],

  examples: [
    {
      description: 'Token válido de consumidor',
      valid: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzcl9hYmMiLCJ0aXBvIjoidXN1YXJpbyIsImlhdCI6MTYwMDAwMDAwMH0.sig',
    },
    {
      description: 'Inválido: token ausente',
      invalid: null,
      error: 'Token de autenticação não fornecido (401)',
    },
    {
      description: 'Inválido: lojista tentando acessar rota de usuário',
      invalid: 'Bearer token_lojista_valido',
      error: 'Acesso restrito — role incorreta (403)',
    },
    {
      description: 'Inválido: token expirado',
      invalid: 'Bearer token_expirado',
      error: 'Token expirado ou inválido (401)',
    },
    {
      description: 'Inválido: assinatura JWT corrompida',
      invalid: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.assinatura_invalida',
      error: 'Token inválido (401)',
    },
  ],
} satisfies ValidationSpec;

export const cpfValidationSpec = {
  name: 'cpf_validation',
  description: 'Validação de CPF com verificação dos dígitos verificadores (algoritmo Receita Federal).',

  rules: [
    { field: 'cpf', type: 'string', required: true, constraints: ['Aceita formatado "000.000.000-00" ou somente dígitos', 'Exatamente 11 dígitos após remoção de não-dígitos', 'Não pode ser sequência repetida (ex: "111.111.111-11")', 'Dígitos verificadores válidos pelo algoritmo da Receita'] },
  ],

  examples: [
    { description: 'CPF válido formatado', valid: '123.456.789-09' },
    { description: 'CPF válido somente dígitos', valid: '12345678909' },
    { description: 'Inválido: sequência repetida', invalid: '111.111.111-11', error: 'CPF inválido' },
    { description: 'Inválido: dígito verificador errado', invalid: '123.456.789-00', error: 'CPF inválido' },
    { description: 'Inválido: menos de 11 dígitos', invalid: '1234567', error: 'CPF inválido' },
  ],
} satisfies ValidationSpec;

export const senhaForteValidationSpec = {
  name: 'senha_forte_validation',
  description: 'Validação de senha forte para registro de consumidor, lojista e entregador.',

  rules: [
    { field: 'senha', type: 'string', required: true, constraints: ['min 8 caracteres', 'ao menos 1 letra maiúscula (A-Z)', 'ao menos 1 número (0-9)'] },
  ],

  examples: [
    { description: 'Válida: 8 chars, maiúscula e número', valid: 'Senha@12' },
    { description: 'Válida: complexa', valid: 'MinhaSenha2024!' },
    { description: 'Inválida: sem maiúscula', invalid: 'senha123', error: 'Senha deve conter pelo menos 1 letra maiúscula' },
    { description: 'Inválida: sem número', invalid: 'SenhaForte', error: 'Senha deve conter pelo menos 1 número' },
    { description: 'Inválida: menos de 8 chars', invalid: 'Ab1', error: 'Senha deve ter no mínimo 8 caracteres' },
  ],
} satisfies ValidationSpec;
