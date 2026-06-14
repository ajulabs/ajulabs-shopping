// Script de TESTE: cria/atualiza um entregador com foto pendente, para testar
// o fluxo de moderação sem precisar subir foto pelo app.
//
// Uso (PowerShell):
//   pnpm --filter @ajulabs/backend exec tsx prisma/seed-foto-pendente.ts
//
// Depois, no painel ou via curl, a foto deve aparecer em /admin/fotos/pendentes.
// Para limpar, rode de novo (ele reaproveita o mesmo entregador de teste).
import { prisma } from '../src/utils/prisma';
import { hashSenha } from '../src/utils/bcrypt';

async function main() {
  const email = 'teste-moderacao@ajulabs.com';
  const senhaHash = await hashSenha('Teste1234');

  const entregador = await prisma.entregador.upsert({
    where: { email },
    update: {
      fotoPendenteUrl: 'https://placehold.co/400x400/png?text=Foto+Teste',
      fotoStatus: 'pendente',
      fotoEnviadaEm: new Date(),
    },
    create: {
      nome: 'Entregador Teste Moderação',
      cpf: '00000000191',
      telefone: '79999990000',
      email,
      senhaHash,
      tipoTransporte: 'moto',
      fotoPendenteUrl: 'https://placehold.co/400x400/png?text=Foto+Teste',
      fotoStatus: 'pendente',
      fotoEnviadaEm: new Date(),
    },
  });

  console.log(`✅ Entregador de teste com foto pendente: ${entregador.id}`);
  console.log('   Agora liste em GET /v1/admin/fotos/pendentes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
