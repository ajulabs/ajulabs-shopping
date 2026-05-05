# Shopping Digital AjuLabs — Frontend

Marketplace local de Aracaju conectando consumidores e lojistas com entrega rápida e assistente de compras com IA (Aju).

---

## Stack

- **React Native** + **Expo SDK 54**
- **Expo Router v6** — roteamento file-based
- **NativeWind v4** — Tailwind CSS no React Native
- **Zustand** — estado global
- **TanStack Query** — cache e sincronização de dados
- **React Hook Form + Zod** — formulários e validação
- **Openai API** — assistente de compras Aju

---

## Arquitetura

Feature-Sliced Design adaptado para React Native. O código é organizado por **domínio de negócio primeiro**, e por **responsabilidade técnica depois**.

### Como as camadas se comunicam

```
Celular do usuário
        ↓
   app/ (Expo Router)         ← só roteamento, nada mais
        ↓
 src/features/consumer/       ← telas do consumidor
 src/features/lojista/        ← telas do lojista
        ↓
      src/services/           ← busca e transforma dados
        ↓
   src/mock/ → (futuro) API   ← fonte dos dados
        ↑
      src/store/              ← estado global (Zustand + React Query)
        ↑
      src/types/              ← contratos TypeScript entre todas as camadas
```

### Estrutura de pastas

```
app/
  ├── (consumer)/             → rotas do consumidor (Expo Router)
  └── (lojista)/              → rotas do lojista (Expo Router)

src/
  ├── features/
  │   ├── consumer/
  │   │   ├── splash/         → tela de splash
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── chat/           → chat com a Aju (IA)
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── vitrines/       → listagem de lojas
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── vitrine-detail/ → detalhe da loja + produtos
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── cart/           → carrinho de compras
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── checkout/       → fluxo de pagamento
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── orders/         → histórico de pedidos
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   ├── tracking/       → rastreamento do pedido
  │   │   │   ├── ui/
  │   │   │   └── index.ts
  │   │   └── profile/        → perfil e preferências
  │   │       ├── ui/
  │   │       └── index.ts
  │   │
  │   └── lojista/
  │       ├── dashboard/      → visão geral do lojista
  │       │   ├── ui/
  │       │   └── index.ts
  │       ├── pedidos/        → gestão de pedidos
  │       │   ├── ui/
  │       │   └── index.ts
  │       ├── produtos/       → gestão de produtos
  │       │   ├── ui/
  │       │   └── index.ts
  │       └── logistica/      → gestão de entregas
  │           ├── ui/
  │           └── index.ts
  │
  ├── components/             → componentes 100% genéricos (Button, Badge, Header...)
  ├── store/                  → estado global (Zustand)
  ├── services/               → service layer (mock hoje, API amanhã)
  ├── mock/                   → dados mockados de Aracaju
  ├── types/                  → interfaces TypeScript
  └── theme.ts                → cores e tokens de design

assets/                       → ícones, imagens, fontes
```

### Regras da arquitetura

- **`app/`** — só roteamento. Arquivos finos que importam e renderizam features. Sem lógica.
- **`features/`** — todo código de tela vive aqui. Cada feature tem sua pasta `ui/` e um `index.ts` de barrel export.
- **`components/`** — só componentes usados em 2 ou mais features. Se é específico de uma feature, fica dentro dela.
- **`services/`** — busca e transforma dados. Não sabe nada sobre a UI.
- **`store/`** — estado global compartilhado (carrinho, usuário, preferências).
- **`types/`** — toda entidade tem interface TypeScript. É o contrato entre as camadas.
- **`mock/`** — fonte de dados hoje. Quando o backend estiver pronto, só os services mudam.

---

## Setup do ambiente

### Pré-requisitos

- Node.js 20+
- Git
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Expo CLI e EAS CLI

O Expo CLI é usado via `npx` — não precisa instalar globalmente. O único que precisa de instalação global é o **EAS CLI**, usado para gerar builds de produção na nuvem.

```bash
npm install -g eas-cli
```

**Criar conta no Expo (necessário para o EAS Build)**

1. Acesse [expo.dev](https://expo.dev) e clique em **Sign Up**
2. Crie sua conta com e-mail e senha e confirme o e-mail
3. Volte ao terminal e faça login:

```bash
eas login
# Digite seu e-mail e senha quando solicitado
```

**Instalar o Expo Go no celular**

O Expo Go roda o projeto durante o desenvolvimento, sem precisar gerar um APK completo.

- **Android** — [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS** — [App Store](https://apps.apple.com/app/expo-go/id982107779)

---

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/ajulabs-shopping-frontend.git
cd ajulabs-shopping-frontend

# 2. Configure o npm para evitar conflitos de peer deps
npm config set legacy-peer-deps true --location project

# 3. Instale as dependências
npm install

# 4. Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env conforme a seção abaixo
```

### Variáveis de ambiente

```bash
# Chave da openai API (assistente Aju)
EXPO_PUBLIC_OPENAI_API_KEY="chave aqui"
```

> O arquivo `.env` **nunca é commitado**. O `.env.example` é o template — edite o `.env` localmente.
>
> Obtenha sua chave da Claude API em [console.anthropic.com](https://console.anthropic.com).

### Rodar o projeto

```bash
npx expo start
```

Escaneie o QR code com o Expo Go no celular.

---

## Fluxo Git

```bash
# Antes de começar qualquer tarefa
git checkout main && git pull origin main

# Criar branch seguindo Conventional Commits
git checkout -b feat/consumer-splash-screen
git checkout -b feat/consumer-chat-ia
git checkout -b feat/lojista-pedidos
git checkout -b refactor/setup-feature-sliced-design

# Commitar
git add .
git commit -m "feat(consumer): add splash screen with logo animation"

# Subir e abrir PR
git push origin feat/consumer-splash-screen
```

### Padrão de commits (Conventional Commits)

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Nova funcionalidade | `feat(consumer): add cart screen` |
| `fix` | Correção de bug | `fix(cart): total not updating on remove` |
| `refactor` | Refatoração sem mudança funcional | `refactor(checkout): extract AddressCard` |
| `style` | Ajuste visual sem lógica | `style(vitrine): fix card border radius` |
| `chore` | Config, deps, estrutura | `chore: add .env.example` |

> **Nunca faça push direto na main.** Todo código entra via Pull Request com mínimo de 1 aprovação.

---

## Dependências principais

| Biblioteca | Versão | Função |
|---|---|---|
| expo | 54.x | SDK base |
| expo-router | 6.x | Roteamento file-based |
| nativewind | 4.x | Tailwind no React Native |
| zustand | 5.x | Estado global |
| @tanstack/react-query | 5.x | Cache de dados |
| react-hook-form | 7.x | Formulários |
| zod | 4.x | Validação de schemas |
| @anthropic-ai/sdk | 0.x | Claude API (Aju Chat) |
| expo-notifications | — | Push nativo |
| expo-location | — | GPS do motoboy |
| expo-camera | — | Câmera do lojista |

---

*Desenvolvendo soluções, criando futuros · AjuLabs 2025*
