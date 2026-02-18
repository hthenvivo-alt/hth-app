-- CreateTable
CREATE TABLE "Invitado" (
    "id" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invitado" ADD CONSTRAINT "Invitado_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
