import type { ValidationSpec } from '../types';

export const enderecoValidationSpec = {
  name: 'endereco_validation',
  description: 'Validações de endereço de entrega: formato, CEP via ViaCEP e geolocalização automática.',

  rules: [
    { field: 'apelido', type: 'string', required: true, constraints: ['min 1 caractere', 'ex: "Casa", "Trabalho", "Academia"'] },
    { field: 'rua', type: 'string', required: true, constraints: ['min 1 caractere'] },
    { field: 'numero', type: 'string', required: true, constraints: ['min 1 caractere', 'ex: "100", "S/N"'] },
    { field: 'bairro', type: 'string', required: true, constraints: ['min 1 caractere'] },
    { field: 'cep', type: 'string', required: true, constraints: ['exatamente 8 dígitos numéricos (regex /^\\d{8}$/)', 'ex: "49000010"', 'validado contra API ViaCEP — deve existir'] },
    { field: 'cidade', type: 'string', required: true, constraints: ['min 1 caractere'] },
    { field: 'complemento', type: 'string', required: false, constraints: ['opcional, ex: "Apto 201", "Bloco B"'] },
    { field: 'lat', type: 'number', required: false, constraints: ['float', 'coordenada GPS do dispositivo do usuário'] },
    { field: 'lng', type: 'number', required: false, constraints: ['float', 'coordenada GPS do dispositivo do usuário'] },
    { field: 'geoSource', type: 'enum', required: false, constraints: ["'gps' | 'geocode' | 'manual'", 'Informado pelo cliente quando envia lat/lng'] },
    { field: 'padrao', type: 'boolean', required: false, constraints: ['Definido automaticamente como true para o primeiro endereço', 'Não pode ser false para o único endereço', 'Não pode remover endereço padrão'] },
  ],

  examples: [
    {
      description: 'Válido: endereço em Aracaju com CEP correto',
      valid: {
        apelido: 'Casa',
        rua: 'Rua das Flores',
        numero: '100',
        bairro: 'Salgado',
        cep: '49000010',
        cidade: 'Aracaju',
        complemento: 'Apto 201',
      },
    },
    {
      description: 'Válido: endereço com coordenadas GPS',
      valid: {
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
    },
    {
      description: 'Inválido: CEP com formato errado',
      invalid: { cep: '49.000-010' },
      error: 'CEP deve ter 8 dígitos numéricos',
    },
    {
      description: 'Inválido: CEP não existe no ViaCEP',
      invalid: { cep: '00000000' },
      error: 'CEP inválido ou não encontrado.',
    },
    {
      description: 'Inválido: tentativa de remover endereço padrão',
      invalid: { action: 'DELETE /enderecos/end_padrao' },
      error: 'Não é possível remover o endereço padrão',
    },
  ],
} satisfies ValidationSpec;
