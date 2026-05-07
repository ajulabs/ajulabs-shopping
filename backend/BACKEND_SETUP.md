⚙️ Setup para todos os devs
powershell# 1. Entrar na pasta
cd backend

# 2. Instalar dependências
pnpm install

# 3. Criar o arquivo .env (nunca vai pro Git!)
# Peça as credenciais para o Lucas

# 4. Gerar o Prisma Client
pnpm exec prisma generate

# 5. Sincronizar banco
pnpm exec prisma db push

# 6. Rodar o servidor
pnpm dev


📌 Regras gerais para todos

Sempre criar branch nova antes de começar (git checkout -b feature/nome-da-tarefa)
Nunca commitar o .env
Usar pnpm exec prisma generate após qualquer mudança no schema
Testar os endpoints com curl.exe antes de abrir PR
Abrir PR apontando para main quando terminar


🧪 Como testar suas rotas
powershell# Fazer login e salvar o token
curl.exe -X POST http://localhost:3000/auth/usuario/login \
  -H "Content-Type: application/json" \
  -d "{\"telefone\":\"+5579999991234\",\"senha\":\"123456\"}"

# Usar o token nas rotas protegidas
curl.exe http://localhost:3000/perfil \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"