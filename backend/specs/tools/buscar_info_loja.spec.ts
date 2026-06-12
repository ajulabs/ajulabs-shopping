import type { ToolSpec } from '../types';

export const buscarInfoLojaSpec = {
  name: 'buscar_info_loja',
  description:
    'Retorna informações cadastrais de uma loja: horários de funcionamento por dia da semana, ' +
    'endereço, telefone, WhatsApp, taxa de entrega e tempo estimado de entrega. ' +
    'Usar quando o usuário perguntar sobre horário, endereço, telefone, se a loja está aberta, ' +
    'tempo de entrega ou qualquer dado da loja em si (não de produtos).',

  preconditions: [
    'Usuário autenticado no chat',
    'lojaId ou lojaNome deve identificar uma loja existente',
  ],

  input: {
    lojaId: {
      type: 'string',
      required: false,
      constraints: ['uuid', 'presente quando [lojaId:UUID] aparece na conversa'],
      description: 'UUID da loja — use quando disponível no contexto da conversa',
    },
    lojaNome: {
      type: 'string',
      required: false,
      constraints: ['min 1 caractere'],
      description: 'Nome da loja quando UUID não está disponível — resolvido via busca parcial case-insensitive',
    },
  },

  output: {
    tipo: {
      type: 'literal',
      value: 'infoLoja',
      required: true,
    },
    dados: {
      type: 'InfoLoja | null',
      required: true,
      description: 'null quando a loja não é encontrada pelo nome/ID fornecido',
      items: {
        nome: 'string',
        descricao: 'string',
        categoria: 'string',
        telefone: 'string',
        whatsapp: 'string | null',
        aberta: 'boolean — status atual de funcionamento',
        tempoEntregaMin: 'number — minutos mínimos',
        tempoEntregaMax: 'number — minutos máximos',
        taxaEntrega: 'number (R$)',
        endereco: '{ rua, numero, bairro, cidade } | null',
        horarios: '{ diaSemana: 0-6 (0=Seg), ativo, abertura, fechamento }[]',
      },
    },
  },

  examples: [
    {
      description: 'Usuário pergunta o horário da loja pelo nome',
      input: { lojaNome: 'SportCenter' },
      output: {
        tipo: 'infoLoja',
        dados: {
          nome: 'SportCenter Aracaju',
          descricao: 'Sua loja de artigos esportivos em Aracaju',
          categoria: 'Esportes',
          telefone: '+5579999990001',
          whatsapp: '+5579999990001',
          aberta: true,
          tempoEntregaMin: 20,
          tempoEntregaMax: 40,
          taxaEntrega: 5.0,
          endereco: { rua: 'Av. Beira Mar', numero: '100', bairro: 'Atalaia', cidade: 'Aracaju' },
          horarios: [
            { diaSemana: 0, ativo: true, abertura: '08:00', fechamento: '18:00' },
            { diaSemana: 5, ativo: true, abertura: '09:00', fechamento: '14:00' },
            { diaSemana: 6, ativo: false, abertura: '00:00', fechamento: '00:00' },
          ],
        },
      },
    },
    {
      description: 'Loja não encontrada pelo nome informado',
      input: { lojaNome: 'Loja Inexistente' },
      output: {
        tipo: 'infoLoja',
        dados: null,
      },
    },
  ],

  errors: [
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao consultar informações da loja' },
  ],

  sideEffects: [
    'Nenhum efeito colateral — operação somente de leitura',
  ],
} satisfies ToolSpec;
