# syntax=docker/dockerfile:1.7

# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
# OpenSSL é exigido pelo Prisma engine
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS builder

# Copia manifestos primeiro (melhor cache de layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/

# Install com devDeps (precisa de tsc + prisma CLI)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter @ajulabs/backend...

# Agora copia o código fonte
COPY packages/types/ ./packages/types/
COPY backend/ ./backend/

# Gera Prisma Client (precisa do schema)
WORKDIR /app/backend
RUN pnpm prisma generate

# Build TypeScript do types (caso o backend importe dele compilado)
WORKDIR /app/packages/types
RUN pnpm build || echo "no build script in types, skipping"

# Build TypeScript do backend
WORKDIR /app/backend
RUN pnpm build

# Cria deploy isolado com SÓ deps de produção
WORKDIR /app
RUN pnpm --filter @ajulabs/backend deploy --prod --legacy /deploy

# Copia artefatos compilados pro deploy
RUN cp -r /app/backend/dist /deploy/dist && \
    cp -r /app/backend/prisma /deploy/prisma

# Re-gera Prisma client DENTRO do /deploy (com schema correto e node_modules de prod)
WORKDIR /deploy
RUN npx prisma generate

# ─── Production stage ────────────────────────────────────────────────────────
FROM base AS production

# Cria usuário não-root
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nodejs

WORKDIR /app

# Copia tudo do /deploy (já tem node_modules de produção + dist + prisma + client gerado)
COPY --from=builder --chown=nodejs:nodejs /deploy ./

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck — assume rota GET /health no Express. Ajuste se for diferente.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Roda migrations e sobe a API
CMD ["node", "dist/index.js"]