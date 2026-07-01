# AjuLabs Shopping — CLAUDE.md

Local marketplace from Aracaju connecting consumers, store owners and delivery drivers, with an AI shopping assistant (Aju). Three independent mobile apps + Node.js backend, sharing code via internal packages (pnpm monorepo).

---

## Stack

- **React Native 0.81 + Expo SDK 54** — mobile apps
- **Expo Router 6** — file-based routing
- **NativeWind 4** — Tailwind CSS for React Native
- **Zustand 5** — global state management
- **TanStack Query 5** — data fetching and cache
- **React Hook Form + Zod** — forms and validation
- **Node.js + Express + TypeScript** — REST API backend
- **Prisma + PostgreSQL (Supabase)** — ORM and database
- **WebSocket (socket.io)** — realtime sync across the 3 apps
- **Claude API (Anthropic)** — Aju shopping agent
- **EAS Build** — APK generation (profile `preview` for Android)
- **pnpm 10 + workspaces** — package manager

---

## Monorepo structure

```
ajulabs-shopping/
├── apps/
│   ├── consumer/          Consumer app (storefront, Aju chat, cart, orders)
│   ├── lojista/           Store owner app (dashboard, products, orders, insights)
│   └── entregador/        Delivery driver app (rides, GPS, earnings)
│
├── packages/
│   ├── types/             Shared TypeScript interfaces (Loja, Pedido, Produto…)
│   ├── theme/             Color palette and design tokens
│   └── api-client/        HTTP services + Aju chat client
│
├── backend/               REST API + WebSocket + Aju agent
│   ├── src/routes/        Express endpoints
│   ├── src/services/      Business logic
│   ├── src/tools/         Aju agent tools (buscar_produtos, listar_pedidos…)
│   ├── prisma/            Schema and migrations
│   └── specs/             Spec Kit — API contract source of truth
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Running the apps

From the **monorepo root**:

```bash
pnpm consumer      # Consumer app (port 8081)
pnpm lojista       # Store owner app
pnpm entregador    # Delivery driver app
```

Only 1 app at a time — all use port 8081. Use `Ctrl+C` to switch.

```bash
pnpm typecheck     # Type-check all workspaces
```

### Backend

```bash
cd backend
pnpm dev                  # Dev server with watch mode (localhost:3000)
pnpm prisma:generate      # Generate Prisma Client (run after editing schema.prisma)
pnpm prisma:push          # Sync schema to the database
pnpm spec:gen             # Regenerate tests + openapi.json + agent-context from specs
pnpm spec:check           # Used in CI — fails if specs and generated files are out of sync
pnpm test                 # Run tests (includes spec-generated ones)
```

---

## Architecture — Feature-Sliced Design

All apps follow FSD with a single dependency direction:

```
app → features → entities → shared
```

```
src/
├── features/<app>/<feature>/
│   ├── model/        useX hooks, Zustand stores, business logic
│   ├── lib/          Pure helpers scoped to the feature
│   └── ui/           JSX components + components/
├── entities/         Business models reused across multiple features
├── shared/           UI kit, utility hooks, generic helpers
└── store/            Global state (auth, cart, theme)
```

**Rules:**
- `app/` is routing only — thin wrappers that render feature components
- Features never import from other features — share via `entities/` (business) or `shared/` (generic)
- Screen components consume hooks from `model/`; never fetch data directly in JSX
- Never use relative paths for packages — always use `@ajulabs/types`, `@ajulabs/theme`, `@ajulabs/api-client`

---

## Shared packages

| Package | Import | Contains |
|---|---|---|
| `@ajulabs/types` | `import { Loja } from '@ajulabs/types'` | Interfaces: Loja, Produto, Pedido, Usuario… |
| `@ajulabs/theme` | `import { colors } from '@ajulabs/theme'` | Color palette and design tokens |
| `@ajulabs/api-client` | `import { LojaService } from '@ajulabs/api-client'` | HTTP services and Aju chat |

When changing a type in `packages/types/`, run `pnpm typecheck` and fix all affected files in the same PR.

---

## Spec Kit

`backend/specs/` holds the contracts for the entire API — not tests, but the **single source of truth**:

```
backend/specs/
├── endpoints/     REST route contracts
├── websocket/     Realtime event contracts
├── tools/         Aju agent tool contracts
└── validations/   Critical validation rules (checkout, stock…)
```

- **Every new route or event must have a spec** (written before the implementation, ideally)
- After editing any spec, run `pnpm spec:gen` and **commit the generated files together**
- CI blocks merges if specs and generated files are out of sync (`pnpm spec:check`)

---

## Aju agent

The shopping agent runs on the backend (`backend/src/routes/chat.routes.ts`) using the Claude API. Tools are defined in `backend/src/tools/` and documented in `backend/specs/tools/`. The agent context is auto-generated at `backend/src/lib/agent-context.ts` via `pnpm spec:gen-agent-context`.

---

## Git workflow

```bash
# Always start from an up-to-date main
git checkout main && git pull origin main

# Create a branch
git checkout -b feat/consumer-checkout

# Commit and push
git commit -m "feat(consumer): add checkout screen with address form"
git push origin feat/consumer-checkout

# Open a PR — never push directly to main
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

Always use lowercase and hyphens. No underscores, no slashes inside the name.

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

**Common scopes:** `consumer` · `lojista` · `entregador` · `backend` · `types` · `api-client` · `theme` · `monorepo`

**Examples:**
```
feat(consumer): add dark mode toggle to profile screen
fix(backend): prevent duplicate order creation on double tap
refactor(entregador): migrate rides feature to FSD structure
perf(consumer): replace Image with expo-image for product cards
chore(monorepo): upgrade pnpm to 10.33.4
```

---

## Code conventions

### No comments
Do not write comments in code. Variable and function names must be self-explanatory. The only exception is a non-obvious constraint or a workaround for a specific external bug — one line max.

### No dead code
Do not leave commented-out code, unused imports, orphaned variables or `TODO` comments in committed code. Remove them.

### TypeScript
- No `any` without a documented reason
- Prefer `satisfies` over type assertions
- All shared types live in `packages/types/` — never redeclare locally what already exists there

### Components
- Screen components are thin — all logic lives in `model/` hooks
- No inline business logic inside JSX
- No prop drilling past 2 levels — lift to a store or context

### No over-engineering
- No feature flags — change the code directly
- No error handling for impossible scenarios — trust framework guarantees
- No abstractions for hypothetical future requirements
- Three similar lines are better than a premature abstraction

### All code and identifiers in English
- Variable names, function names, component names, file names — all in English
- Git branches, commit messages and PR titles — always in English
- Comments (when unavoidable) — English only

### Adding dependencies
```bash
# Inside an app
cd apps/consumer && pnpm add package-name

# Inside a shared package
cd packages/api-client && pnpm add package-name
```

---

## EAS Build (APKs)

Internal Android build profile: `preview` (generates `.apk`).

```bash
# Authenticate via token (no interactive login needed)
export EXPO_TOKEN=<token from backend/.env>

# Trigger a build for each app
cd apps/consumer   && npx eas build --platform android --profile preview --non-interactive
cd apps/lojista    && npx eas build --platform android --profile preview --non-interactive
cd apps/entregador && npx eas build --platform android --profile preview --non-interactive
```

EAS account: **ajulabs** · Free plan (30 builds/month, resets on the 1st)

---

## Environment variables

- `apps/*/.env` — `EXPO_PUBLIC_API_URL` (API URL, never committed)
- `backend/.env` — database credentials, JWT secrets, OpenAI key, Supabase keys, EXPO_TOKEN
- `.env` files are never committed to Git
