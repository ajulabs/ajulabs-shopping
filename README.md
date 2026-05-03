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
- **Claude API (Anthropic)** — assistente de compras Aju

---

## Arquitetura

Feature-Sliced Design adaptado para React Native. O código é organizado por **domínio de negócio primeiro**, e por **responsabilidade técnica depois**.

### Como as camadas se comunicam

Celular do usuário
↓
app/ (Expo Router)             ← só roteamento, nada mais
↓
src/consumer/ ou src/lojista/     ← telas — só exibem e disparam ações
↓
src/services/               ← busca e transforma dados
↓
src/mock/ → (futuro) API       ← fonte dos dados
↑
src/store/                  ← estado global (Zustand + React Query)
↑
src/types/                  ← contratos TypeScript entre todas as camadas

### Estrutura de pastas

app/                    → roteamento (Expo Router)
├── (consumer)/       → rotas do consumidor
└── (lojista)/        → rotas do lojista
src/
├── consumer/         → telas do consumidor
├── lojista/          → telas do lojista
├── components/       → componentes compartilhados
├── services/         → service layer (mock hoje, API amanhã)
├── store/            → estado global (Zustand)
├── mock/             → dados mockados de Aracaju
└── types/            → interfaces TypeScript
assets/                 → ícones, imagens, fontes

### Regras da arquitetura

- **Telas** só exibem dados e disparam ações — sem lógica de negócio
- **Services** buscam e transformam dados — não sabem nada sobre a UI
- **Store** guarda estado global — carrinho, usuário logado, preferências
- **Types** definem os contratos entre camadas — toda entidade tem interface TypeScript
- **Mock** é a fonte de dados hoje — quando o backend estiver pronto, só os services mudam


## Setup do ambiente

### Pré-requisitos

- Node.js 20+
- Git
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

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
# Edite o .env e adicione sua chave da Claude API
```

### Variáveis de ambiente

```bash
ANTHROPIC_API_KEY=sua_chave_aqui
```

Obtenha sua chave em [console.anthropic.com](https://console.anthropic.com).

### Rodar o projeto

```bash
npx expo start
```

Escaneie o QR code com o Expo Go no celular. O app vai abrir em segundos.

---

## Fluxo Git

```bash
# Antes de começar
git checkout main && git pull origin main

# Criar branch para sua feature
git checkout -b consumer/nome-da-tela

# Commitar
git add .
git commit -m "feat: descrição do que foi feito"

# Subir e abrir PR
git push origin consumer/nome-da-tela
```

> **Nunca faça push direto na main.** Todo código entra via Pull Request revisado por outro dev.


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