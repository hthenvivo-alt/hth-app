-- AlterTable
ALTER TABLE "LiquidacionReparto" ADD COLUMN     "aplicaAAA" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "driveFolderId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
