import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import prisma from '../src/lib/prisma.js';

// Load env vars
dotenv.config();

const RENDER_URL = process.env.RENDER_URL || 'https://hth-backend-bkdz.onrender.com';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'hth_agent_242aca589544bb5c8167f758e91996651fbcce2034c70acd';

async function sync() {
    const errors: string[] = [];

    console.log('🔄 Iniciando sincronización de base de datos desde la nube...');
    console.log(`📡 URL del servidor producción: ${RENDER_URL}`);

    try {
        // 1. Trigger production backup
        console.log('📦 Generando backup en el servidor de producción...');
        const triggerRes = await fetch(`${RENDER_URL}/backup`, {
            method: 'POST',
            headers: {
                'x-agent-key': AGENT_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!triggerRes.ok) {
            const errText = await triggerRes.text();
            throw new Error(`Error al generar backup en prod (HTTP ${triggerRes.status}): ${errText}`);
        }

        const triggerData = await triggerRes.json() as { filename: string };
        const filename = triggerData.filename;
        console.log(`✅ Backup generado en producción: ${filename}`);

        // 2. Download the backup file
        console.log('⬇️  Descargando backup de producción...');
        const downloadRes = await fetch(`${RENDER_URL}/backup/download/${filename}`, {
            headers: {
                'x-agent-key': AGENT_API_KEY,
            },
        });

        if (!downloadRes.ok) {
            throw new Error(`Error al descargar backup de prod (HTTP ${downloadRes.status})`);
        }

        const backup = await downloadRes.json() as any;
        console.log('✅ Backup descargado y parseado correctamente.');

        // Guardar copia local en server/backups por las dudas
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const localPath = path.join(backupDir, filename);
        fs.writeFileSync(localPath, JSON.stringify(backup, null, 2));
        console.log(`💾 Copia del backup guardada localmente en: ${localPath}`);

        const { data } = backup;
        if (!data) {
            throw new Error('El archivo de backup no contiene la propiedad "data".');
        }

        // Helper: safely delete
        const safeDelete = async (tableName: string) => {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
                console.log(`   ✓ Tabla vaciada: ${tableName}`);
            } catch (e: any) {
                console.log(`   ⚠ Omitiendo vaciar ${tableName}: ${e.message?.substring(0, 100)}`);
            }
        };

        // Helper: insert
        const safeCreate = async (name: string, fn: () => Promise<any>, count: number) => {
            try {
                await fn();
                console.log(`   ✓ Registros insertados en ${name}: ${count}`);
                return true;
            } catch (e: any) {
                const msg = `   ✗ FALLÓ inserción en ${name} (${count} registros): ${e.message?.substring(0, 200)}`;
                console.error(msg);
                errors.push(msg);
                return false;
            }
        };

        // 3. PATCH SCHEMA — Create missing tables if they don't exist
        console.log('🛠️  Verificando parches de esquema...');
        const schemaStatements = [
            `CREATE TABLE IF NOT EXISTS "ObraDeduccion" (
                "id" TEXT NOT NULL, "obraId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                "porcentaje" DECIMAL(5,2), "monto" DECIMAL(15,2),
                "deduceAntesDeSala" BOOLEAN NOT NULL DEFAULT true,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ObraDeduccion_pkey" PRIMARY KEY ("id")
            )`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ObraDeduccion_obraId_fkey') THEN
                    ALTER TABLE "ObraDeduccion" ADD CONSTRAINT "ObraDeduccion_obraId_fkey"
                    FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$`,
            `CREATE TABLE IF NOT EXISTS "ArtistaPayout" (
                "id" TEXT NOT NULL, "obraId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                "porcentaje" DECIMAL(5,2) NOT NULL, "base" TEXT NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ArtistaPayout_pkey" PRIMARY KEY ("id")
            )`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArtistaPayout_obraId_fkey') THEN
                    ALTER TABLE "ArtistaPayout" ADD CONSTRAINT "ArtistaPayout_obraId_fkey"
                    FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$`,
            `CREATE TABLE IF NOT EXISTS "Invitado" (
                "id" TEXT NOT NULL, "funcionId" TEXT NOT NULL, "nombre" TEXT NOT NULL,
                "cantidad" INTEGER NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Invitado_pkey" PRIMARY KEY ("id")
            )`,
            `DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitado_funcionId_fkey') THEN
                    ALTER TABLE "Invitado" ADD CONSTRAINT "Invitado_funcionId_fkey"
                    FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$`
        ];
        for (const stmt of schemaStatements) {
            try {
                await prisma.$executeRawUnsafe(stmt);
            } catch (e: any) {
                console.log(`   ⚠ Parche esquema: ${e.message?.substring(0, 80)}`);
            }
        }
        console.log('✅ Verificación de esquema completada');

        // 4. CLEAR local database
        console.log('🗑️  Vaciando base de datos local...');
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
        await safeDelete('SimulacionReparto');
        await safeDelete('SimulacionDeduccion');
        await safeDelete('SimulacionGasto');
        await safeDelete('SimulacionCategoria');
        await safeDelete('SimulacionEscenario');
        await safeDelete('SimulacionLiquidacion');
        await safeDelete('User');

        // 5. INSERT in dependency order
        console.log('📥 Insertando datos en base de datos local...');
        
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
        if (data.mensajes?.length) {
            await safeCreate('mensajes', () => prisma.mensaje.createMany({ data: data.mensajes }), data.mensajes.length);
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
            const cleanLiquidaciones = data.liquidaciones.map((l: any) => {
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
        if (data.simulaciones?.length) {
            await safeCreate('simulaciones', () => prisma.simulacionLiquidacion.createMany({ data: data.simulaciones }), data.simulaciones.length);
        }
        if (data.escenarios?.length) {
            await safeCreate('escenarios', () => prisma.simulacionEscenario.createMany({ data: data.escenarios }), data.escenarios.length);
        }
        if (data.categorias?.length) {
            await safeCreate('categorias', () => prisma.simulacionCategoria.createMany({ data: data.categorias }), data.categorias.length);
        }
        if (data.simGastos?.length) {
            await safeCreate('simGastos', () => prisma.simulacionGasto.createMany({ data: data.simGastos }), data.simGastos.length);
        }
        if (data.simDeducciones?.length) {
            await safeCreate('simDeducciones', () => prisma.simulacionDeduccion.createMany({ data: data.simDeducciones }), data.simDeducciones.length);
        }
        if (data.simRepartos?.length) {
            await safeCreate('simRepartos', () => prisma.simulacionReparto.createMany({ data: data.simRepartos }), data.simRepartos.length);
        }
        if (data.documentos?.length) {
            await safeCreate('documentos', () => prisma.documento.createMany({ data: data.documentos }), data.documentos.length);
        }
        if (data.gastos?.length) {
            await safeCreate('gastos', () => prisma.gasto.createMany({ data: data.gastos }), data.gastos.length);
        }

        console.log('\n--- Resumen de Importación ---');
        const counts = {
            users: await prisma.user.count(),
            obras: await prisma.obra.count(),
            funciones: await prisma.funcion.count(),
            liquidaciones: await prisma.liquidacion.count(),
            ventas: await prisma.venta.count(),
            gastos: await prisma.gasto.count(),
        };
        console.log(`   Usuarios: ${counts.users}`);
        console.log(`   Obras: ${counts.obras}`);
        console.log(`   Funciones: ${counts.funciones}`);
        console.log(`   Liquidaciones: ${counts.liquidaciones}`);
        console.log(`   Ventas: ${counts.ventas}`);
        console.log(`   Gastos: ${counts.gastos}`);

        if (errors.length > 0) {
            console.error('\n⚠️ Sincronización completada con algunos errores:');
            errors.forEach(e => console.error(e));
        } else {
            console.log('\n🎉 ¡Sincronización completada con ÉXITO!');
        }

    } catch (error: any) {
        console.error('❌ Error fatal durante la sincronización:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
