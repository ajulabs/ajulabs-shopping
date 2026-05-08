import { prisma } from '../src/utils/prisma';

async function main() {
  console.log('🗑️  Limpando banco de dados...\n');

  // Trunca todas as tabelas do schema public com CASCADE (resolve foreign keys automaticamente)
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('✅ Todas as tabelas limpas!\n');
  console.log('🎉 Banco de dados zerado. Pronto para testes reais.\n');
  console.log('Crie contas pelo app:');
  console.log('  • Consumer  → tela de registro');
  console.log('  • Lojista   → tela de cadastro');
  console.log('  • Entregador → tela de cadastro\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao limpar banco:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
