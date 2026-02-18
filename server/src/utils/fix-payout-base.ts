import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPayoutBases() {
    console.log('--- Corrigiendo Bases de Reparto ---');

    // Buscar liquidaciones no confirmadas o recientes donde la base sea 'Neta'
    // Especialmente aquellas con 70% o similar que están causando utilidad cero
    const repartosIncorrectos = await prisma.liquidacionReparto.findMany({
        where: {
            base: 'Neta',
            liquidacion: {
                confirmada: false // Solo borradores para evitar alterar facturaciones pasadas cerradas
            }
        },
        include: {
            liquidacion: true
        }
    });

    console.log(`Encontrados ${repartosIncorrectos.length} repartos con base Neta en borradores.`);

    for (const reparto of repartosIncorrectos) {
        console.log(`Corrigiendo reparto para ${reparto.nombreArtista} (${reparto.porcentaje}%)...`);

        // Cambiar base a Utilidad
        await prisma.liquidacionReparto.update({
            where: { id: reparto.id },
            data: {
                base: 'Utilidad'
            }
        });
    }

    // Opcionalmente, corregir las Obras para que los nuevos repartos salgan bien
    const payoutObras = await prisma.artistaPayout.findMany({
        where: { base: 'Neta' }
    });

    console.log(`Encontradas ${payoutObras.length} plantillas de Obra con base Neta.`);
    for (const po of payoutObras) {
        await prisma.artistaPayout.update({
            where: { id: po.id },
            data: { base: 'Utilidad' }
        });
    }

    console.log('--- Hecho ---');
}

fixPayoutBases()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
