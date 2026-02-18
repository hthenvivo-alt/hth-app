const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const gaspals = await prisma.liquidacionGrupal.findMany({
        take: 5
    });
    console.log(JSON.stringify(gaspals, null, 2));
    await prisma.$disconnect();
}

main();
