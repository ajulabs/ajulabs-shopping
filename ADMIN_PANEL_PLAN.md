# Plano — Painel Administrativo AjuLabs

> Documento de planejamento. Define escopo, arquitetura, stack e fases.
> Objetivo: um painel web interno (separado dos apps mobile) para administração:
> aprovação de fotos/documentos, visualização de logs/erros, denúncias e gestão.
> **Nada implementado ainda** — este doc é pra alinhar a direção antes de codar.

## Motivação

Surgiu de uma necessidade concreta de moderação: um entregador pode subir uma
foto de perfil obscena, e hoje ela vai direto ao ar, sem revisão. A solução
escolhida foi **aprovação manual** — que exige um lugar para o admin aprovar.
Como não existe painel admin, ele precisa ser criado. Aproveitando, o painel
centraliza outras necessidades de administração.

## O que JÁ existe no backend (reaproveitar)

O backend está maduro e oferece boa base — o painel é, em grande parte, uma
interface para capacidades que já existem:

- **RBAC** — enum `PapelColaborador` (admin, gerente, funcionario) + middleware
  `requirePapel('admin', ...)`. Já protege rotas. O painel autentica como
  colaborador com papel adequado.
- **AuditLog** — modelo Prisma já existe (`actorPapel`, etc.). Base para a trilha
  de auditoria e parte dos logs.
- **Logger estruturado (pino)** — logs já são estruturados. Para o painel ler
  "erros dos apps", falta **persistir** esses logs num lugar consultável
  (hoje vão pra stdout/serviço de log, não pra uma tabela).
- **Padrão de aprovação** — `StatusDocumento` (pendente/aprovado/rejeitado) e
  `aprovarSolicitacao` já existem. A aprovação de foto segue o mesmo padrão.
- **Rotas admin** — já há rotas sob `requirePapel('admin')` (colaboradores,
  audit-log). O painel adiciona novas no mesmo estilo.

## O que NÃO existe (precisa criar)

- Aplicação web do painel (os 3 apps são mobile/Expo; painel é web).
- Campo de status para foto de perfil (hoje `fotoUrl` troca direto, sem status).
- Persistência de logs de erro consultável (hoje pino → stdout).
- Modelo de denúncias (não há `model Denuncia`/`Report`).
- Rotas admin específicas para alimentar o painel.

## Stack proposta (a validar)

- **Frontend:** React + Vite + TypeScript (web SPA). Alinha com o React que os
  apps já usam, sem o peso do Expo (que é mobile). Vite é leve e rápido.
  Alternativa: Next.js, se quiser SSR/rotas de API no mesmo projeto — mas
  provavelmente é overkill, já que o backend Express já existe.
- **UI:** uma lib de componentes (ex: shadcn/ui ou Material) para montar tabelas,
  formulários e modais rápido — um painel admin é majoritariamente CRUD.
- **Local:** novo `apps/admin` no monorepo (compartilha tipos via `@ajulabs/types`
  e o `@ajulabs/api-client`), ou repositório separado. Recomenda-se `apps/admin`
  para reuso de tipos e do cliente de API.
- **Auth:** login de colaborador (papel admin/gerente) reusando o JWT do backend.
- **Hospedagem:** web estático (Vercel/Netlify/S3) apontando para a mesma API.

## Escopo por fases

### Fase 1 — MVP: Aprovação de fotos (resolve a dor original)
Backend:
- Migration: adicionar à foto de perfil um fluxo de status. Sugestão:
  `fotoStatus` (pendente/aprovado/rejeitado) + `fotoPendenteUrl`. Ao subir, a foto
  vai para `fotoPendenteUrl` com status `pendente`; a `fotoUrl` pública só muda
  após aprovação.
- Rotas admin (`requirePapel('admin','gerente')`):
  `GET /admin/fotos/pendentes`, `POST /admin/fotos/:id/aprovar`,
  `POST /admin/fotos/:id/rejeitar`.
- App entregador: enquanto pendente, mostrar a foto anterior + aviso "em análise".

Frontend (painel):
- Login admin.
- Lista de fotos pendentes (miniatura, entregador, data) + botões Aprovar/Rejeitar.

### Fase 2 — Logs e erros dos apps
- Persistir erros num modelo consultável (ex: `model AppError` com app, mensagem,
  stack, contexto, timestamp). Os apps enviam erros a um endpoint, ou um
  transport do pino grava em tabela.
- Painel: tela de listagem/filtro de erros por app, período, severidade.

### Fase 3 — Denúncias
- `model Denuncia` (tipo, alvo, autor, motivo, status, timestamp).
- Endpoints para apps criarem denúncias; painel para triagem e ação (remover
  conteúdo, suspender conta).

### Fase 4 — Gestão geral (incremental)
- Gestão de entregadores/lojistas (suspender, aprovar documentos), métricas,
  e o que mais a operação pedir.

## Decisões a validar antes de codar

1. Stack do frontend: Vite SPA (recomendado) vs Next.js?
2. Local: `apps/admin` no monorepo (recomendado) vs repo separado?
3. Lib de UI: alguma preferência?
4. Fase 1 começa por backend, frontend, ou os dois juntos?
5. Enquanto a foto está "pendente", o entregador vê a foto antiga? (recomendado)

## Riscos e notas

- **Aprovação manual exige operação humana** — alguém precisa revisar as fotos
  pendentes regularmente, senão acumulam. Definir quem/processo.
- Este é um **épico** (semanas, não uma sessão). Fatiar e entregar a Fase 1
  primeiro destrava a moderação de fotos; o resto evolui depois.
- A Fase 1 já resolve o problema que originou tudo (foto obscena).
