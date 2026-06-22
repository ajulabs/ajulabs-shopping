CREATE TABLE "produto_avisos_estoque" (
  "id"            TEXT PRIMARY KEY,
  "produto_id"    TEXT NOT NULL REFERENCES "produtos"("id") ON DELETE CASCADE,
  "consumidor_id" TEXT NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "criado_em"     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("produto_id", "consumidor_id")
);

CREATE INDEX "produto_avisos_estoque_produto_id_idx"
  ON "produto_avisos_estoque" ("produto_id");

CREATE INDEX "produto_avisos_estoque_consumidor_id_idx"
  ON "produto_avisos_estoque" ("consumidor_id");
