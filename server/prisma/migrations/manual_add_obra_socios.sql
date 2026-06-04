-- Manual migration: add ObraSocio table
CREATE TABLE IF NOT EXISTS "ObraSocio" (
  "id" TEXT NOT NULL,
  "obraId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "porcentaje" DECIMAL(5,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ObraSocio_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ObraSocio_obraId_fkey" FOREIGN KEY ("obraId")
    REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
