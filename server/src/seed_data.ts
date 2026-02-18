
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple addDays function
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Simple subDays function
function subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

async function main() {
    console.log('Seeding sample data...');

    // 1. Ensure Admin exists
    const admin = await prisma.user.findUnique({ where: { email: 'admin@hth.com' } });
    if (!admin) {
        console.error('Admin user not found. Please run npm run seed first.');
        return;
    }

    // 2. Create Obras
    const obra1 = await prisma.obra.create({
        data: {
            nombre: 'Hamlet',
            artistaPrincipal: 'Compañía Shakespeare',
            estado: 'En Gira',
            productorEjecutivoId: admin.id,
            descripcion: 'Clásico de Shakespeare en adaptación moderna.'
        }
    });

    const obra2 = await prisma.obra.create({
        data: {
            nombre: 'El Cascanueces',
            artistaPrincipal: 'Ballet Nacional',
            estado: 'En Gira',
            productorEjecutivoId: admin.id,
            descripcion: 'Ballet clásico de Navidad.'
        }
    });

    console.log('Created Obras:', obra1.nombre, obra2.nombre);

    // 3. Create Funciones
    // Past Main Function (Closed Settlement)
    const funcionPasada = await prisma.funcion.create({
        data: {
            obraId: obra1.id,
            fecha: subDays(new Date(), 5),
            salaNombre: 'Teatro Colón',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            capacidadSala: 2500,
            precioEntradaBase: 15000,
            vendidas: 2000,
            ultimaFacturacionBruta: 30000000,
            productorAsociadoId: admin.id
        }
    });

    // Future Function
    const funcionFutura = await prisma.funcion.create({
        data: {
            obraId: obra2.id,
            fecha: addDays(new Date(), 10),
            salaNombre: 'Teatro Gran Rex',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            capacidadSala: 3200,
            precioEntradaBase: 12000,
            vendidas: 500,
            productorAsociadoId: admin.id
        }
    });

    // Another Past Function (Open Settlement)
    const funcionPasadaOpen = await prisma.funcion.create({
        data: {
            obraId: obra1.id,
            fecha: subDays(new Date(), 2),
            salaNombre: 'Teatro Municipal',
            ciudad: 'Rosario',
            pais: 'Argentina',
            capacidadSala: 1000,
            precioEntradaBase: 10000,
            vendidas: 800,
            ultimaFacturacionBruta: 8000000,
            productorAsociadoId: admin.id
        }
    });

    console.log('Created Funciones');

    // 4. Create Liquidacion for Past Main Function (Confirmada)
    await prisma.liquidacion.create({
        data: {
            funcionId: funcionPasada.id,
            facturacionTotal: 30000000,
            costosVenta: 1000000,
            recaudacionBruta: 29000000,
            recaudacionNeta: 28500000, // Reduced from Bruta - Deductions

            acuerdoPorcentaje: 0,
            acuerdoSobre: 'Neta',
            resultadoCompania: 28500000,

            impuestoTransferenciaPorcentaje: 1.2,
            impuestoTransferencias: 342000,

            resultadoFuncion: 28000000, // Approx

            repartoArtistaPorcentaje: 70,
            repartoProduccionPorcentaje: 30,
            repartoArtistaMonto: 19600000,
            repartoProduccionMonto: 8400000,

            moneda: 'ARS',
            tipoCambio: 1,
            confirmada: true,
            fechaConfirmacion: new Date(),

            items: {
                create: [
                    { tipo: 'Deduccion', concepto: 'Argentores', porcentaje: 1, monto: 290000 },
                    { tipo: 'Gasto', concepto: 'Hotel Elenco', monto: 158000 },
                    { tipo: 'Gasto', concepto: 'Catering', monto: 50000 }
                ]
            }
        }
    });

    console.log('Created Liquidacion for', funcionPasada.salaNombre);
    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
