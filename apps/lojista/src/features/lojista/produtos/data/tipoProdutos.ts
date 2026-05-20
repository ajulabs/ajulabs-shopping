export interface EspecConfig {
  id: string;
  label: string;
  multiplo: boolean;
  opcoes: string[];
}

export interface SubcatConfig {
  id: string;
  nome: string;
  specs: EspecConfig[];
}

export interface CatConfig {
  id: string;
  nome: string;
  icon: string;
  isCustom?: boolean;
  subcats: SubcatConfig[];
}

export interface TipoProdutoValue {
  catId: string;
  subcatId: string;
  specs: Record<string, string[]>;
}

export const TIPOS_PRODUTO: CatConfig[] = [
  {
    id: 'eletronicos',
    nome: 'Eletrônicos',
    icon: 'cellphone',
    subcats: [
      {
        id: 'celular',
        nome: 'Celular / Smartphone',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Azul', 'Verde', 'Roxo', 'Dourado', 'Prata', 'Vermelho'] },
          { id: 'armazenamento', label: 'Armazenamento', multiplo: true, opcoes: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
        ],
      },
      {
        id: 'notebook',
        nome: 'Notebook / Computador',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Prata', 'Cinza', 'Branco'] },
          { id: 'armazenamento', label: 'Armazenamento', multiplo: true, opcoes: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB HDD'] },
        ],
      },
      {
        id: 'tablet',
        nome: 'Tablet',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Prata', 'Cinza', 'Branco', 'Dourado'] },
          { id: 'armazenamento', label: 'Armazenamento', multiplo: true, opcoes: ['64GB', '128GB', '256GB'] },
        ],
      },
      {
        id: 'fone',
        nome: 'Fone / Headphone',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Prata', 'Azul', 'Vermelho'] },
        ],
      },
      {
        id: 'eletrodomestico',
        nome: 'Eletrodoméstico',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Branco', 'Preto', 'Inox', 'Prata'] },
        ],
      },
    ],
  },
  {
    id: 'calcados',
    nome: 'Calçados',
    icon: 'shoe-sneaker',
    subcats: [
      {
        id: 'calcado-masculino',
        nome: 'Masculino',
        specs: [
          { id: 'tamanho', label: 'Numeração', multiplo: true, opcoes: ['38', '39', '40', '41', '42', '43', '44'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Marrom', 'Azul', 'Cinza', 'Bege'] },
        ],
      },
      {
        id: 'calcado-feminino',
        nome: 'Feminino',
        specs: [
          { id: 'tamanho', label: 'Numeração', multiplo: true, opcoes: ['33', '34', '35', '36', '37', '38', '39', '40'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Nude', 'Rosa', 'Azul', 'Marrom', 'Prata'] },
        ],
      },
      {
        id: 'calcado-infantil',
        nome: 'Infantil',
        specs: [
          { id: 'tamanho', label: 'Numeração', multiplo: true, opcoes: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'] },
        ],
      },
    ],
  },
  {
    id: 'roupas',
    nome: 'Roupas',
    icon: 'hanger',
    subcats: [
      {
        id: 'roupa-feminina',
        nome: 'Feminino',
        specs: [
          { id: 'tipo', label: 'Tipo de peça', multiplo: false, opcoes: ['Vestido', 'Blusa', 'Calça', 'Saia', 'Short', 'Casaco', 'Outro'] },
          { id: 'tamanho-letra', label: 'Tamanho (letra)', multiplo: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'] },
          { id: 'tamanho-numero', label: 'Tamanho (número)', multiplo: true, opcoes: ['34', '36', '38', '40', '42', '44', '46'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Azul', 'Rosa', 'Vermelho', 'Verde', 'Amarelo', 'Cinza', 'Bege'] },
        ],
      },
      {
        id: 'roupa-masculina',
        nome: 'Masculino',
        specs: [
          { id: 'tipo', label: 'Tipo de peça', multiplo: false, opcoes: ['Camisa', 'Camiseta', 'Calça', 'Bermuda', 'Moletom', 'Jaqueta', 'Outro'] },
          { id: 'tamanho', label: 'Tamanho', multiplo: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Azul', 'Cinza', 'Marinho', 'Verde', 'Vermelho'] },
        ],
      },
      {
        id: 'roupa-infantil',
        nome: 'Infantil',
        specs: [
          { id: 'tamanho', label: 'Tamanho', multiplo: true, opcoes: ['2', '4', '6', '8', '10', '12', '14', '16'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Azul', 'Rosa', 'Vermelho', 'Verde', 'Amarelo'] },
        ],
      },
    ],
  },
  {
    id: 'acessorios',
    nome: 'Acessórios',
    icon: 'bag-personal-outline',
    subcats: [
      {
        id: 'bolsa-mochila',
        nome: 'Bolsa / Mochila',
        specs: [
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Marrom', 'Bege', 'Branco', 'Azul', 'Vermelho'] },
        ],
      },
      {
        id: 'joias',
        nome: 'Joias / Bijuterias',
        specs: [
          { id: 'material', label: 'Material', multiplo: true, opcoes: ['Ouro', 'Prata', 'Rosê', 'Aço', 'Banhado a Ouro'] },
        ],
      },
      {
        id: 'relogio',
        nome: 'Relógio',
        specs: [
          { id: 'cor', label: 'Cor da caixa', multiplo: true, opcoes: ['Preto', 'Prata', 'Dourado', 'Rosê'] },
        ],
      },
    ],
  },
  {
    id: 'esporte',
    nome: 'Esporte',
    icon: 'soccer',
    subcats: [
      {
        id: 'futebol',
        nome: 'Futebol',
        specs: [
          { id: 'tamanho', label: 'Tamanho', multiplo: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo'] },
        ],
      },
      {
        id: 'academia',
        nome: 'Academia / Fitness',
        specs: [
          { id: 'tamanho', label: 'Tamanho', multiplo: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'] },
          { id: 'cor', label: 'Cor', multiplo: true, opcoes: ['Preto', 'Cinza', 'Branco', 'Azul', 'Rosa'] },
        ],
      },
    ],
  },
  {
    id: 'casa',
    nome: 'Casa / Deco',
    icon: 'home-outline',
    subcats: [
      {
        id: 'moveis',
        nome: 'Móveis',
        specs: [
          { id: 'cor', label: 'Cor / Acabamento', multiplo: true, opcoes: ['Branco', 'Preto', 'Madeira Clara', 'Madeira Escura', 'Cinza'] },
        ],
      },
      { id: 'decoracao', nome: 'Decoração', specs: [] },
      { id: 'utilidades', nome: 'Utilidades', specs: [] },
    ],
  },
  {
    id: 'beleza',
    nome: 'Beleza',
    icon: 'lipstick',
    subcats: [
      {
        id: 'maquiagem',
        nome: 'Maquiagem',
        specs: [
          { id: 'tipo', label: 'Tipo de produto', multiplo: false, opcoes: ['Base', 'Batom', 'Blush', 'Sombra', 'Rímel', 'Contorno', 'Iluminador', 'Primer'] },
          { id: 'cor', label: 'Tom / Cor', multiplo: true, opcoes: ['Nude', 'Rosa', 'Vermelho', 'Coral', 'Marrom', 'Bege', 'Claro', 'Médio', 'Escuro'] },
        ],
      },
      {
        id: 'perfumaria',
        nome: 'Perfumaria',
        specs: [
          { id: 'tipo', label: 'Tipo', multiplo: false, opcoes: ['Perfume', 'Colônia', 'Desodorante', 'Body Splash'] },
          { id: 'volume', label: 'Volume', multiplo: true, opcoes: ['30ml', '50ml', '75ml', '100ml', '200ml'] },
        ],
      },
      {
        id: 'cabelos',
        nome: 'Cabelos',
        specs: [
          { id: 'tipo', label: 'Tipo de produto', multiplo: false, opcoes: ['Shampoo', 'Condicionador', 'Máscara', 'Óleo', 'Leave-in', 'Finalizador'] },
          { id: 'tipo-cabelo', label: 'Para cabelo', multiplo: true, opcoes: ['Liso', 'Ondulado', 'Cacheado', 'Crespo', 'Tingido', 'Seco', 'Oleoso'] },
        ],
      },
    ],
  },
  {
    id: 'alimentos',
    nome: 'Alimentos',
    icon: 'food-apple-outline',
    subcats: [
      { id: 'alimentos-geral', nome: 'Geral', specs: [] },
      { id: 'bebidas', nome: 'Bebidas', specs: [] },
      { id: 'doces', nome: 'Doces / Confeitaria', specs: [] },
    ],
  },
  {
    id: 'outros',
    nome: 'Outros',
    icon: 'shape-outline',
    isCustom: true,
    subcats: [],
  },
];

export function getCatNome(catId: string): string {
  return TIPOS_PRODUTO.find(c => c.id === catId)?.nome ?? catId;
}

export function getSubcatNome(catId: string, subcatId: string, specs?: Record<string, string[]>): string {
  if (subcatId === '__custom__') return specs?.['_tipo']?.[0] ?? 'Personalizado';
  const cat = TIPOS_PRODUTO.find(c => c.id === catId);
  return cat?.subcats.find(s => s.id === subcatId)?.nome ?? subcatId;
}

export function derivarCategoriaString(v: TipoProdutoValue): string {
  const subNome = getSubcatNome(v.catId, v.subcatId, v.specs);
  return subNome ? `${getCatNome(v.catId)} - ${subNome}` : getCatNome(v.catId);
}

export function derivarVariacoes(v: TipoProdutoValue): string[] {
  const sizes: string[] = [];
  for (const specId of ['tamanho', 'tamanho-letra', 'tamanho-numero']) {
    if (v.specs[specId]) sizes.push(...v.specs[specId]);
  }
  return sizes;
}
