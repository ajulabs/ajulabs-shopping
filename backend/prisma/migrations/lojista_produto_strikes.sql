ALTER TABLE "lojistas"
  ADD COLUMN "produto_strikes_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "produto_bloqueado_ate" TIMESTAMP;
