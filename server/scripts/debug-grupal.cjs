const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const id = process.argv[2];
    if (!id) {
        console.error('Please provide a group settlement ID');
        process.exit(1);
    }

    const grupal = await prisma.liquidacionGrupal.findUnique({
        where: { id },
        include: {
            liquidaciones: {
                include: {
                    funcion: true,
                    items: true
                }
            },
            items: true
        }
    });

    console.log(JSON.stringify(grupal, null, 2));
    await prisma.$disconnect();
}

debug();
