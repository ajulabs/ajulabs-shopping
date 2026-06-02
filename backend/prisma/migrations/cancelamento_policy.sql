-- Migration: cancellation policy
-- Adds cancellation metadata to pedidos and quality metric to lojas

CREATE TYPE "CancelamentoPor" AS ENUM ('consumidor', 'lojista', 'admin');

ALTER TABLE "pedidos"
  ADD COLUMN "cancelado_por"        "CancelamentoPor",
  ADD COLUMN "motivo_cancelamento"  TEXT,
  ADD COLUMN "penalizou_lojista"    BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "lojas"
  ADD COLUMN "cancelamentos_apos_aceite" INTEGER NOT NULL DEFAULT 0;
