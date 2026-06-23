export const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

export type KB = 'default' | 'email-address' | 'numeric' | 'phone-pad';

export type Data = Record<string, string>;

export interface StepProps {
  data: Data;
  up: (k: string, v: string) => void;
}

export const PIX_TIPOS = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00', keyboard: 'numeric' as KB },
  { id: 'email', label: 'Email', placeholder: 'seu@email.com', keyboard: 'email-address' as KB },
  { id: 'celular', label: 'Celular', placeholder: '(79) 9 0000-0000', keyboard: 'phone-pad' as KB },
  {
    id: 'aleatoria',
    label: 'Aleatória',
    placeholder: 'Chave aleatória',
    keyboard: 'default' as KB,
  },
];

export const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '003', nome: 'Banco da Amazônia' },
  { codigo: '004', nome: 'Banco do Nordeste' },
  { codigo: '021', nome: 'Banestes' },
  { codigo: '025', nome: 'Banco Alfa' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '047', nome: 'Banese' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '077', nome: 'Banco Inter' },
  { codigo: '085', nome: 'Via Credi' },
  { codigo: '099', nome: 'Uniprime' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '121', nome: 'Agibank' },
  { codigo: '133', nome: 'Cresol' },
  { codigo: '136', nome: 'Unicred' },
  { codigo: '197', nome: 'Stone' },
  { codigo: '208', nome: 'BTG Pactual' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '218', nome: 'BS2' },
  { codigo: '224', nome: 'Banco Fibra' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '243', nome: 'Banco Master' },
  { codigo: '246', nome: 'ABC Brasil' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagBank' },
  { codigo: '301', nome: 'PicPay' },
  { codigo: '318', nome: 'Banco BMG' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '348', nome: 'XP Investimentos' },
  { codigo: '364', nome: 'EFÍ (Gerencianet)' },
  { codigo: '376', nome: 'JP Morgan' },
  { codigo: '389', nome: 'Banco Mercantil' },
  { codigo: '403', nome: 'Cora' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '456', nome: 'Sicredi' },
  { codigo: '461', nome: 'Asaas' },
  { codigo: '477', nome: 'Citibank' },
  { codigo: '487', nome: 'Deutsche Bank' },
  { codigo: '505', nome: 'Credit Suisse' },
  { codigo: '536', nome: 'Neon' },
  { codigo: '600', nome: 'Banco Luso Brasileiro' },
  { codigo: '604', nome: 'Banco Industrial' },
  { codigo: '611', nome: 'Banco Paulista' },
  { codigo: '612', nome: 'Banco Guanabara' },
  { codigo: '623', nome: 'Banco Pan' },
  { codigo: '633', nome: 'Banco Rendimento' },
  { codigo: '637', nome: 'Banco Sofisa' },
  { codigo: '643', nome: 'Banco Pine' },
  { codigo: '655', nome: 'Banco Votorantim' },
  { codigo: '707', nome: 'Daycoval' },
  { codigo: '739', nome: 'Banco Cetelem' },
  { codigo: '745', nome: 'Citibank N.A.' },
  { codigo: '746', nome: 'Banco Modal' },
  { codigo: '747', nome: 'Rabobank' },
  { codigo: '748', nome: 'Sicredi Cooperativo' },
  { codigo: '751', nome: 'Scotiabank' },
  { codigo: '755', nome: 'Bank of America' },
  { codigo: '756', nome: 'Sicoob' },
];

export const TRANSPORTES = [
  {
    id: 'bike',
    label: 'Bicicleta',
    icon: 'bicycle',
    lib: 'Ionicons' as const,
    rate: 'R$ 6/corrida',
    desc: 'Sem placa, leve e econômico',
  },
  {
    id: 'moto',
    label: 'Moto',
    icon: 'motorbike',
    lib: 'MaterialCommunityIcons' as const,
    rate: 'R$ 10/corrida',
    desc: 'Rápido e mais alcance',
  },
  {
    id: 'carro',
    label: 'Carro',
    icon: 'car',
    lib: 'Ionicons' as const,
    rate: 'R$ 14/corrida',
    desc: 'Para volumes maiores',
  },
];

export const CORES_VEICULO = [
  { nome: 'Preto', hex: '#1a1a1a' },
  { nome: 'Branco', hex: '#e8e8e8' },
  { nome: 'Prata', hex: '#C0C0C0' },
  { nome: 'Cinza', hex: '#808080' },
  { nome: 'Azul', hex: '#1565C0' },
  { nome: 'Vermelho', hex: '#C62828' },
  { nome: 'Verde', hex: '#2E7D32' },
  { nome: 'Amarelo', hex: '#F9A825' },
  { nome: 'Laranja', hex: '#E65100' },
  { nome: 'Marrom', hex: '#6D4C41' },
  { nome: 'Bege', hex: '#D7CCC8' },
  { nome: 'Dourado', hex: '#B8860B' },
  { nome: 'Vinho', hex: '#880E4F' },
  { nome: 'Roxo', hex: '#6A1B9A' },
];

export const NOMES_CORES = CORES_VEICULO.map((c) => c.nome);
