import type { ValidationSpec } from '../types';

export const produtoValidationSpec = {
  name: 'produto_validation',
  description: 'Validações para criação e atualização de produtos (POST/PUT /produtos e /lojista/produtos).',

  rules: [
    { field: 'lojaId', type: 'string (uuid)', required: true, constraints: ['UUID válido', 'Loja deve pertencer ao lojista autenticado'] },
    { field: 'nome', type: 'string', required: true, constraints: ['min 2 caracteres'] },
    { field: 'descricao', type: 'string', required: true, constraints: ['pode ser string vazia'] },
    { field: 'preco', type: 'number', required: true, constraints: ['> 0 (positivo)'] },
    { field: 'estoque', type: 'number int', required: true, constraints: ['>= 0 (nonnegative)', 'Se produto tem variações, estoque é calculado como soma das variações'] },
    { field: 'imagemUrl', type: 'string URL', required: true, constraints: ['URL válida na rota /produtos', 'Upload via multipart na rota /lojista/produtos'] },
    { field: 'categoria', type: 'string', required: true, constraints: ['qualquer string não vazia'] },
    { field: 'tags', type: 'string[]', required: false, constraints: ['array de strings, default []'] },
    { field: 'destaque', type: 'boolean', required: false, constraints: ['default false'] },
    { field: 'variacoes', type: 'array', required: false, constraints: ['[{nome: string min 1, estoque: int >= 0}]', 'Se fornecido, substitui TODAS as variações existentes'] },
    { field: 'imagens', type: 'File[]', required: false, constraints: ['max 4 arquivos', 'max 10MB cada', 'multipart/form-data'] },
  ],

  examples: [
    {
      description: 'Produto válido com variações de tamanho',
      valid: {
        lojaId: 'loja_xyz789',
        nome: 'Camiseta Básica',
        descricao: 'Camiseta 100% algodão',
        preco: 39.9,
        estoque: 0,
        categoria: 'vestuario',
        variacoes: [
          { nome: 'P', estoque: 5 },
          { nome: 'M', estoque: 5 },
          { nome: 'G', estoque: 5 },
        ],
      },
    },
    {
      description: 'Inválido: nome muito curto',
      invalid: { nome: 'A', preco: 10, estoque: 5, categoria: 'geral' },
      error: 'String must contain at least 2 character(s)',
    },
    {
      description: 'Inválido: preço negativo',
      invalid: { nome: 'Produto X', preco: -5, estoque: 5, categoria: 'geral' },
      error: 'Number must be greater than 0',
    },
    {
      description: 'Inválido: estoque negativo',
      invalid: { nome: 'Produto Y', preco: 10, estoque: -1, categoria: 'geral' },
      error: 'Number must be greater than or equal to 0',
    },
  ],
} satisfies ValidationSpec;
