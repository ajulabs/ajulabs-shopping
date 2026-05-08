// Seed limpo — sem dados mock.
// O fluxo de testes começa pelos cadastros no próprio app.
//
// Para resetar o banco:  pnpm db:reset
// Para recriar tabelas:  pnpm prisma:push
import { prisma } from '../src/utils/prisma';

async function main() {
  console.log('🌱 Seed vazio — banco pronto para uso real.');
  console.log('   Crie contas pelo app e teste o fluxo completo.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
