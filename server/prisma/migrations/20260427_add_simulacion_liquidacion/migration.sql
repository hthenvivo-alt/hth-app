-- CreateTable
CREATE TABLE "SimulacionLiquidacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "notas" TEXT,
    "createdById" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulacionLiquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacionEscenario" (
    "id" TEXT NOT NULL,
    "simulacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Escenario 1',
    "ocupacionPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "costoTarjetaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "acuerdoPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "acuerdoSobre" TEXT NOT NULL DEFAULT 'Neta',
    "impuestoTransferenciaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 1.2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulacionEscenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacionCategoria" (
    "id" TEXT NOT NULL,
    "escenarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(15,2) NOT NULL,
    "aforo" INTEGER NOT NULL,

    CONSTRAINT "SimulacionCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacionGasto" (
    "id" TEXT NOT NULL,
    "escenarioId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "SimulacionGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacionDeduccion" (
    "id" TEXT NOT NULL,
    "escenarioId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "monto" DECIMAL(15,2),
    "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SimulacionDeduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacionReparto" (
    "id" TEXT NOT NULL,
    "escenarioId" TEXT NOT NULL,
    "nombreArtista" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "base" TEXT NOT NULL DEFAULT 'Utilidad',
    "aplicaAAA" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SimulacionReparto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SimulacionLiquidacion" ADD CONSTRAINT "SimulacionLiquidacion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionLiquidacion" ADD CONSTRAINT "SimulacionLiquidacion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionEscenario" ADD CONSTRAINT "SimulacionEscenario_simulacionId_fkey" FOREIGN KEY ("simulacionId") REFERENCES "SimulacionLiquidacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionCategoria" ADD CONSTRAINT "SimulacionCategoria_escenarioId_fkey" FOREIGN KEY ("escenarioId") REFERENCES "SimulacionEscenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionGasto" ADD CONSTRAINT "SimulacionGasto_escenarioId_fkey" FOREIGN KEY ("escenarioId") REFERENCES "SimulacionEscenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionDeduccion" ADD CONSTRAINT "SimulacionDeduccion_escenarioId_fkey" FOREIGN KEY ("escenarioId") REFERENCES "SimulacionEscenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacionReparto" ADD CONSTRAINT "SimulacionReparto_escenarioId_fkey" FOREIGN KEY ("escenarioId") REFERENCES "SimulacionEscenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
