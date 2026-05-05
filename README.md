# AjuLabs — Monorepo

Marketplace local de Aracaju. Três apps mobile compartilhando código via packages.

## Estrutura

apps/consumer/ — App do consumidor (marketplace, chat Aju)
apps/lojista/ — App do lojista (pedidos, produtos)
apps/entregador/ — App do entregador (rotas, GPS)
packages/types/ — Interfaces TypeScript compartilhadas
packages/theme/ — Cores e tokens de design
packages/api-client/ — Services e mock de dados

## Setup

pnpm install
pnpm consumer
pnpm lojista
pnpm entregador