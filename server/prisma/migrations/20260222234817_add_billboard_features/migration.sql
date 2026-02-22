-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Mensaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;
