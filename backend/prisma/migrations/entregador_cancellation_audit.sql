-- Migration: persist evidence of courier-side cancellation
-- Stores motivo + foto + canceladoPor so anti-fraud / support can audit
-- couriers who abandon mid-corrida instead of carrying through.

ALTER TYPE "CancelamentoPor" ADD VALUE IF NOT EXISTS 'entregador';

CREATE TYPE "MotivoCancelamentoEntregador" AS ENUM ('area_risco', 'pneu_furou', 'acidente');

CREATE TABLE "cancelamentos_entregador" (
  "id"            TEXT PRIMARY KEY,
  "pedido_id"     TEXT NOT NULL REFERENCES "pedidos"("id") ON DELETE CASCADE,
  "entregador_id" TEXT NOT NULL REFERENCES "entregadores"("id") ON DELETE CASCADE,
  "motivo"        "MotivoCancelamentoEntregador" NOT NULL,
  "foto_url"      TEXT NOT NULL,
  "criado_em"     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "cancelamentos_entregador_pedido_id_idx"
  ON "cancelamentos_entregador" ("pedido_id");

CREATE INDEX "cancelamentos_entregador_entregador_id_idx"
  ON "cancelamentos_entregador" ("entregador_id");
