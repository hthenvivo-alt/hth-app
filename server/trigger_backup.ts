import { createBackup } from './src/controllers/backup.js';
import prisma from './src/lib/prisma.js';

async function run() {
    try {
        console.log('Triggering manual backup V1.1...');
        const filename = await createBackup();
        console.log('Backup created successfully:', filename);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
