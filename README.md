# AjuLabs — Monorepo

Marketplace local de Aracaju conectando consumidores e lojistas com entrega rápida e assistente de compras com IA (Aju).

Três apps mobile independentes + backend Node.js, compartilhando código via packages internos.

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| React Native | 0.81 | Framework mobile |
| Expo SDK | 54 | Build, dev tools, OTA updates |
| Expo Router | 6 | Roteamento file-based |
| NativeWind | 4 | Tailwind CSS no React Native |
| Zustand | 5 | Estado global |
| TanStack Query | 5 | Cache e sincronização de dados |
| React Hook Form + Zod | 7 / 4 | Formulários e validação |
| OpenAI API | — | Assistente de compras Aju |
| pnpm | 10+ | Gerenciador de pacotes (workspaces) |
| TypeScript | 5.9 | Tipagem estática |
| Node.js + Express | — | Backend REST API |
| Prisma | — | ORM + migrações |
| PostgreSQL | — | Banco de dados |

---

## Estrutura do monorepo

```
ajulabs/
├── apps/
│   ├── consumer/              App do consumidor (marketplace, chat Aju, carrinho)
│   ├── lojista/               App do lojista (dashboard, pedidos, produtos)
│   └── entregador/            App do entregador (rotas, GPS, entregas)
│
├── packages/
│   ├── types/                 Interfaces TypeScript compartilhadas (Loja, Pedido, etc.)
│   ├── theme/                 Cores e tokens de design
│   └── api-client/            Services + mock de dados (vira API real no futuro)
│
├── backend/                   API Node.js + Express + Prisma
│
├── pnpm-workspace.yaml        Define os workspaces
├── tsconfig.base.json         Config TypeScript compartilhada
├── .npmrc                     Config do pnpm (hoisting pro Expo)
└── package.json               Scripts globais
```

---

## Pré-requisitos

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 10+** — `npm install -g pnpm`
- **Git** — [git-scm.com](https://git-scm.com)
- **Expo Go** no celular — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)

> **Importante:** usamos `pnpm`, não `npm` nem `yarn`. Os workspaces só funcionam com pnpm.

---

## Setup — Frontend (apps mobile)

### 1. Instalar dependências

```bash
git clone https://github.com/SEU_USUARIO/ajulabs-shopping-frontend.git
cd ajulabs-shopping-frontend
pnpm install
```

### 2. Variáveis de ambiente

Crie `apps/consumer/.env` com:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/
```

O `.env` nunca é commitado.

### 3. Rodar os apps

Da **raiz do monorepo**:

```bash
pnpm consumer      # App do consumidor (marketplace)
pnpm lojista       # App do lojista (gestão de pedidos/produtos)
pnpm entregador    # App do entregador (rastreamento)
```

Cada comando abre o Metro Bundler com um QR code. Escaneie com o Expo Go no celular.

> Só é possível rodar 1 app por vez (cada um ocupa a porta 8081). Para trocar, faça `Ctrl+C` e rode o outro.

### Outros comandos úteis

```bash
pnpm typecheck          # Verificar tipos em todos os workspaces
pnpm consumer:android   # Rodar direto no Android
pnpm consumer:ios       # Rodar direto no iOS

# Limpar cache do Metro (quando der erro estranho)
cd apps/consumer && npx expo start --clear
```

---

## Setup — Backend

### 1. Entrar na pasta e instalar dependências

```bash
cd backend
pnpm install
```

### 2. Variáveis de ambiente

Copie o exemplo e preencha com as credenciais:

```bash
cp backend/.env.example backend/.env
```

```bash
DATABASE_URL=postgresql://...        # Supabase (pooler)
DIRECT_URL=postgresql://...          # Supabase (direto, usado pelo Prisma)
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

PORT=3000
NODE_ENV=development
JWT_SECRET=segredo-longo-aleatorio
JWT_REFRESH_SECRET=outro-segredo-longo
OPENAI_API_KEY=sk-...                # Chave da OpenAI (chat da Aju)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALLOWED_ORIGINS=                     # Vazio em dev (aceita qualquer origem)
```

O `.env` nunca vai pro Git.

### 3. Configurar o banco de dados

```bash
pnpm prisma:generate   # Gera o Prisma Client
pnpm prisma:push       # Sincroniza o schema com o banco
```

> Rode `pnpm prisma:generate` sempre que alterar o `schema.prisma`.

### 4. Rodar o servidor

```bash
pnpm dev
```

O servidor sobe em `http://localhost:3000`.

### Scripts disponíveis do backend

```bash
pnpm dev              # Servidor em modo watch (desenvolvimento)
pnpm build            # Compilar TypeScript
pnpm start            # Rodar build de produção
pnpm prisma:studio    # Interface visual do banco (Prisma Studio)
pnpm prisma:seed      # Popular o banco com dados iniciais
pnpm db:reset         # Resetar o banco
```

### Testar rotas com curl

```bash
# Fazer login e salvar o token
curl.exe -X POST http://localhost:3000/auth/usuario/login \
  -H "Content-Type: application/json" \
  -d "{\"telefone\":\"+5579999991234\",\"senha\":\"123456\"}"

# Usar o token nas rotas protegidas
curl.exe http://localhost:3000/perfil \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Arquitetura dos apps

Cada app segue **Feature-Sliced Design** adaptado para React Native:

```
apps/consumer/
├── app/                       Rotas (Expo Router) — só importam e renderizam features
│   ├── (consumer)/
│   │   ├── _layout.tsx        Tab navigator
│   │   ├── chat.tsx           → importa ChatIA
│   │   ├── vitrines.tsx       → importa VitrinesList
│   │   └── ...
│   └── _layout.tsx            Root layout
│
├── src/
│   ├── features/consumer/     Telas organizadas por domínio
│   │   ├── cart/ui/
│   │   ├── chat/ui/
│   │   ├── vitrines/ui/
│   │   └── ...
│   ├── store/                 Estado global (Zustand)
│   └── components/            Componentes genéricos (usados em 2+ features)
│
└── assets/                    Ícones, imagens, fontes
```

### Regras

- **`app/`** — só roteamento. Sem lógica.
- **`features/`** — todo código de tela vive aqui. Cada feature tem `ui/` e `index.ts`.
- **`components/`** — só componentes usados em 2+ features.
- **`store/`** — estado global compartilhado (carrinho, usuário, preferências).

### Packages compartilhados

| Package | Import | O que contém |
|---|---|---|
| `@ajulabs/types` | `import { Loja } from '@ajulabs/types'` | Interfaces: Loja, Produto, Pedido, Usuario, etc. |
| `@ajulabs/theme` | `import { colors } from '@ajulabs/theme'` | Paleta de cores e tokens de design |
| `@ajulabs/api-client` | `import { LojaService } from '@ajulabs/api-client'` | Services + mock data + chat Aju |

> **Regra:** nunca importe com path relativo. Sempre use `@ajulabs/*`.

---

## Fluxo Git

```bash
# Antes de começar qualquer tarefa
git checkout main && git pull origin main

# Criar branch
git checkout -b feat/consumer-checkout
git checkout -b fix/cart-total-bug

# Commitar
git add .
git commit -m "feat(consumer): add checkout screen with address form"

# Subir e abrir PR
git push origin feat/consumer-checkout
```

### Padrão de commits (Conventional Commits)

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Nova funcionalidade | `feat(consumer): add cart screen` |
| `fix` | Correção de bug | `fix(cart): total not updating on remove` |
| `refactor` | Refatoração sem mudança funcional | `refactor(checkout): extract AddressCard` |
| `style` | Ajuste visual sem lógica | `style(vitrine): fix card border radius` |
| `chore` | Config, deps, estrutura | `chore(lojista): add expo-camera dependency` |

### Escopos comuns

`consumer` · `lojista` · `entregador` · `types` · `api-client` · `theme` · `monorepo` · `backend`

> **Nunca faça push direto na main.** Todo código entra via Pull Request.

---

## Trabalhando com packages

### Adicionar uma dependência

```bash
# No consumer
cd apps/consumer && pnpm add nome-do-pacote

# Num package compartilhado
cd packages/api-client && pnpm add nome-do-pacote
```

### Mudar um tipo

1. Edite `packages/types/src/index.ts`
2. Rode `pnpm typecheck` — mostra todos os arquivos afetados
3. Corrija nos apps afetados
4. Commite tudo no mesmo PR

### Quando o backend estiver pronto

Só mude `packages/api-client/`. Os services já têm a interface certa — troque o mock por `fetch` real. Os 3 apps continuam funcionando sem nenhuma mudança.

---

## Troubleshooting

**"Unable to resolve module" ao rodar o app**
```bash
cd apps/consumer && npx expo start --clear
```

**Erros vermelhos no VS Code mas o app roda**
`Ctrl+Shift+P` → "TypeScript: Restart TS Server"

**`pnpm install` dá erro de peer dependency**
Verifique que o `.npmrc` na raiz tem:
```
auto-install-peers=true
strict-peer-dependencies=false
node-linker=hoisted
shamefully-hoist=true
```

**Metro não encontra mudanças nos packages**
Pare o Metro (`Ctrl+C`) e rode com `--clear`:
```bash
cd apps/consumer && npx expo start --clear
```

---

*Desenvolvendo soluções, criando futuros · AjuLabs 2025*
