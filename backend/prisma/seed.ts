import { prisma } from '../src/utils/prisma';
import { hashSenha } from '../src/utils/bcrypt';

async function main() {
  console.log('🌱 Iniciando seed...');

  const senhaHash = await hashSenha('123456');

  // 1. Lojista
  const lojista = await prisma.lojista.upsert({
    where: { email: 'lojista@ajulabs.com' },
    update: {},
    create: {
      cnpj: '12345678000199',
      nomeResponsavel: 'João Silva',
      email: 'lojista@ajulabs.com',
      telefone: '+5579999998888',
      senhaHash,
    },
  });
  console.log('✅ Lojista criado');

  // 2. Loja
  const loja = await prisma.loja.upsert({
    where: { id: 'seed-loja-001' },
    update: {},
    create: {
      id: 'seed-loja-001',
      lojistaId: lojista.id,
      nome: 'Padaria do Bairro',
      descricao: 'Pães quentinhos todos os dias',
      categoria: 'Padaria',
      telefone: '+5579999997777',
      tempoEntregaMin: 20,
      tempoEntregaMax: 30,
      taxaEntrega: 5.0,
      endereco: {
        create: {
          rua: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cep: '49000000',
          cidade: 'Aracaju',
        },
      },
      horarios: {
        createMany: {
          data: [
            { diaSemana: 1, abertura: '06:00', fechamento: '20:00' },
            { diaSemana: 2, abertura: '06:00', fechamento: '20:00' },
            { diaSemana: 3, abertura: '06:00', fechamento: '20:00' },
            { diaSemana: 4, abertura: '06:00', fechamento: '20:00' },
            { diaSemana: 5, abertura: '06:00', fechamento: '20:00' },
            { diaSemana: 6, abertura: '06:00', fechamento: '14:00' },
            { diaSemana: 0, abertura: '00:00', fechamento: '00:00', ativo: false },
          ],
        },
      },
    },
  });
  console.log('✅ Loja criada');

  // 3. Produtos
  await prisma.produto.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'seed-produto-001',
        lojaId: loja.id,
        nome: 'Pão Francês',
        descricao: 'Crocante por fora e macio por dentro',
        preco: 0.5,
        estoque: 100,
        imagemUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        categoria: 'Pães',
        tags: ['pão', 'café da manhã'],
        destaque: true,
      },
      {
        id: 'seed-produto-002',
        lojaId: loja.id,
        nome: 'Croissant',
        descricao: 'Folhado e amanteigado',
        preco: 6.5,
        estoque: 50,
        imagemUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
        categoria: 'Pães',
        tags: ['croissant', 'francês'],
        destaque: true,
      },
      {
        id: 'seed-produto-003',
        lojaId: loja.id,
        nome: 'Bolo de Cenoura',
        descricao: 'Com cobertura de chocolate',
        preco: 12.0,
        estoque: 10,
        imagemUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
        categoria: 'Bolos',
        tags: ['bolo', 'cenoura'],
      },
    ],
  });
  console.log('✅ Produtos criados');

  // 4. Usuário
  const usuario = await prisma.usuario.upsert({
    where: { email: 'usuario@ajulabs.com' },
    update: {},
    create: {
      nome: 'Maria Santos',
      cpf: '11122233344',
      telefone: '+5579999991234',
      email: 'usuario@ajulabs.com',
      senhaHash,
      telefoneVerificado: true,
    },
  });
  console.log('✅ Usuário criado');

  // 5. Endereço
  await prisma.enderecoUsuario.upsert({
    where: { id: 'seed-endereco-001' },
    update: {},
    create: {
      id: 'seed-endereco-001',
      usuarioId: usuario.id,
      apelido: 'Casa',
      rua: 'Rua das Palmeiras',
      numero: '456',
      bairro: 'Jardins',
      cep: '49000100',
      cidade: 'Aracaju',
      padrao: true,
    },
  });
  console.log('✅ Endereço criado');

  console.log('\n🎉 Seed concluído!\n');
  console.log('📧 Login lojista: lojista@ajulabs.com / 123456');
  console.log('📱 Login usuário: usuario@ajulabs.com / 123456\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
