import { Loja, Produto, Pedido, Usuario, Categoria } from '../types';

// ─── Categorias ───────────────────────────────────────────────

export const CATEGORIAS: Categoria[] = [
  { id: 'restaurante', nome: 'Restaurantes', emoji: '🍽️' },
  { id: 'lanche', nome: 'Lanches', emoji: '🍔' },
  { id: 'mercado', nome: 'Mercado', emoji: '🛒' },
  { id: 'farmacia', nome: 'Farmácia', emoji: '💊' },
  { id: 'doce', nome: 'Doces', emoji: '🍰' },
  { id: 'bebida', nome: 'Bebidas', emoji: '🥤' },
  { id: 'calcados', nome: 'Calçados', emoji: '👟' },
  { id: 'eletronico', nome: 'Eletrônicos', emoji: '🎧' },
];

// ─── Lojas ────────────────────────────────────────────────────

export const LOJAS: Loja[] = [
  {
    id: 'loja-001',
    nome: 'Caju & Cia',
    descricao: 'Sabores sergipanos com ingredientes frescos do mercado local',
    categoria: 'restaurante',
    imagem: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    endereco: {
      rua: 'Rua João Pessoa',
      numero: '342',
      bairro: 'Centro',
      cidade: 'Aracaju',
      cep: '49010-050',
    },
    avaliacao: 4.8,
    totalAvaliacoes: 312,
    tempoEntregaMin: 25,
    tempoEntregaMax: 40,
    taxaEntrega: 4.99,
    aberta: true,
    destaque: true,
  },
  {
    id: 'loja-002',
    nome: 'Burguer do Bairro',
    descricao: 'Hambúrgueres artesanais feitos na hora com pão brioche',
    categoria: 'lanche',
    imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    endereco: {
      rua: 'Av. Beira Mar',
      numero: '1200',
      bairro: 'Atalaia',
      cidade: 'Aracaju',
      cep: '49037-080',
    },
    avaliacao: 4.6,
    totalAvaliacoes: 189,
    tempoEntregaMin: 30,
    tempoEntregaMax: 45,
    taxaEntrega: 5.99,
    aberta: true,
    destaque: true,
  },
  {
    id: 'loja-003',
    nome: 'Mercadinho São João',
    descricao: 'Produtos frescos, hortifruti e mercearia direto pra sua porta',
    categoria: 'mercado',
    imagem: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    endereco: {
      rua: 'Rua Santa Luzia',
      numero: '88',
      bairro: 'Salgado Filho',
      cidade: 'Aracaju',
      cep: '49045-060',
    },
    avaliacao: 4.5,
    totalAvaliacoes: 97,
    tempoEntregaMin: 20,
    tempoEntregaMax: 35,
    taxaEntrega: 3.99,
    aberta: true,
  },
  {
    id: 'loja-004',
    nome: 'Farmácia Sergipe',
    descricao: 'Medicamentos, perfumaria e produtos de saúde com entrega rápida',
    categoria: 'farmacia',
    imagem: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&q=80',
    endereco: {
      rua: 'Av. Francisco Porto',
      numero: '550',
      bairro: 'Jardins',
      cidade: 'Aracaju',
      cep: '49025-010',
    },
    avaliacao: 4.7,
    totalAvaliacoes: 54,
    tempoEntregaMin: 15,
    tempoEntregaMax: 30,
    taxaEntrega: 2.99,
    aberta: true,
  },
  {
    id: 'loja-005',
    nome: 'Doceria Marisol',
    descricao: 'Bolos, doces e sobremesas artesanais para adoçar seu dia',
    categoria: 'doce',
    imagem: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
    endereco: {
      rua: 'Rua Itabaianinha',
      numero: '210',
      bairro: 'Centro',
      cidade: 'Aracaju',
      cep: '49010-150',
    },
    avaliacao: 4.9,
    totalAvaliacoes: 223,
    tempoEntregaMin: 35,
    tempoEntregaMax: 55,
    taxaEntrega: 6.99,
    aberta: false,
  },
  {
    id: 'loja-006',
    nome: 'Loja do Chico',
    descricao: 'Calçados masculinos e femininos com entrega rápida',
    categoria: 'calcados',
    imagem: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    endereco: {
      rua: 'Av. Hermes Fontes',
      numero: '789',
      bairro: 'Suíssa',
      cidade: 'Aracaju',
      cep: '49050-105',
    },
    avaliacao: 4.7,
    totalAvaliacoes: 156,
    tempoEntregaMin: 25,
    tempoEntregaMax: 40,
    taxaEntrega: 8.90,
    aberta: true,
  },
  {
    id: 'loja-007',
    nome: 'EletroPonto',
    descricao: 'Eletrônicos e acessórios — frete grátis acima de R$ 200',
    categoria: 'eletronico',
    imagem: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    endereco: {
      rua: 'Rua Laranjeiras',
      numero: '321',
      bairro: 'Centro',
      cidade: 'Aracaju',
      cep: '49010-200',
    },
    avaliacao: 4.6,
    totalAvaliacoes: 89,
    tempoEntregaMin: 20,
    tempoEntregaMax: 35,
    taxaEntrega: 0,
    aberta: true,
  },
];

// ─── Produtos ─────────────────────────────────────────────────

export const PRODUTOS: Produto[] = [
  // Caju & Cia
  {
    id: 'prod-001', lojaId: 'loja-001',
    nome: 'Moqueca Sergipana', descricao: 'Moqueca de peixe com dendê, leite de coco e pirão',
    preco: 45.90, imagem: 'https://images.unsplash.com/photo-1536510233921-8e00b5a2a4fb?w=400&q=80',
    categoria: 'restaurante', disponivel: true, destaque: true,
  },
  {
    id: 'prod-002', lojaId: 'loja-001',
    nome: 'Caruru Típico', descricao: 'Prato típico sergipano com quiabo, camarão seco e amendoim',
    preco: 38.50, imagem: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
    categoria: 'restaurante', disponivel: true,
  },
  {
    id: 'prod-003', lojaId: 'loja-001',
    nome: 'Suco de Mangaba', descricao: 'Fruta típica de Sergipe, refrescante e natural',
    preco: 12.00, imagem: 'https://images.unsplash.com/photo-1622597467836-f3e6d8cc2b42?w=400&q=80',
    categoria: 'bebida', disponivel: true,
  },
  // Burguer do Bairro
  {
    id: 'prod-004', lojaId: 'loja-002',
    nome: 'Smash Clássico', descricao: 'Blend 180g, queijo cheddar, alface, tomate e molho da casa',
    preco: 32.90, imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    categoria: 'lanche', disponivel: true, destaque: true,
  },
  {
    id: 'prod-005', lojaId: 'loja-002',
    nome: 'Duplo Bacon', descricao: 'Dois blends 120g, bacon crocante, cheddar e cebola caramelizada',
    preco: 42.90, imagem: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80',
    categoria: 'lanche', disponivel: true,
  },
  // Mercadinho São João
  {
    id: 'prod-006', lojaId: 'loja-003',
    nome: 'Combo Hortifruti', descricao: 'Mix de folhas, tomate, cenoura e pepino frescos',
    preco: 18.90, imagem: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    categoria: 'mercado', disponivel: true, destaque: true,
  },
  {
    id: 'prod-007', lojaId: 'loja-003',
    nome: 'Água Mineral 1,5L', descricao: 'Água mineral natural sem gás',
    preco: 4.50, imagem: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',
    categoria: 'bebida', disponivel: true,
  },
  // Farmácia
  {
    id: 'prod-008', lojaId: 'loja-004',
    nome: 'Dipirona 500mg', descricao: 'Caixa com 20 comprimidos — analgésico e antitérmico',
    preco: 8.90, imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    categoria: 'farmacia', disponivel: true,
  },
  // Doceria Marisol
  {
    id: 'prod-009', lojaId: 'loja-005',
    nome: 'Bolo de Tapioca', descricao: 'Bolo úmido de tapioca com coco ralado fresco',
    preco: 28.00, imagem: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    categoria: 'doce', disponivel: true, destaque: true,
  },
  {
    id: 'prod-010', lojaId: 'loja-006',
    nome: 'Tênis Runner Preto', descricao: 'Tênis esportivo com amortecimento e solado emborrachado',
    preco: 189.90, imagem: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    categoria: 'calcados', disponivel: true, destaque: true,
  },
  {
    id: 'prod-011', lojaId: 'loja-007',
    nome: 'Fone Bluetooth JLX 9', descricao: 'Headphone over-ear com 30h de bateria e cancelamento de ruído',
    preco: 249.00, imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    categoria: 'eletronico', disponivel: true, destaque: true,
  },
];

// ─── Usuário mock ─────────────────────────────────────────────

export const USUARIO_MOCK: Usuario = {
  id: 'user-001',
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '(79) 99999-1234',
  endereco: {
    rua: 'Rua Laranjeiras',
    numero: '45',
    bairro: 'Suíssa',
    cidade: 'Aracaju',
    cep: '49045-020',
  },
};

// ─── Pedidos mock ─────────────────────────────────────────────

export const PEDIDOS_MOCK: Pedido[] = [
  {
    id: 'ped-001',
    lojaId: 'loja-001',
    lojaNome: 'Caju & Cia',
    consumidorId: 'user-001',
    itens: [
      { produto: PRODUTOS[0], quantidade: 1, precoUnitario: 45.90 },
      { produto: PRODUTOS[2], quantidade: 2, precoUnitario: 12.00 },
    ],
    status: 'saiu_entrega',
    enderecoEntrega: USUARIO_MOCK.endereco!,
    subtotal: 69.90,
    taxaEntrega: 4.99,
    total: 74.89,
    criadoEm: new Date(Date.now() - 25 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
    estimativaEntrega: new Date(Date.now() + 15 * 60000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────

export const getProdutosByLoja = (lojaId: string): Produto[] =>
  PRODUTOS.filter(p => p.lojaId === lojaId && p.disponivel);

export const getLojaById = (id: string): Loja | undefined =>
  LOJAS.find(l => l.id === id);

export const getLojasAbertas = (): Loja[] =>
  LOJAS.filter(l => l.aberta);

export const getLojasByCategoria = (categoria: string): Loja[] =>
  LOJAS.filter(l => l.categoria === categoria && l.aberta);