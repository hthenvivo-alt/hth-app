import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@hth.com' },
        update: {},
        create: {
            email: 'admin@hth.com',
            nombre: 'Admin',
            apellido: 'HTH',
            rol: 'Admin',
            passwordHash: passwordHash,
            activo: true,
        },
    });

    console.log('Seeded admin user:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
