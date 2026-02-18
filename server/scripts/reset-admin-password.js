import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const email = 'admin@hth.com';
const newPassword = 'admin123';

async function resetPassword() {
    try {
        console.log(`Buscando usuario: ${email}...`);
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`Error: No se encontró el usuario con email ${email}`);
            process.exit(1);
        }

        console.log(`Generando hash para la nueva contraseña...`);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        console.log(`Actualizando contraseña para ${user.nombre} ${user.apellido}...`);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        console.log('--------------------------------------------------');
        console.log('¡ÉXITO!');
        console.log(`La contraseña para ${email} ha sido restablecida.`);
        console.log(`Nueva contraseña: ${newPassword}`);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
