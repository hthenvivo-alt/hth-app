
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export const createBackup = async (req?: AuthRequest, res?: Response) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        // Fetch all data
        // We order operations to respect Foreign Key constraints during restore if we were to insert sequentially,
        // but for backup we just need to grab everything.
        const users = await prisma.user.findMany();
        const obras = await prisma.obra.findMany();
        const funciones = await prisma.funcion.findMany();
        const logisticaRutas = await prisma.logisticaRuta.findMany();
        const checklists = await prisma.checklistTarea.findMany();
        const documentos = await prisma.documento.findMany();
        const liquidaciones = await prisma.liquidacion.findMany({ include: { items: true } });
        const ventas = await prisma.venta.findMany();
        const gastos = await prisma.gasto.findMany();
        const mensajes = await prisma.mensaje.findMany();

        const backupData = {
            meta: {
                timestamp: new Date(),
                version: '1.0'
            },
            data: {
                users,
                obras,
                funciones,
                logisticaRutas,
                checklists,
                documentos,
                liquidaciones,
                ventas,
                gastos,
                mensajes
            }
        };

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        console.log(`Backup created: ${filename}`);

        if (res) {
            res.json({ message: 'Backup created successfully', filename, timestamp: backupData.meta.timestamp });
        }
        return filename;
    } catch (error) {
        console.error('Error creating backup:', error);
        if (res) res.status(500).json({ error: 'Error creating backup' });
    }
};

export const getBackups = async (req: AuthRequest, res: Response) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json([]);
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    filename: file,
                    created_at: stats.birthtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

        res.json(files);
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ error: 'Error listing backups' });
    }
};

export const restoreBackup = async (req: AuthRequest, res: Response) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename as string);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Backup file not found' });
    }

    try {
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const backup = JSON.parse(fileContent);
        const { data } = backup;

        // Transactional Restore
        await prisma.$transaction(async (tx) => {
            // 1. CLEAR DATABASE (Order matters due to Foreign Keys)
            // Delete child tables first
            await tx.liquidacionItem.deleteMany();
            await tx.liquidacion.deleteMany();
            await tx.checklistTarea.deleteMany();
            await tx.venta.deleteMany();
            await tx.gasto.deleteMany();
            await tx.mensaje.deleteMany();
            await tx.logisticaRuta.deleteMany();
            await tx.documento.deleteMany(); // Documento can depend on nothing or other things, but usually leaf-ish
            await tx.funcion.deleteMany();
            await tx.obra.deleteMany();
            await tx.user.deleteMany();

            // 2. INSERT DATA (Order matters: Parents first)
            // Users
            if (data.users?.length) await tx.user.createMany({ data: data.users });

            // Obras
            if (data.obras?.length) await tx.obra.createMany({ data: data.obras });

            // Funciones
            if (data.funciones?.length) await tx.funcion.createMany({ data: data.funciones });

            // Liquidaciones (Complicated/Deep structure usually handled by createMany, but createMany doesn't support nested relations in one go easily if IDs are preserved)
            // Since we backed up raw table data (including IDs), createMany is fine for the main table.
            if (data.liquidaciones?.length) {
                // Separate Items from Liquidacion header
                const liquidacionesHeaders = data.liquidaciones.map((l: any) => {
                    const { items, ...header } = l;
                    return header;
                });

                await tx.liquidacion.createMany({ data: liquidacionesHeaders });

                // Items
                const allItems: any[] = [];
                data.liquidaciones.forEach((l: any) => {
                    if (l.items && l.items.length) {
                        allItems.push(...l.items);
                    }
                });

                if (allItems.length) await tx.liquidacionItem.createMany({ data: allItems });
            }

            // Logistica
            if (data.logisticaRutas?.length) await tx.logisticaRuta.createMany({ data: data.logisticaRutas });

            // Checklists
            if (data.checklists?.length) await tx.checklistTarea.createMany({ data: data.checklists });

            // Documentos
            if (data.documentos?.length) await tx.documento.createMany({ data: data.documentos });

            // Mensajes
            if (data.mensajes?.length) await tx.mensaje.createMany({ data: data.mensajes });

            // Gastos
            if (data.gastos?.length) await tx.gasto.createMany({ data: data.gastos });

            // Ventas
            if (data.ventas?.length) await tx.venta.createMany({ data: data.ventas });
        });

        res.json({ message: 'Backup restored successfully' });
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ error: 'Error restoring backup' });
    }
};

export const downloadBackup = async (req: AuthRequest, res: Response) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename as string);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(filepath);
};
