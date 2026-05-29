CREATE TYPE "PapelColaborador" AS ENUM ('admin', 'gerente', 'funcionario');
CREATE TYPE "StatusSolicitacaoPreco" AS ENUM ('pendente', 'aprovado', 'rejeitado');

CREATE TABLE "colaboradores" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "loja_id"      TEXT        NOT NULL,
  "nome"         TEXT        NOT NULL,
  "email"        TEXT        NOT NULL,
  "senha_hash"   TEXT        NOT NULL,
  "papel"        "PapelColaborador" NOT NULL DEFAULT 'funcionario',
  "ativo"        BOOLEAN     NOT NULL DEFAULT true,
  "criado_em"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "colaboradores_email_key" UNIQUE ("email"),
  CONSTRAINT "colaboradores_loja_id_fkey"
    FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE
);

CREATE TABLE "solicitacoes_preco" (
  "id"                TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "produto_id"        TEXT        NOT NULL,
  "loja_id"           TEXT        NOT NULL,
  "solicitante_id"    TEXT        NOT NULL,
  "preco_atual"       DECIMAL(10,2) NOT NULL,
  "preco_solicitado"  DECIMAL(10,2) NOT NULL,
  "justificativa"     TEXT        NOT NULL,
  "status"            "StatusSolicitacaoPreco" NOT NULL DEFAULT 'pendente',
  "revisado_por_id"   TEXT,
  "revisado_por_tipo" TEXT,
  "revisado_por_nome" TEXT,
  "revisado_em"       TIMESTAMP(3),
  "nota_revisao"      TEXT,
  "criado_em"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "solicitacoes_preco_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "solicitacoes_preco_produto_id_fkey"
    FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE,
  CONSTRAINT "solicitacoes_preco_loja_id_fkey"
    FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE,
  CONSTRAINT "solicitacoes_preco_solicitante_id_fkey"
    FOREIGN KEY ("solicitante_id") REFERENCES "colaboradores"("id")
);

CREATE TABLE "audit_logs" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "timestamp"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "loja_id"     TEXT        NOT NULL,
  "actor_id"    TEXT        NOT NULL,
  "actor_tipo"  TEXT        NOT NULL,
  "actor_nome"  TEXT        NOT NULL,
  "actor_papel" TEXT        NOT NULL,
  "action"      TEXT        NOT NULL,
  "entity_type" TEXT        NOT NULL,
  "entity_id"   TEXT        NOT NULL,
  "entity_name" TEXT        NOT NULL,
  "changes"     JSONB,
  "ip_address"  TEXT,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "colaboradores_loja_id_idx"         ON "colaboradores"("loja_id");
CREATE INDEX "solicitacoes_preco_loja_status_idx" ON "solicitacoes_preco"("loja_id", "status");
CREATE INDEX "solicitacoes_preco_solicitante_idx" ON "solicitacoes_preco"("solicitante_id");
CREATE INDEX "audit_logs_loja_timestamp_idx"      ON "audit_logs"("loja_id", "timestamp" DESC);
CREATE INDEX "audit_logs_actor_id_idx"            ON "audit_logs"("actor_id");
