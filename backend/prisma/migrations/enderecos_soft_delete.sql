-- Migration: soft delete for user addresses
-- Lets users remove addresses that are already referenced by past orders
-- without breaking the foreign key from `pedidos.endereco_entrega_id`.

ALTER TABLE "enderecos_usuario"
  ADD COLUMN "arquivado" BOOLEAN NOT NULL DEFAULT FALSE;
