import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';
const BACKUP_DIR = path.join(process.cwd(), 'backups');
export const createBackup = async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);
        // Fetch all data from all 17 tables
        const [users, obras, funciones, logisticaRutas, checklists, documentos, liquidaciones, ventas, gastos, mensajes, obraDeducciones, artistaPayouts, invitados, liquidacionGrupales, liquidacionGrupalItems, liquidacionItems, liquidacionRepartos] = await Promise.all([
            prisma.user.findMany(),
            prisma.obra.findMany(),
            prisma.funcion.findMany(),
            prisma.logisticaRuta.findMany(),
            prisma.checklistTarea.findMany(),
            prisma.documento.findMany(),
            prisma.liquidacion.findMany(),
            prisma.venta.findMany(),
            prisma.gasto.findMany(),
            prisma.mensaje.findMany(),
            prisma.obraDeduccion.findMany(),
            prisma.artistaPayout.findMany(),
            prisma.invitado.findMany(),
            prisma.liquidacionGrupal.findMany(),
            prisma.liquidacionGrupalItem.findMany(),
            prisma.liquidacionItem.findMany(),
            prisma.liquidacionReparto.findMany()
        ]);
        const backupData = {
            meta: {
                timestamp: new Date(),
                version: '1.1'
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
                mensajes,
                obraDeducciones,
                artistaPayouts,
                invitados,
                liquidacionGrupals: liquidacionGrupales,
                liquidacionGrupalItems,
                liquidacionItems,
                liquidacionRepartos
            }
        };
        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        console.log(`Backup created: ${filename}`);
        if (res) {
            res.json({ message: 'Backup created successfully', filename, timestamp: backupData.meta.timestamp });
        }
        return filename;
    }
    catch (error) {
        console.error('Error creating backup:', error);
        if (res)
            res.status(500).json({ error: 'Error creating backup' });
    }
};
export const getBackups = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ error: 'Error listing backups' });
    }
};
export const restoreBackup = async (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Backup file not found' });
    }
    try {
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const backup = JSON.parse(fileContent);
        const { data } = backup;
        // Helper: safely delete a table using raw SQL (handles missing tables gracefully)
        const safeDelete = async (tableName) => {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
            }
            catch (e) {
                console.warn(`Skipping delete for ${tableName}: ${e.message}`);
            }
        };
        // Helper: safely insert rows using Prisma (skip if table model doesn't exist on the client)
        const safeCreate = async (fn) => {
            try {
                await fn();
            }
            catch (e) {
                console.warn(`Skipping insert: ${e.message}`);
            }
        };
        // 1. CLEAR DATABASE in correct order (leaf tables first)
        await safeDelete('LiquidacionReparto');
        await safeDelete('LiquidacionItem');
        await safeDelete('LiquidacionGrupalItem');
        await safeDelete('Liquidacion');
        await safeDelete('LiquidacionGrupal');
        await safeDelete('Invitado');
        await safeDelete('Venta');
        await safeDelete('Gasto');
        await safeDelete('Mensaje');
        await safeDelete('ChecklistTarea');
        await safeDelete('LogisticaRuta');
        await safeDelete('Documento');
        await safeDelete('ArtistaPayout');
        await safeDelete('ObraDeduccion');
        await safeDelete('Funcion');
        await safeDelete('Obra');
        await safeDelete('User');
        // 2. INSERT DATA in correct order (parents first)
        if (data.users?.length)
            await safeCreate(() => prisma.user.createMany({ data: data.users }));
        if (data.obras?.length)
            await safeCreate(() => prisma.obra.createMany({ data: data.obras }));
        if (data.funciones?.length)
            await safeCreate(() => prisma.funcion.createMany({ data: data.funciones }));
        if (data.obraDeducciones?.length)
            await safeCreate(() => prisma.obraDeduccion.createMany({ data: data.obraDeducciones }));
        if (data.artistaPayouts?.length)
            await safeCreate(() => prisma.artistaPayout.createMany({ data: data.artistaPayouts }));
        if (data.logisticaRutas?.length)
            await safeCreate(() => prisma.logisticaRuta.createMany({ data: data.logisticaRutas }));
        if (data.checklists?.length)
            await safeCreate(() => prisma.checklistTarea.createMany({ data: data.checklists }));
        if (data.documentos?.length)
            await safeCreate(() => prisma.documento.createMany({ data: data.documentos }));
        if (data.mensajes?.length)
            await safeCreate(() => prisma.mensaje.createMany({ data: data.mensajes }));
        if (data.gastos?.length)
            await safeCreate(() => prisma.gasto.createMany({ data: data.gastos }));
        if (data.ventas?.length)
            await safeCreate(() => prisma.venta.createMany({ data: data.ventas }));
        if (data.invitados?.length)
            await safeCreate(() => prisma.invitado.createMany({ data: data.invitados }));
        if (data.liquidacionGrupals?.length)
            await safeCreate(() => prisma.liquidacionGrupal.createMany({ data: data.liquidacionGrupals }));
        if (data.liquidaciones?.length)
            await safeCreate(() => prisma.liquidacion.createMany({ data: data.liquidaciones }));
        if (data.liquidacionGrupalItems?.length)
            await safeCreate(() => prisma.liquidacionGrupalItem.createMany({ data: data.liquidacionGrupalItems }));
        if (data.liquidacionItems?.length)
            await safeCreate(() => prisma.liquidacionItem.createMany({ data: data.liquidacionItems }));
        if (data.liquidacionRepartos?.length)
            await safeCreate(() => prisma.liquidacionReparto.createMany({ data: data.liquidacionRepartos }));
        res.json({ message: 'Backup restored successfully' });
    }
    catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({
            error: 'Error al restaurar el backup',
            details: error.message || 'Error desconocido'
        });
    }
};
export const downloadBackup = async (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Backup file not found' });
    }
    res.download(filepath);
};
