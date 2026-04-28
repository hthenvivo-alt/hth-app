ALTER TABLE "SimulacionEscenario" ADD COLUMN "ingresoManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SimulacionEscenario" ADD COLUMN "ventaManualMonto" DECIMAL(15, 2);
ALTER TABLE "SimulacionEscenario" ADD COLUMN "aforoManual" INTEGER;
ALTER TABLE "Funcion" ADD COLUMN "acuerdoPorcentaje" DECIMAL(5, 2);
ALTER TABLE "Funcion" ADD COLUMN "acuerdoSobre" TEXT DEFAULT 'Neta';
