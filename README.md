# AjuLabs — Monorepo

Marketplace local de Aracaju conectando consumidores e lojistas com entrega rápida e assistente de compras com IA (Aju).

Três apps mobile independentes compartilhando código via packages internos.

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
├── pnpm-workspace.yaml        Define os workspaces
├── tsconfig.base.json         Config TypeScript compartilhada
├── .npmrc                     Config do pnpm (hoisting pro Expo)
└── package.json               Scripts globais
```

### Como os apps usam os packages

```
apps/consumer/          apps/lojista/          apps/entregador/
     │                       │                       │
     └───────────────────────┼───────────────────────┘
                             │
                    import { Loja } from '@ajulabs/types'
                    import { colors } from '@ajulabs/theme'
                    import { LojaService } from '@ajulabs/api-client'
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        packages/types  packages/theme  packages/api-client
```

Mudou um tipo em `packages/types`? O TypeScript reclama nos 3 apps automaticamente.

---

## Setup do ambiente

### Pré-requisitos

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 10+** — instalar com `npm install -g pnpm`
- **Git** — [git-scm.com](https://git-scm.com)
- **Expo Go** no celular — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)

### Instalação (primeiro setup)

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/ajulabs-shopping-frontend.git
cd ajulabs-shopping-frontend

# 2. Instale todas as dependências (dos 3 apps + packages, de uma vez)
pnpm install

# 3. Crie o .env do consumer (chave da OpenAI pro chat da Aju)
cp apps/consumer/.env.example apps/consumer/.env
# Edite apps/consumer/.env e coloque sua chave
```

> **Importante:** usamos `pnpm`, não `npm` nem `yarn`. Os workspaces só funcionam com pnpm.

### Variáveis de ambiente

O consumer precisa de uma variável pra o chat da Aju funcionar:

```bash
# apps/consumer/.env
EXPO_PUBLIC_OPENAI_API_KEY="sua-chave-aqui"
```

Obtenha sua chave em [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

O `.env` nunca é commitado (está no `.gitignore`).

---

## Rodando os apps

Da **raiz do monorepo**, rode qualquer app com um único comando:

```bash
# App do consumidor (marketplace)
pnpm consumer

# App do lojista (gestão de pedidos/produtos)
pnpm lojista

# App do entregador (rastreamento)
pnpm entregador
```

Cada comando abre o Metro Bundler com um QR code. Escaneie com o Expo Go no celular.

> **Dica:** só é possível rodar 1 app por vez (cada um ocupa a porta 8081). Para trocar, faça `Ctrl+C` e rode o outro.

### Outros comandos úteis

```bash
# Verificar tipos em todos os workspaces
pnpm typecheck

# Rodar diretamente no Android/iOS
pnpm consumer:android
pnpm consumer:ios

# Limpar cache do Metro (quando der erro estranho)
cd apps/consumer
npx expo start --clear
```

---

## Arquitetura dos apps

Cada app segue **Feature-Sliced Design** adaptado para React Native:

```
apps/consumer/
├── app/                       Rotas (Expo Router) — só importam e renderizam features
│   ├── (consumer)/
│   │   ├── _layout.tsx        Tab navigator (Chat, Vitrines, Carrinho, Pedidos, Perfil)
│   │   ├── chat.tsx           → importa ChatIA
│   │   ├── vitrines.tsx       → importa VitrinesList
│   │   ├── carrinho.tsx       → importa CartScreen
│   │   └── ...
│   └── _layout.tsx            Root layout
│
├── src/
│   ├── features/consumer/     Telas organizadas por domínio
│   │   ├── cart/ui/           CartScreen, CartItemRow, CartLojaGrupo
│   │   ├── chat/ui/           ChatIA, ChatInput, ChatMsg
│   │   ├── vitrines/ui/       VitrinesList, LojaCard, LojasDestaque
│   │   ├── vitrine-detail/ui/ VitrineDetail, ProdutoCard
│   │   └── ...
│   ├── store/                 Estado global (Zustand) — cartStore
│   └── components/            Componentes genéricos (usados em 2+ features)
│
└── assets/                    Ícones, imagens, fontes
```

### Regras da arquitetura

- **`app/`** — só roteamento. Arquivos finos que importam e renderizam features. Sem lógica.
- **`features/`** — todo código de tela vive aqui. Cada feature tem sua pasta `ui/` e um `index.ts` de barrel export.
- **`components/`** — só componentes usados em 2+ features. Se é específico de uma feature, fica dentro dela.
- **`store/`** — estado global compartilhado (carrinho, usuário, preferências).

### Packages compartilhados

| Package | Import | O que contém |
|---|---|---|
| `@ajulabs/types` | `import { Loja } from '@ajulabs/types'` | Todas as interfaces: Loja, Produto, Pedido, Usuario, ItemCarrinho, etc. |
| `@ajulabs/theme` | `import { colors } from '@ajulabs/theme'` | Paleta de cores (navy, orange, n50-n900) e tokens de design |
| `@ajulabs/api-client` | `import { LojaService } from '@ajulabs/api-client'` | Services (LojaService, ProdutoService, PedidoService) + mock data + chat Aju |

> **Regra:** nunca importe com path relativo (`../../../../types`). Sempre use `@ajulabs/*`.

---

## Fluxo Git

```bash
# Antes de começar qualquer tarefa
git checkout main && git pull origin main

# Criar branch
git checkout -b feat/consumer-checkout
git checkout -b feat/lojista-dashboard
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

| Escopo | Quando usar |
|---|---|
| `consumer` | Mudança no app do consumidor |
| `lojista` | Mudança no app do lojista |
| `entregador` | Mudança no app do entregador |
| `types` | Mudança nas interfaces compartilhadas |
| `api-client` | Mudança nos services ou mock |
| `theme` | Mudança nos tokens de design |
| `monorepo` | Config de workspace, CI, scripts globais |

> **Nunca faça push direto na main.** Todo código entra via Pull Request.

---

## Trabalhando com packages

### Quando mudar um tipo

Se você precisa adicionar um campo novo numa interface (ex: `telefone` em `Loja`):

1. Edite `packages/types/src/index.ts`
2. Rode `pnpm typecheck` — vai mostrar todos os arquivos que precisam ser atualizados
3. Corrija nos apps afetados
4. Commite tudo no mesmo PR:
   ```
   feat(types): add telefone field to Loja interface
   ```

### Quando adicionar uma dependência

```bash
# Adicionar no consumer
cd apps/consumer
pnpm add nome-do-pacote

# Adicionar num package compartilhado
cd packages/api-client
pnpm add nome-do-pacote

# Voltar pra raiz depois
cd ../..
```

### Quando o backend estiver pronto

Só mude `packages/api-client/`. Os services já têm a interface certa — troque o mock por `fetch` real:

```ts
// packages/api-client/src/services/index.ts
// ANTES (mock):
export const LojaService = {
  listar: async () => { await delay(); return getLojasAbertas(); },
};

// DEPOIS (API real):
export const LojaService = {
  listar: async () => {
    const res = await fetch('https://api.ajulabs.com/lojas');
    return res.json();
  },
};
```

Os 3 apps continuam funcionando sem mudar nenhuma linha — eles importam `LojaService` de `@ajulabs/api-client` e não sabem se é mock ou real.

---

## Troubleshooting

### "Unable to resolve module" ao rodar o app
```bash
cd apps/consumer
npx expo start --clear
```

### Erros vermelhos no VS Code mas o app roda
O TypeScript server do VS Code às vezes fica com cache antigo:
1. `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### pnpm install dá erro de peer dependency
Verifique que o `.npmrc` na raiz tem:
```
auto-install-peers=true
strict-peer-dependencies=false
node-linker=hoisted
shamefully-hoist=true
```

### Metro não encontra mudanças nos packages
Pare o Metro (`Ctrl+C`) e rode com `--clear`:
```bash
cd apps/consumer
npx expo start --clear
```

---

*Desenvolvendo soluções, criando futuros · AjuLabs 2025*
