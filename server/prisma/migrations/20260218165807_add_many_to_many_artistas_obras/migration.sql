-- CreateTable
CREATE TABLE "_ArtistasEnObras" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistasEnObras_AB_unique" ON "_ArtistasEnObras"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistasEnObras_B_index" ON "_ArtistasEnObras"("B");

-- AddForeignKey
ALTER TABLE "_ArtistasEnObras" ADD CONSTRAINT "_ArtistasEnObras_A_fkey" FOREIGN KEY ("A") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistasEnObras" ADD CONSTRAINT "_ArtistasEnObras_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
