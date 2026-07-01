/*
  Warnings:

  - The values [ADJUSTMENT] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockMovementType_new" AS ENUM ('IN', 'OUT');
ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "StockMovementType_new" USING ("type"::text::"StockMovementType_new");
ALTER TYPE "StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "StockMovementType_old";
COMMIT;
