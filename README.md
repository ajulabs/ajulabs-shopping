# AjuLabs — Monorepo

Local marketplace from Aracaju connecting consumers and store owners with fast delivery and an AI-powered shopping assistant (Aju).

Three independent mobile apps + Node.js backend, sharing code via internal packages.

---

## Stack

| Technology | Version | Role |
|---|---|---|
| React Native | 0.81 | Mobile framework |
| Expo SDK | 54 | Build, dev tools, OTA updates |
| Expo Router | 6 | File-based routing |
| NativeWind | 4 | Tailwind CSS for React Native |
| Zustand | 5 | Global state management |
| TanStack Query | 5 | Data fetching and cache |
| React Hook Form + Zod | 7 / 4 | Forms and validation |
| Claude API (Anthropic) | — | Aju shopping assistant |
| pnpm | 10+ | Package manager (workspaces) |
| TypeScript | 5.9 | Static typing |
| Node.js + Express | — | Backend REST API |
| Prisma | — | ORM + migrations |
| PostgreSQL | — | Database |

---

## Monorepo structure

```
ajulabs/
├── apps/
│   ├── consumer/              Consumer app (marketplace, Aju chat, cart)
│   ├── lojista/               Store owner app (dashboard, orders, products)
│   └── entregador/            Delivery driver app (routes, GPS, deliveries)
│
├── packages/
│   ├── types/                 Shared TypeScript interfaces (Loja, Pedido, etc.)
│   ├── theme/                 Color palette and design tokens
│   └── api-client/            HTTP services + Aju chat client
│
├── backend/                   Node.js + Express + Prisma API
│
├── pnpm-workspace.yaml        Workspace definitions
├── tsconfig.base.json         Shared TypeScript config
├── .npmrc                     pnpm config (hoisting for Expo)
└── package.json               Global scripts
```

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 10+** — `npm install -g pnpm`
- **Git** — [git-scm.com](https://git-scm.com)
- **Expo Go** on your phone — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)

> **Important:** use `pnpm`, not `npm` or `yarn`. Workspaces only work with pnpm.

---

## Setup — Frontend (mobile apps)

### 1. Install dependencies

```bash
git clone https://github.com/ajulabs/ajulabs-shopping.git
cd ajulabs-shopping
pnpm install
```

### 2. Environment variables

Create `apps/consumer/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/
```

`.env` files are never committed.

### 3. Run the apps

From the **monorepo root**:

```bash
pnpm consumer      # Consumer app (marketplace)
pnpm lojista       # Store owner app (orders and products)
pnpm entregador    # Delivery driver app (tracking)
```

Each command opens Metro Bundler with a QR code. Scan it with Expo Go on your phone.

> Only 1 app can run at a time (each uses port 8081). To switch, press `Ctrl+C` and start the other.

### Other useful commands

```bash
pnpm typecheck          # Type-check all workspaces
pnpm consumer:android   # Run directly on Android
pnpm consumer:ios       # Run directly on iOS

# Clear Metro cache (when you get a weird error)
cd apps/consumer && npx expo start --clear
```

---

## Setup — Backend

### 1. Install dependencies

```bash
cd backend
pnpm install
```

### 2. Environment variables

Copy the example and fill in the credentials:

```bash
cp backend/.env.example backend/.env
```

```bash
DATABASE_URL=postgresql://...        # Supabase (pooler)
DIRECT_URL=postgresql://...          # Supabase (direct, used by Prisma)
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

PORT=3000
NODE_ENV=development
JWT_SECRET=long-random-secret
JWT_REFRESH_SECRET=another-long-secret
OPENAI_API_KEY=sk-...                # OpenAI key (Aju chat)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALLOWED_ORIGINS=                     # Empty in dev (accepts any origin)
```

`.env` is never committed to Git.

### 3. Set up the database

```bash
pnpm prisma:generate   # Generate Prisma Client
pnpm prisma:push       # Sync schema to the database
```

> Run `pnpm prisma:generate` whenever you change `schema.prisma`.

### 4. Start the server

```bash
pnpm dev
```

The server starts at `http://localhost:3000`.

### Available backend scripts

```bash
pnpm dev              # Dev server with watch mode
pnpm build            # Compile TypeScript
pnpm start            # Run production build
pnpm prisma:studio    # Visual database browser (Prisma Studio)
pnpm prisma:seed      # Seed the database with initial data
pnpm db:reset         # Reset the database
```

---

## Backend specs (Spec Kit)

`backend/specs/` holds the **specification** for every REST endpoint, WebSocket event, Aju tool and critical validation — typed `.spec.ts` files describing inputs, outputs, real examples, errors, preconditions and side effects.

### What they are

Not tests, not production code: the **single source of truth** for the API contract. Each spec is a TypeScript object validated at compile time (`satisfies EndpointSpec`).

```
backend/specs/
├── endpoints/      REST route contracts (POST_pedidos, POST_lojista_produtos, …)
├── websocket/      Realtime event contracts (pedido:novo, estoque:alerta, …)
├── tools/          Tools the Aju agent can call (buscar_produtos, …)
└── validations/    Critical validation rules (checkout, stock, …)
```

### Why use them

From **one** spec edit, three artifacts are regenerated in sync — no manual updates needed:

| Generated from spec | Purpose |
|---|---|
| Vitest tests (`src/__tests__/generated/`) | Automatically validate required fields and contracts |
| `openapi.json` | API documentation (opens in Swagger UI) |
| `src/lib/agent-context.ts` | Tells the Aju agent which endpoints exist and how to call them (prevents API hallucination) |

Endpoints with required bodies also get runtime validation via `specValidatorMiddleware` (strict in dev/test, non-blocking in production).

### When to use

- **Every new route or event must have a spec** (written before the implementation, ideally).
- **When changing** inputs, outputs or errors of an existing endpoint, update the spec and **regenerate**.
- After editing any spec, run `pnpm spec:gen` and **commit the generated files together** — they are versioned.

> **CI blocks the merge if specs and generated files are out of sync** (`Spec drift check` → `pnpm spec:check`). If you forget to regenerate, the build fails. Run `pnpm spec:gen` and commit the result.

### Commands

From the `backend/` folder:

```bash
pnpm spec:gen-tests          # Generate only tests from specs
pnpm spec:gen-openapi        # Generate only openapi.json (API docs)
pnpm spec:gen-agent-context  # Generate only the Aju agent context

pnpm spec:gen                # Run all three generators at once
pnpm spec:check              # Regenerate and fail if there is drift (used in CI)
pnpm test                    # Run tests (includes generated ones)
```

---

## App architecture

Each app follows **Feature-Sliced Design** adapted for React Native, with a single dependency direction (each layer only imports from layers below):

```
app → features → entities → shared
```

```
apps/consumer/
├── app/                          Routes (Expo Router) — thin wrappers that render feature components
│   ├── (consumer)/
│   │   ├── _layout.tsx           Tab navigator
│   │   ├── chat.tsx              → <ChatIA />
│   │   ├── vitrines.tsx          → <VitrinesList />
│   │   └── ...
│   └── _layout.tsx               Root layout
│
├── src/
│   ├── features/consumer/        Features by domain
│   │   └── <feature>/            (cart, chat, produto-detail, tickets, …)
│   │       ├── model/            Logic and state: useX hooks, Zustand stores
│   │       ├── lib/              Pure helpers scoped to the feature
│   │       ├── ui/               Presentation components (the screen)
│   │       │   └── components/   Feature sub-components
│   │       └── index.ts          Public API of the feature
│   │
│   ├── entities/                 Business models reused across multiple features
│   │   ├── produto/             ({model}: variations · {ui}: VariacoesSelector)
│   │   └── endereco/            ({model}: useEnderecoForm · {ui}: EnderecoFormModal)
│   │
│   ├── shared/                   Reusable base, no business logic
│   │   ├── ui/                   Generic components (maps, toast)
│   │   ├── hooks/                Generic hooks (useTheme, useHardwareBack)
│   │   └── lib/                  Generic helpers
│   │
│   └── store/                    Global state (Zustand: auth, cart, theme)
│
└── assets/                       Icons, images, fonts
```

> The **consumer** app is the reference implementation of this structure; **lojista** and **entregador** follow the same pattern. In `entregador`, `entities/corrida` holds the ride model (`Ride`/`RideWithStage`, `mapToRide`) shared between the home, andamento and corrida-ativa features.

### Rules

- **Dependency direction:** `app → features → entities → shared`. A layer never imports from a layer above it.
- **`app/`** — routing only. Each route is a thin wrapper that renders a feature component.
- **`features/`** — separate **logic from presentation**: `model/` (fetch, state, handlers in `useX` hooks), `lib/` (pure helpers) and `ui/` (JSX and styles). Screen components consume hooks — they never fetch data directly.
- **Features do not import from other features.** Code shared between two features moves to `entities/` (if business-related) or `shared/` (if generic).
- **`entities/`** — reusable business models (e.g. `produto`, `endereco`), with their own `model`/`ui`/`lib`.
- **`shared/`** — generic base with no business knowledge (UI kit, utility hooks, helpers). Never imports from `features` or `entities`.
- **`store/`** — global state in Zustand.

### Shared packages

| Package | Import | Contains |
|---|---|---|
| `@ajulabs/types` | `import { Loja } from '@ajulabs/types'` | Interfaces: Loja, Produto, Pedido, Usuario, etc. |
| `@ajulabs/theme` | `import { colors } from '@ajulabs/theme'` | Color palette and design tokens |
| `@ajulabs/api-client` | `import { LojaService } from '@ajulabs/api-client'` | Services + mock data + Aju chat |

> **Rule:** never use relative paths for packages. Always use `@ajulabs/*`.

---

## Git workflow

```bash
# Always start from an up-to-date main
git checkout main && git pull origin main

# Create a branch
git checkout -b feat/consumer-checkout
git checkout -b fix/cart-total-bug

# Commit
git add .
git commit -m "feat(consumer): add checkout screen with address form"

# Push and open a PR
git push origin feat/consumer-checkout
```

### Branch naming

| Prefix | When to use | Example |
|---|---|---|
| `feat/` | New feature | `feat/consumer-dark-mode` |
| `fix/` | Bug fix | `fix/cart-total-calculation` |
| `refactor/` | Refactor without functional change | `refactor/lojista-app-structure` |
| `perf/` | Performance improvement | `perf/consumer-image-loading` |
| `style/` | Visual adjustment only | `style/vitrine-card-spacing` |
| `docs/` | Documentation | `docs/add-claude-md` |
| `chore/` | Config, deps, tooling | `chore/upgrade-expo-sdk` |
| `ci/` | Pipeline and CI/CD | `ci/add-spec-drift-check` |

Always use lowercase and hyphens. No underscores, no camelCase.

### Commit messages (Conventional Commits)

Format: `<type>(<scope>): <short description in English>`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Refactor without functional change |
| `perf` | Performance improvement |
| `style` | Visual change with no logic |
| `docs` | Documentation |
| `chore` | Config, deps, tooling |
| `ci` | Pipeline and CI/CD |

**Common scopes:** `consumer` · `lojista` · `entregador` · `types` · `api-client` · `theme` · `monorepo` · `backend`

> **Never push directly to main.** All code enters via Pull Request.

---

## Working with packages

### Adding a dependency

```bash
# Inside an app
cd apps/consumer && pnpm add package-name

# Inside a shared package
cd packages/api-client && pnpm add package-name
```

### Changing a type

1. Edit `packages/types/src/index.ts`
2. Run `pnpm typecheck` — shows all affected files
3. Fix all affected apps
4. Commit everything in the same PR

---

## Troubleshooting

**"Unable to resolve module" when running the app**
```bash
cd apps/consumer && npx expo start --clear
```

**Red errors in VS Code but the app runs fine**
`Ctrl+Shift+P` → "TypeScript: Restart TS Server"

**`pnpm install` fails with peer dependency errors**
Make sure `.npmrc` at the root contains:
```
auto-install-peers=true
strict-peer-dependencies=false
node-linker=hoisted
shamefully-hoist=true
```

**Metro does not pick up changes from packages**
Stop Metro (`Ctrl+C`) and restart with `--clear`:
```bash
cd apps/consumer && npx expo start --clear
```

---

*Building solutions, creating futures · AjuLabs 2025*
