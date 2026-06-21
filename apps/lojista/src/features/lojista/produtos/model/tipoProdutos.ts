export interface EspecConfig {
  id: string;
  label: string;
  multiplo: boolean;
  opcoes: string[];
  hideForTipos?: string[];
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
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Azul', 'Verde', 'Roxo', 'Dourado', 'Prata', 'Vermelho'],
          },
          {
            id: 'armazenamento',
            label: 'Armazenamento',
            multiplo: true,
            opcoes: ['64GB', '128GB', '256GB', '512GB', '1TB'],
          },
        ],
      },
      {
        id: 'notebook',
        nome: 'Notebook / Computador',
        specs: [
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Prata', 'Cinza', 'Branco'],
          },
          {
            id: 'armazenamento',
            label: 'Armazenamento',
            multiplo: true,
            opcoes: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB HDD'],
          },
        ],
      },
      {
        id: 'tablet',
        nome: 'Tablet',
        specs: [
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Prata', 'Cinza', 'Branco', 'Dourado'],
          },
          {
            id: 'armazenamento',
            label: 'Armazenamento',
            multiplo: true,
            opcoes: ['64GB', '128GB', '256GB'],
          },
        ],
      },
      {
        id: 'fone',
        nome: 'Fone / Headphone',
        specs: [
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Prata', 'Azul', 'Vermelho'],
          },
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
          {
            id: 'tamanho',
            label: 'Numeração',
            multiplo: true,
            opcoes: ['38', '39', '40', '41', '42', '43', '44'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Marrom', 'Azul', 'Cinza', 'Bege'],
          },
        ],
      },
      {
        id: 'calcado-feminino',
        nome: 'Feminino',
        specs: [
          {
            id: 'tamanho',
            label: 'Numeração',
            multiplo: true,
            opcoes: ['33', '34', '35', '36', '37', '38', '39', '40'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Nude', 'Rosa', 'Azul', 'Marrom', 'Prata'],
          },
        ],
      },
      {
        id: 'calcado-infantil',
        nome: 'Infantil',
        specs: [
          {
            id: 'tamanho',
            label: 'Numeração',
            multiplo: true,
            opcoes: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'],
          },
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
          {
            id: 'tipo',
            label: 'Tipo de peça',
            multiplo: false,
            opcoes: ['Vestido', 'Blusa', 'Calça', 'Saia', 'Short', 'Casaco', 'Íntima', 'Outro'],
          },
          {
            id: 'tamanho-letra',
            label: 'Tamanho (letra)',
            multiplo: true,
            opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
          },
          {
            id: 'tamanho-numero',
            label: 'Tamanho (número)',
            multiplo: true,
            opcoes: ['34', '36', '38', '40', '42', '44', '46'],
            hideForTipos: ['Íntima'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: [
              'Preto',
              'Branco',
              'Azul',
              'Rosa',
              'Vermelho',
              'Verde',
              'Amarelo',
              'Cinza',
              'Bege',
            ],
          },
        ],
      },
      {
        id: 'roupa-masculina',
        nome: 'Masculino',
        specs: [
          {
            id: 'tipo',
            label: 'Tipo de peça',
            multiplo: false,
            opcoes: [
              'Camisa',
              'Camiseta',
              'Calça',
              'Bermuda',
              'Moletom',
              'Jaqueta',
              'Íntima',
              'Outro',
            ],
          },
          {
            id: 'tamanho',
            label: 'Tamanho',
            multiplo: true,
            opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Azul', 'Cinza', 'Marinho', 'Verde', 'Vermelho'],
          },
        ],
      },
      {
        id: 'roupa-infantil',
        nome: 'Infantil',
        specs: [
          {
            id: 'tamanho',
            label: 'Tamanho',
            multiplo: true,
            opcoes: ['2', '4', '6', '8', '10', '12', '14', '16'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Azul', 'Rosa', 'Vermelho', 'Verde', 'Amarelo'],
          },
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
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Marrom', 'Bege', 'Branco', 'Azul', 'Vermelho'],
          },
        ],
      },
      {
        id: 'joias',
        nome: 'Joias / Bijuterias',
        specs: [
          {
            id: 'material',
            label: 'Material',
            multiplo: true,
            opcoes: ['Ouro', 'Prata', 'Rosê', 'Aço', 'Banhado a Ouro'],
          },
        ],
      },
      {
        id: 'relogio',
        nome: 'Relógio',
        specs: [
          {
            id: 'cor',
            label: 'Cor da caixa',
            multiplo: true,
            opcoes: ['Preto', 'Prata', 'Dourado', 'Rosê'],
          },
        ],
      },
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
          {
            id: 'tipo',
            label: 'Tipo de produto',
            multiplo: false,
            opcoes: [
              'Base',
              'Batom',
              'Blush',
              'Sombra',
              'Rímel',
              'Contorno',
              'Iluminador',
              'Primer',
            ],
          },
          {
            id: 'cor',
            label: 'Tom / Cor',
            multiplo: true,
            opcoes: [
              'Nude',
              'Rosa',
              'Vermelho',
              'Coral',
              'Marrom',
              'Bege',
              'Claro',
              'Médio',
              'Escuro',
            ],
          },
        ],
      },
      {
        id: 'perfumaria',
        nome: 'Perfumaria',
        specs: [
          {
            id: 'tipo',
            label: 'Tipo',
            multiplo: false,
            opcoes: ['Perfume', 'Colônia', 'Desodorante', 'Body Splash'],
          },
          {
            id: 'volume',
            label: 'Volume',
            multiplo: true,
            opcoes: ['30ml', '50ml', '75ml', '100ml', '200ml'],
          },
        ],
      },
      {
        id: 'cabelos',
        nome: 'Cabelos',
        specs: [
          {
            id: 'tipo',
            label: 'Tipo de produto',
            multiplo: false,
            opcoes: ['Shampoo', 'Condicionador', 'Máscara', 'Óleo', 'Leave-in', 'Finalizador'],
          },
          {
            id: 'tipo-cabelo',
            label: 'Para cabelo',
            multiplo: true,
            opcoes: ['Liso', 'Ondulado', 'Cacheado', 'Crespo', 'Tingido', 'Seco', 'Oleoso'],
          },
        ],
      },
    ],
  },
  {
    id: 'esporte',
    nome: 'Esporte',
    icon: 'soccer',
    // Subcategorias por TIPO de produto (não por modalidade): só vestuário usa
    // numeração de roupa. Bola/equipamento são item único, sem tamanho de roupa.
    subcats: [
      {
        id: 'vestuario',
        nome: 'Roupa / Uniforme',
        specs: [
          {
            id: 'tamanho',
            label: 'Tamanho',
            multiplo: true,
            opcoes: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
          },
          {
            id: 'cor',
            label: 'Cor',
            multiplo: true,
            opcoes: ['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo'],
          },
        ],
      },
      { id: 'bola', nome: 'Bola', specs: [] },
      { id: 'equipamento', nome: 'Equipamento / Acessório', specs: [] },
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
          {
            id: 'cor',
            label: 'Cor / Acabamento',
            multiplo: true,
            opcoes: ['Branco', 'Preto', 'Madeira Clara', 'Madeira Escura', 'Cinza'],
          },
        ],
      },
      { id: 'decoracao', nome: 'Decoração', specs: [] },
      { id: 'utilidades', nome: 'Utilidades', specs: [] },
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
  return TIPOS_PRODUTO.find((c) => c.id === catId)?.nome ?? catId;
}

export function getSubcatNome(
  catId: string,
  subcatId: string,
  specs?: Record<string, string[]>,
): string {
  if (subcatId === '__custom__') return specs?.['_tipo']?.[0] ?? 'Personalizado';
  const cat = TIPOS_PRODUTO.find((c) => c.id === catId);
  return cat?.subcats.find((s) => s.id === subcatId)?.nome ?? subcatId;
}

export function derivarCategoriaString(v: TipoProdutoValue): string {
  const cat = TIPOS_PRODUTO.find((c) => c.id === v.catId);
  const subcat = cat?.subcats.find((s) => s.id === v.subcatId);
  const subNome = getSubcatNome(v.catId, v.subcatId, v.specs);

  const singleSpecValues = (subcat?.specs ?? [])
    .filter((s) => !s.multiplo)
    .map((s) => v.specs[s.id]?.[0])
    .filter((val): val is string => !!val);

  const parts = [getCatNome(v.catId)];
  if (subNome) parts.push(subNome);
  parts.push(...singleSpecValues);

  return parts.join(' - ');
}

/**
 * Em "Esporte" a categoria vinda da IA é uma modalidade ("Futebol", "Academia"),
 * não um tipo de produto. Decidimos a subcategoria pelo nome/descrição: bola e
 * equipamento NÃO usam numeração de roupa; só vestuário usa PP/P/M/G.
 */
function inferirSubcatEsporteId(texto: string): 'vestuario' | 'bola' | 'equipamento' {
  if (/\bbolas?\b/.test(texto)) return 'bola';
  if (
    /\b(roupa|uniforme|camisa|camiseta|regata|short|bermuda|calca|calcao|meiao|agasalho|moletom|legging|jaqueta|blusa|top)\b/.test(
      texto,
    )
  )
    return 'vestuario';
  return 'equipamento';
}

export function inferirTipoProduto(data: Record<string, unknown>): TipoProdutoValue | null {
  const categoria = typeof data.categoria === 'string' ? data.categoria : '';
  if (!categoria) return null;

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  const parts = categoria.split(/\s+-\s+/);
  const catPart = norm(parts[0]);
  const subcatPart = parts[1] ? norm(parts[1]) : null;
  const singleSpecParts = parts.slice(2).map(norm);

  const matchedCat = TIPOS_PRODUTO.find((cat) => {
    const n = norm(cat.nome);
    return n === catPart || catPart.startsWith(n) || n.startsWith(catPart);
  });

  if (!matchedCat) return null;

  let matchedSubcat: SubcatConfig | undefined;
  if (matchedCat.subcats.length > 0) {
    if (matchedCat.id === 'esporte') {
      const nome = typeof data.nome === 'string' ? data.nome : '';
      const subId = inferirSubcatEsporteId(norm(`${nome} ${categoria}`));
      matchedSubcat = matchedCat.subcats.find((s) => s.id === subId);
    } else if (subcatPart) {
      matchedSubcat = matchedCat.subcats.find((sub) => {
        const n = norm(sub.nome);
        return n === subcatPart || n.includes(subcatPart) || subcatPart.includes(n);
      });
    }
    if (!matchedSubcat) matchedSubcat = matchedCat.subcats[0];
  }

  const specs: Record<string, string[]> = {};
  if (matchedSubcat) {
    for (const spec of matchedSubcat.specs) {
      // tenta spec.id exato → variante underscore → chave base (ex: "tamanho-letra" → "tamanho")
      const baseId = spec.id.includes('-') ? spec.id.split('-')[0] : null;
      const raw =
        data[spec.id] ?? data[spec.id.replace(/-/g, '_')] ?? (baseId ? data[baseId] : undefined);
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : [raw])
        .map((v) => String(v))
        .map((v) => spec.opcoes.find((opt) => norm(opt) === norm(v)) ?? null)
        .filter((v): v is string => v !== null);
      if (values.length > 0) specs[spec.id] = values;
    }

    // Recupera specs multiplo:false das partes extras da string de categoria
    // ex: "Roupas - Masculino - Camisa" → singleSpecParts = ["camisa"]
    const singleSpecs = matchedSubcat.specs.filter((s) => !s.multiplo);
    singleSpecParts.forEach((part, idx) => {
      const spec = singleSpecs[idx];
      if (!spec || specs[spec.id]) return;
      const matched = spec.opcoes.find((opt) => norm(opt) === part);
      if (matched) specs[spec.id] = [matched];
    });
  }

  return {
    catId: matchedCat.id,
    subcatId: matchedSubcat?.id ?? '',
    specs,
  };
}
