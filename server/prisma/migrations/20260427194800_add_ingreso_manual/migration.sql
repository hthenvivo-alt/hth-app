ALTER TABLE "SimulacionEscenario" ADD COLUMN "ingresoManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SimulacionEscenario" ADD COLUMN "ventaManualMonto" DECIMAL(15, 2);
ALTER TABLE "SimulacionEscenario" ADD COLUMN "aforoManual" INTEGER;