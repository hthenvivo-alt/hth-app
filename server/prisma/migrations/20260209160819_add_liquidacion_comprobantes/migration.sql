/*
  Warnings:

  - You are about to drop the column `detalleTrasladoIda` on the `LogisticaRuta` table. All the data in the column will be lost.
  - You are about to drop the column `detalleTrasladoVuelta` on the `LogisticaRuta` table. All the data in the column will be lost.
  - You are about to drop the column `hotelDireccion` on the `LogisticaRuta` table. All the data in the column will be lost.
  - You are about to drop the column `hotelNombre` on the `LogisticaRuta` table. All the data in the column will be lost.
  - You are about to drop the column `tipoTrasladoIda` on the `LogisticaRuta` table. All the data in the column will be lost.
  - You are about to drop the column `tipoTrasladoVuelta` on the `LogisticaRuta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChecklistTarea" ADD COLUMN     "observaciones" TEXT;

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "liquidacionId" TEXT;

-- AlterTable
ALTER TABLE "Funcion" ADD COLUMN     "passVentaTicketera" TEXT,
ADD COLUMN     "ultimaActualizacionVentas" TIMESTAMP(3),
ADD COLUMN     "ultimaFacturacionBruta" DECIMAL(15,2),
ADD COLUMN     "userVentaTicketera" TEXT,
ADD COLUMN     "vendidas" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LogisticaRuta" DROP COLUMN "detalleTrasladoIda",
DROP COLUMN "detalleTrasladoVuelta",
DROP COLUMN "hotelDireccion",
DROP COLUMN "hotelNombre",
DROP COLUMN "tipoTrasladoIda",
DROP COLUMN "tipoTrasladoVuelta",
ADD COLUMN     "alojamientoNoAplicaArtista" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alojamientoNoAplicaProduccion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detalleTrasladoIdaArtista" TEXT,
ADD COLUMN     "detalleTrasladoIdaProduccion" TEXT,
ADD COLUMN     "detalleTrasladoVueltaArtista" TEXT,
ADD COLUMN     "detalleTrasladoVueltaProduccion" TEXT,
ADD COLUMN     "horarioCitacionArtista" TEXT,
ADD COLUMN     "horarioEntradaSala" TEXT,
ADD COLUMN     "hotelDireccionArtista" TEXT,
ADD COLUMN     "hotelDireccionProduccion" TEXT,
ADD COLUMN     "hotelNombreArtista" TEXT,
ADD COLUMN     "hotelNombreProduccion" TEXT,
ADD COLUMN     "linkFlyersRedes" TEXT,
ADD COLUMN     "linkGraficaTicketera" TEXT,
ADD COLUMN     "tipoTrasladoIdaArtista" TEXT,
ADD COLUMN     "tipoTrasladoIdaProduccion" TEXT,
ADD COLUMN     "tipoTrasladoVueltaArtista" TEXT,
ADD COLUMN     "tipoTrasladoVueltaProduccion" TEXT;

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidacion" (
    "id" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "facturacionTotal" DECIMAL(15,2) NOT NULL,
    "costosVenta" DECIMAL(15,2) NOT NULL,
    "recaudacionBruta" DECIMAL(15,2) NOT NULL,
    "recaudacionNeta" DECIMAL(15,2) NOT NULL,
    "acuerdoPorcentaje" DECIMAL(5,2) NOT NULL,
    "acuerdoSobre" TEXT NOT NULL,
    "resultadoCompania" DECIMAL(15,2) NOT NULL,
    "impuestoTransferencias" DECIMAL(15,2) NOT NULL,
    "impuestoTransferenciaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 1.2,
    "resultadoFuncion" DECIMAL(15,2) NOT NULL,
    "repartoArtistaPorcentaje" DECIMAL(5,2),
    "repartoProduccionPorcentaje" DECIMAL(5,2),
    "repartoArtistaMonto" DECIMAL(15,2),
    "repartoProduccionMonto" DECIMAL(15,2),
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "tipoCambio" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "bordereauxImage" TEXT,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "fechaConfirmacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionItem" (
    "id" TEXT NOT NULL,
    "liquidacionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "monto" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "LiquidacionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Liquidacion_funcionId_key" ON "Liquidacion"("funcionId");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionItem" ADD CONSTRAINT "LiquidacionItem_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
