# Painel Admin AjuLabs — Arquitetura

Painel web interno para administração da plataforma. Hoje cobre a **Fase 1**
(moderação de fotos de perfil de entregadores); foi desenhado para crescer
(logs, denúncias, gestão) nas próximas fases.

## Visão geral

```
┌─────────────────┐         HTTPS / JSON          ┌──────────────────────┐
│  Painel (web)   │  ───────────────────────────► │  Backend Express     │
│  apps/admin     │   Authorization: Bearer JWT   │  /v1/admin/*         │
│  React + Vite   │ ◄───────────────────────────  │                      │
└─────────────────┘                               └──────────┬───────────┘
                                                              │ Prisma
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │  PostgreSQL (Supabase)│
                                                   │  admins_plataforma    │
                                                   │  entregadores.foto_*  │
                                                   └──────────────────────┘
```

O painel é um SPA web separado dos apps mobile. Fala com o **mesmo backend**
dos apps, por rotas dedicadas sob `/v1/admin`, autenticando com JWT próprio
de admin de plataforma.

## Stack

- **React 19 + Vite + TypeScript** — SPA web. Vite por ser leve e rápido; sem
  Expo (que é mobile). Por isso o EAS/CI mobile ignora este app por completo.
- **react-router-dom** — roteamento client-side (`/login`, `/fotos`).
- Roda em `localhost:5174` em dev. Backend em `localhost:3000`.

## Estrutura de arquivos (apps/admin)

- `index.html` / `src/main.tsx` — entrada; monta o React em `#root` com o Router.
- `src/api.ts` — **camada de API**. Centraliza fetch, token (localStorage),
  e as funções (`login`, `listarFotosPendentes`, `aprovarFoto`, `rejeitarFoto`).
  A URL do backend vem de `VITE_API_URL` (fallback `http://localhost:3000/v1`).
- `src/App.tsx` — **tudo de UI e estado**: contexto de auth, guard de rota,
  layout (sidebar), tela de login e tela de fotos pendentes.
- `src/styles.css` — tokens de design (navy `#000933`, laranja `#FF6B00`) e
  estilos. Sem framework de UI; CSS puro.

## Autenticação

Admin de plataforma é um conceito **separado** de `Colaborador` (que pertence a
uma loja). É a equipe interna da AjuLabs.

Fluxo:
1. `POST /v1/admin/login` com email/senha → backend valida contra
   `admins_plataforma` (senha com bcrypt) → devolve um **JWT** com `tipo: 'admin'`.
2. O painel guarda o token em `localStorage` (`ajulabs_admin_token`).
3. Toda chamada subsequente manda `Authorization: Bearer <token>`.
4. No backend, as rotas admin (menos o login) passam por
   `authMiddleware` (valida o JWT) + `authAdmin` (exige `tipo === 'admin'`).
5. Resposta 401 → o painel limpa o token e manda pro login.

Admins são criados por script (`backend/prisma/create-admin.ts`), nunca por
rota pública. Cada dev cria o seu para desenvolver.

## Backend — rotas (backend/src/routes/admin.routes.ts)

| Método | Rota                          | Proteção            | O que faz                                  |
|--------|-------------------------------|---------------------|--------------------------------------------|
| POST   | `/v1/admin/login`             | pública             | Login do admin, devolve JWT                |
| GET    | `/v1/admin/fotos/pendentes`   | authMiddleware+Admin| Lista fotos aguardando moderação           |
| POST   | `/v1/admin/fotos/:id/aprovar` | authMiddleware+Admin| Aprova: a foto pendente vira a pública     |
| POST   | `/v1/admin/fotos/:id/rejeitar`| authMiddleware+Admin| Rejeita: descarta a pendente               |

Lógica em `backend/src/services/admin.service.ts`.

## Modelo de dados (moderação de foto)

No `Entregador` (schema.prisma):
- `fotoUrl` — a foto **pública** atual (a que aparece pra todos).
- `fotoPendenteUrl` — foto enviada, aguardando revisão.
- `fotoStatus` — `pendente | aprovado | rejeitado` (reusa enum `StatusDocumento`).
- `fotoEnviadaEm` — quando foi enviada.

Fluxo de moderação:
1. Entregador troca a foto no app → `PATCH /v1/entregador/foto`.
   O backend **não** troca `fotoUrl`; salva em `fotoPendenteUrl` + status `pendente`.
   O app mostra "foto em análise"; a foto antiga continua pública.
2. A foto aparece no painel (`/admin/fotos/pendentes`).
3. Admin **aprova** → `fotoPendenteUrl` passa a ser `fotoUrl`, status `aprovado`.
   Admin **rejeita** → `fotoPendenteUrl` é descartada, status `rejeitado`,
   a `fotoUrl` antiga permanece.

`AdminPlataforma` (tabela `admins_plataforma`): id, nome, email (único),
senhaHash, papel (`superadmin | moderador`), ativo, ultimoLogin.

## Atualização da lista

A tela de fotos faz **polling a cada 30s** (atualização silenciosa) + um botão
"Atualizar" manual. Não usa WebSocket — para um volume de moderação, polling é
suficiente e simples.

## Por que no monorepo (e não repo separado)

O painel consome muito o backend (rotas e tipos de entregador). Ficar no
monorepo permite compartilhar `@ajulabs/types` e proteger o contrato painel↔API
via TypeScript. O CI roda só backend+types e o EAS é por-app, então o painel
não interfere nos builds mobile. No deploy (web, ex. Vercel), aponta-se o root
para `apps/admin`.

## Próximas fases (planejadas)

- **Fase 2** — logs/erros dos apps (persistir e visualizar).
- **Fase 3** — denúncias (modelo + triagem).
- **Fase 4** — gestão geral (entregadores, lojistas, métricas).

A sidebar em `App.tsx` já está preparada para receber esses itens de menu.
Ver `ADMIN_PANEL_PLAN.md` na raiz para o plano completo.
