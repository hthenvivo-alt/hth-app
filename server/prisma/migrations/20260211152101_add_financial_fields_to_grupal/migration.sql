-- AlterTable
ALTER TABLE "Liquidacion" ADD COLUMN     "grupalId" TEXT;

-- CreateTable
CREATE TABLE "ArtistaPayout" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "base" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistaPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionGrupal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "facturacionTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costosVenta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costosVentaPorcentaje" DECIMAL(5,2),
    "recaudacionBruta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recaudacionNeta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "acuerdoPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "acuerdoSobre" TEXT NOT NULL DEFAULT 'Neta',
    "impuestoTransferenciaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 1.2,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "tipoCambio" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidacionGrupal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionGrupalItem" (
    "id" TEXT NOT NULL,
    "grupalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "monto" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "LiquidacionGrupalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionReparto" (
    "id" TEXT NOT NULL,
    "liquidacionId" TEXT NOT NULL,
    "nombreArtista" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "base" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "retencionAAA" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidacionReparto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtistaPayout" ADD CONSTRAINT "ArtistaPayout_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_grupalId_fkey" FOREIGN KEY ("grupalId") REFERENCES "LiquidacionGrupal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionGrupalItem" ADD CONSTRAINT "LiquidacionGrupalItem_grupalId_fkey" FOREIGN KEY ("grupalId") REFERENCES "LiquidacionGrupal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionReparto" ADD CONSTRAINT "LiquidacionReparto_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
