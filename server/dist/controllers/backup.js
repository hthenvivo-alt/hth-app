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
    const log = [];
    const errors = [];
    try {
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const backup = JSON.parse(fileContent);
        const { data } = backup;
        log.push(`Backup parsed: ${Object.keys(data).map(k => `${k}:${Array.isArray(data[k]) ? data[k].length : 0}`).join(', ')}`);
        // Helper: safely delete
        const safeDelete = async (tableName) => {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
                log.push(`✓ Deleted ${tableName}`);
            }
            catch (e) {
                log.push(`⚠ Skip delete ${tableName}: ${e.message?.substring(0, 100)}`);
            }
        };
        // Helper: insert with error tracking
        const safeCreate = async (name, fn, count) => {
            try {
                const result = await fn();
                log.push(`✓ Inserted ${name}: ${count} records`);
                return true;
            }
            catch (e) {
                const msg = `✗ FAILED ${name} (${count} records): ${e.message?.substring(0, 200)}`;
                log.push(msg);
                errors.push(msg);
                return false;
            }
        };
        // 0. PATCH SCHEMA
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "ObraDeduccion" (
                    "id" TEXT NOT NULL, "obraId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                    "porcentaje" DECIMAL(5,2), "monto" DECIMAL(15,2),
                    "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true,
                    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "ObraDeduccion_pkey" PRIMARY KEY ("id")
                );
                CREATE TABLE IF NOT EXISTS "ArtistaPayout" (
                    "id" TEXT NOT NULL, "obraId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                    "porcentaje" DECIMAL(5,2) NOT NULL, "base" TEXT NOT NULL,
                    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "ArtistaPayout_pkey" PRIMARY KEY ("id")
                );
                CREATE TABLE IF NOT EXISTS "Invitado" (
                    "id" TEXT NOT NULL, "funcionId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                    "cantidad" INTEGER NOT NULL,
                    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "Invitado_pkey" PRIMARY KEY ("id")
                );
            `);
            log.push('✓ Schema patched');
        }
        catch (e) {
            log.push(`⚠ Schema patch: ${e.message?.substring(0, 100)}`);
        }
        // 1. CLEAR all tables
        await safeDelete('_ArtistasEnObras');
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
        // 2. INSERT in dependency order
        if (data.users?.length) {
            await safeCreate('users', () => prisma.user.createMany({ data: data.users }), data.users.length);
        }
        if (data.obras?.length) {
            await safeCreate('obras', () => prisma.obra.createMany({ data: data.obras }), data.obras.length);
        }
        if (data.funciones?.length) {
            await safeCreate('funciones', () => prisma.funcion.createMany({ data: data.funciones }), data.funciones.length);
        }
        if (data.obraDeducciones?.length) {
            await safeCreate('obraDeducciones', () => prisma.obraDeduccion.createMany({ data: data.obraDeducciones }), data.obraDeducciones.length);
        }
        if (data.artistaPayouts?.length) {
            await safeCreate('artistaPayouts', () => prisma.artistaPayout.createMany({ data: data.artistaPayouts }), data.artistaPayouts.length);
        }
        if (data.logisticaRutas?.length) {
            await safeCreate('logisticaRutas', () => prisma.logisticaRuta.createMany({ data: data.logisticaRutas }), data.logisticaRutas.length);
        }
        if (data.checklists?.length) {
            await safeCreate('checklists', () => prisma.checklistTarea.createMany({ data: data.checklists }), data.checklists.length);
        }
        if (data.documentos?.length) {
            await safeCreate('documentos', () => prisma.documento.createMany({ data: data.documentos }), data.documentos.length);
        }
        if (data.mensajes?.length) {
            await safeCreate('mensajes', () => prisma.mensaje.createMany({ data: data.mensajes }), data.mensajes.length);
        }
        if (data.gastos?.length) {
            await safeCreate('gastos', () => prisma.gasto.createMany({ data: data.gastos }), data.gastos.length);
        }
        if (data.ventas?.length) {
            await safeCreate('ventas', () => prisma.venta.createMany({ data: data.ventas }), data.ventas.length);
        }
        if (data.invitados?.length) {
            await safeCreate('invitados', () => prisma.invitado.createMany({ data: data.invitados }), data.invitados.length);
        }
        if (data.liquidacionGrupals?.length) {
            await safeCreate('liquidacionGrupals', () => prisma.liquidacionGrupal.createMany({ data: data.liquidacionGrupals }), data.liquidacionGrupals.length);
        }
        if (data.liquidaciones?.length) {
            // Strip any nested relations that Prisma can't handle in createMany
            const cleanLiquidaciones = data.liquidaciones.map((l) => {
                const { items, repartos, comprobantes, funcion, grupal, ...clean } = l;
                return clean;
            });
            await safeCreate('liquidaciones', () => prisma.liquidacion.createMany({ data: cleanLiquidaciones }), cleanLiquidaciones.length);
        }
        if (data.liquidacionGrupalItems?.length) {
            await safeCreate('liquidacionGrupalItems', () => prisma.liquidacionGrupalItem.createMany({ data: data.liquidacionGrupalItems }), data.liquidacionGrupalItems.length);
        }
        if (data.liquidacionItems?.length) {
            await safeCreate('liquidacionItems', () => prisma.liquidacionItem.createMany({ data: data.liquidacionItems }), data.liquidacionItems.length);
        }
        if (data.liquidacionRepartos?.length) {
            await safeCreate('liquidacionRepartos', () => prisma.liquidacionReparto.createMany({ data: data.liquidacionRepartos }), data.liquidacionRepartos.length);
        }
        // 3. Verify counts
        const counts = {
            users: await prisma.user.count(),
            obras: await prisma.obra.count(),
            funciones: await prisma.funcion.count(),
            liquidaciones: await prisma.liquidacion.count(),
        };
        log.push(`✓ Final counts: users=${counts.users}, obras=${counts.obras}, funciones=${counts.funciones}, liquidaciones=${counts.liquidaciones}`);
        if (errors.length > 0) {
            res.json({ message: 'Backup restored with errors', log, errors, counts });
        }
        else {
            res.json({ message: 'Backup restored successfully', log, counts });
        }
    }
    catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({
            error: 'Error al restaurar el backup',
            details: error.message || 'Error desconocido',
            log,
            errors
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
