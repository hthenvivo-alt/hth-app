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
        // Transactional Restore
        await prisma.$transaction(async (tx) => {
            // 1. CLEAR DATABASE (Correct order to avoid FK violations)
            // Leaf tables first
            await tx.liquidacionReparto.deleteMany();
            await tx.liquidacionItem.deleteMany();
            await tx.liquidacionGrupalItem.deleteMany();
            await tx.liquidacion.deleteMany();
            await tx.liquidacionGrupal.deleteMany();
            await tx.invitado.deleteMany();
            await tx.venta.deleteMany();
            await tx.gasto.deleteMany();
            await tx.mensaje.deleteMany();
            await tx.checklistTarea.deleteMany();
            await tx.logisticaRuta.deleteMany();
            await tx.documento.deleteMany();
            await tx.artistaPayout.deleteMany();
            await tx.obraDeduccion.deleteMany();
            await tx.funcion.deleteMany();
            await tx.obra.deleteMany();
            await tx.user.deleteMany();
            // 2. INSERT DATA (Correct order: Parents first)
            if (data.users?.length)
                await tx.user.createMany({ data: data.users });
            if (data.obras?.length)
                await tx.obra.createMany({ data: data.obras });
            if (data.funciones?.length)
                await tx.funcion.createMany({ data: data.funciones });
            if (data.obraDeducciones?.length)
                await tx.obraDeduccion.createMany({ data: data.obraDeducciones });
            if (data.artistaPayouts?.length)
                await tx.artistaPayout.createMany({ data: data.artistaPayouts });
            if (data.logisticaRutas?.length)
                await tx.logisticaRuta.createMany({ data: data.logisticaRutas });
            if (data.checklists?.length)
                await tx.checklistTarea.createMany({ data: data.checklists });
            if (data.documentos?.length)
                await tx.documento.createMany({ data: data.documentos });
            if (data.mensajes?.length)
                await tx.mensaje.createMany({ data: data.mensajes });
            if (data.gastos?.length)
                await tx.gasto.createMany({ data: data.gastos });
            if (data.ventas?.length)
                await tx.venta.createMany({ data: data.ventas });
            if (data.invitados?.length)
                await tx.invitado.createMany({ data: data.invitados });
            if (data.liquidacionGrupals?.length)
                await tx.liquidacionGrupal.createMany({ data: data.liquidacionGrupals });
            if (data.liquidaciones?.length)
                await tx.liquidacion.createMany({ data: data.liquidaciones }); // Liquidaciones refer to Funcion
            if (data.liquidacionGrupalItems?.length)
                await tx.liquidacionGrupalItem.createMany({ data: data.liquidacionGrupalItems });
            if (data.liquidacionItems?.length)
                await tx.liquidacionItem.createMany({ data: data.liquidacionItems });
            if (data.liquidacionRepartos?.length)
                await tx.liquidacionReparto.createMany({ data: data.liquidacionRepartos });
        }, {
            timeout: 30000 // Increase timeout to 30s for large restores
        });
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
