// Cria um administrador de plataforma. Use para o primeiro acesso ao painel.
//
// Uso (PowerShell):
//   $env:ADMIN_NOME="Seu Nome"; $env:ADMIN_EMAIL="voce@ajulabs.com"; $env:ADMIN_SENHA="umaSenhaForte123"; pnpm --filter @ajulabs/backend exec tsx prisma/create-admin.ts
//
// Uso (bash):
//   ADMIN_NOME="Seu Nome" ADMIN_EMAIL="voce@ajulabs.com" ADMIN_SENHA="umaSenhaForte123" pnpm --filter @ajulabs/backend exec tsx prisma/create-admin.ts
//
// Se o admin já existir (mesmo email), a senha é atualizada.
import { prisma } from '../src/utils/prisma';
import { hashSenha } from '../src/utils/bcrypt';

async function main() {
  const nome = process.env.ADMIN_NOME;
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;

  if (!nome || !email || !senha) {
    console.error('❌ Defina ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA nas variáveis de ambiente.');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error('❌ A senha deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const senhaHash = await hashSenha(senha);
  const admin = await prisma.adminPlataforma.upsert({
    where: { email },
    update: { senhaHash, nome, ativo: true },
    create: { nome, email, senhaHash, papel: 'superadmin' },
  });

  console.log(`✅ Admin pronto: ${admin.nome} <${admin.email}> (papel: ${admin.papel})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
