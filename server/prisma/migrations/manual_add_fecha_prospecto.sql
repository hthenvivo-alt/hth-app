-- Migración: tabla FechaProspecto (sección Programación)
-- Ejecutar en producción (Render) vía psql o pgAdmin

CREATE TABLE IF NOT EXISTS "FechaProspecto" (
    "id"                TEXT NOT NULL,
    "obraId"            TEXT NOT NULL,
    "ciudad"            TEXT NOT NULL,
    "pais"              TEXT NOT NULL DEFAULT 'Argentina',
    "fechaTentativa"    TIMESTAMP(3),
    "fechasTentativas"  TEXT,
    "salaNombre"        TEXT,
    "contactoNombre"    TEXT,
    "contactoEmail"     TEXT,
    "contactoTel"       TEXT,
    "acuerdoTipo"       TEXT,
    "acuerdoPorcentaje" DECIMAL(5,2),
    "acuerdoSobre"      TEXT,
    "acuerdoMonto"      DECIMAL(15,2),
    "estado"            TEXT NOT NULL DEFAULT 'idea',
    "notas"             TEXT,
    "funcionId"         TEXT UNIQUE,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FechaProspecto_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FechaProspecto_obraId_fkey"    FOREIGN KEY ("obraId")    REFERENCES "Obra"("id")    ON DELETE CASCADE,
    CONSTRAINT "FechaProspecto_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE SET NULL
);

-- Si la tabla ya existía, agregar la columna de múltiples fechas
ALTER TABLE "FechaProspecto" ADD COLUMN IF NOT EXISTS "fechasTentativas" TEXT;

CREATE INDEX IF NOT EXISTS "FechaProspecto_obraId_idx" ON "FechaProspecto"("obraId");
