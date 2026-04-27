-- CreateTable
CREATE TABLE "ObraDeduccion" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "monto" DECIMAL(15,2),
    "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObraDeduccion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ObraDeduccion" ADD CONSTRAINT "ObraDeduccion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
