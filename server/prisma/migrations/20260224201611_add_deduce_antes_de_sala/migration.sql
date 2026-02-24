-- AlterTable
ALTER TABLE "LiquidacionGrupalItem" ADD COLUMN     "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "LiquidacionItem" ADD COLUMN     "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true;
