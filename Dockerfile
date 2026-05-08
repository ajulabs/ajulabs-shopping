FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/types/ ./packages/types/
COPY backend/ ./backend/

# Install all deps (devDeps included for tsc + prisma CLI)
RUN pnpm install --frozen-lockfile --filter @ajulabs/backend...

# Generate Prisma client before compiling (tsc needs the generated types)
WORKDIR /app/backend
RUN pnpm prisma:generate

# Compile TypeScript
RUN pnpm build

# Create a self-contained production dir (flat node_modules, no symlinks)
WORKDIR /app
RUN pnpm --filter @ajulabs/backend deploy --prod --legacy /deploy

# Copy compiled output into the deployment dir
RUN cp -r /app/backend/dist /deploy/dist

# Generate Prisma client inside the deployment context
# (uses the prisma CLI from the full install above)
WORKDIR /deploy
RUN /app/node_modules/.bin/prisma generate

# ─── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=builder /deploy .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "dist/index.js"]
