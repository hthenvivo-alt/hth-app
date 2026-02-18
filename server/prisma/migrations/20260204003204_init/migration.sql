-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "rol" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "artistaPrincipal" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL,
    "fechaEstreno" TIMESTAMP(3),
    "productorEjecutivoId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcion" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "salaNombre" TEXT NOT NULL,
    "salaDireccion" TEXT,
    "ciudad" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Argentina',
    "capacidadSala" INTEGER,
    "precioEntradaBase" DECIMAL(10,2),
    "linkVentaTicketera" TEXT,
    "linkMonitoreoVenta" TEXT,
    "notasProduccion" TEXT,
    "productorAsociadoId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticaRuta" (
    "id" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "tipoTrasladoIda" TEXT,
    "detalleTrasladoIda" TEXT,
    "hotelNombre" TEXT,
    "hotelDireccion" TEXT,
    "comidasDetalle" TEXT,
    "contactosLocales" TEXT,
    "telProductorEjecutivo" TEXT,
    "telProductorAsociado" TEXT,
    "telTraslados" TEXT,
    "telHoteles" TEXT,
    "tipoTrasladoVuelta" TEXT,
    "detalleTrasladoVuelta" TEXT,
    "fechaEnvioRuta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticaRuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTarea" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "funcionId" TEXT,
    "descripcionTarea" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "obraId" TEXT,
    "funcionId" TEXT,
    "nombreDocumento" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "linkDrive" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoVenta" TEXT NOT NULL,
    "entradasVendidas" INTEGER NOT NULL,
    "facturacionBruta" DECIMAL(15,2),
    "canalVenta" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "obraId" TEXT,
    "funcionId" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "tipoGasto" TEXT NOT NULL,
    "comprobanteDocumentoId" TEXT,
    "fechaGasto" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticaRuta_funcionId_key" ON "LogisticaRuta"("funcionId");

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_productorEjecutivoId_fkey" FOREIGN KEY ("productorEjecutivoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcion" ADD CONSTRAINT "Funcion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcion" ADD CONSTRAINT "Funcion_productorAsociadoId_fkey" FOREIGN KEY ("productorAsociadoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticaRuta" ADD CONSTRAINT "LogisticaRuta_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTarea" ADD CONSTRAINT "ChecklistTarea_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTarea" ADD CONSTRAINT "ChecklistTarea_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTarea" ADD CONSTRAINT "ChecklistTarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_comprobanteDocumentoId_fkey" FOREIGN KEY ("comprobanteDocumentoId") REFERENCES "Documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
