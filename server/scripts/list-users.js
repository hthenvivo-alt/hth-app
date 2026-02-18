import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        console.log('Listado de usuarios en la base de datos:');
        const users = await prisma.user.findMany({
            select: {
                email: true,
                nombre: true,
                apellido: true,
                rol: true
            }
        });

        if (users.length === 0) {
            console.log('No se encontraron usuarios.');
        } else {
            console.table(users);
        }
    } catch (error) {
        console.error('Error al listar usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
