import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting migration of artist payouts...');

        const liquidaciones = await prisma.liquidacion.findMany({
            include: {
                funcion: {
                    include: {
                        obra: true
                    }
                },
                repartos: true
            }
        });

        console.log(`Checking ${liquidaciones.length} liquidaciones...`);

        for (const liq of liquidaciones) {
            // Check if it has legacy data but no repartos records
            const hasLegacyData = (Number(liq.repartoArtistaMonto) > 0 || Number(liq.repartoArtistaPorcentaje) > 0);
            const hasNoRepartos = liq.repartos.length === 0;

            if (hasLegacyData && hasNoRepartos) {
                const nombreArtista = liq.funcion.obra.artistaPrincipal || 'Artista';
                console.log(`Migrating payout for ${nombreArtista} in liquidacion ${liq.id}...`);

                await prisma.liquidacionReparto.create({
                    data: {
                        liquidacionId: liq.id,
                        nombreArtista: nombreArtista,
                        porcentaje: Number(liq.repartoArtistaPorcentaje) || 0,
                        base: liq.acuerdoSobre === 'Bruta' ? 'Bruta' : 'Neta', // Best guess based on legacy logic
                        monto: Number(liq.repartoArtistaMonto) || 0,
                        retencionAAA: Math.round((Number(liq.repartoArtistaMonto) || 0) * 0.06 * 100) / 100
                    }
                });
            }
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
