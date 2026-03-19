import prisma from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
export const getLiquidacionByFuncion = async (req, res) => {
    const funcionId = req.params.funcionId;
    try {
        const liquidacion = await prisma.liquidacion.findUnique({
            where: { funcionId },
            include: {
                items: true,
                repartos: true
            }
        });
        // Sum associated gastos from the "gastos" table
        const gastos = await prisma.gasto.findMany({
            where: { funcionId }
        });
        const gastosCajaSum = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
        res.json({
            ...liquidacion,
            gastosCajaSum
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching liquidacion' });
    }
};
export const uploadBordereaux = async (req, res) => {
    const funcionId = req.params.funcionId;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    try {
        // Check if settlement exists
        const existing = await prisma.liquidacion.findUnique({
            where: { funcionId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Primero debes guardar la liquidación (aunque sea como borrador) antes de subir el bordereaux.' });
        }
        const liquidacion = await prisma.liquidacion.update({
            where: { funcionId },
            data: {
                bordereauxImage: `/uploads/bordereaux/${file.filename}`
            }
        });
        res.json(liquidacion);
    }
    catch (error) {
        console.error('Error uploading bordereaux:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
};
export const getLastExpensesByObra = async (req, res) => {
    const obraId = req.params.obraId;
    try {
        const lastLiquidacion = await prisma.liquidacion.findFirst({
            where: {
                funcion: {
                    obraId: obraId
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            include: {
                items: {
                    where: {
                        tipo: 'Gasto'
                    }
                }
            }
        });
        if (!lastLiquidacion) {
            return res.json([]);
        }
        const concepts = Array.from(new Set(lastLiquidacion.items.map(item => item.concepto)));
        res.json(concepts);
    }
    catch (error) {
        console.error('Error fetching last expenses by obra:', error);
        res.status(500).json({ error: 'Error fetching last expenses' });
    }
};
export const getLiquidacionSuggestions = async (req, res) => {
    const funcionId = req.params.funcionId;
    try {
        const currentFuncion = await prisma.funcion.findUnique({
            where: { id: funcionId },
            select: { obraId: true, salaNombre: true, fecha: true }
        });
        if (!currentFuncion) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }
        const lastLiquidacion = await prisma.liquidacion.findFirst({
            where: {
                funcion: {
                    obraId: currentFuncion.obraId,
                    salaNombre: currentFuncion.salaNombre,
                    fecha: {
                        lt: currentFuncion.fecha
                    }
                }
            },
            orderBy: {
                funcion: {
                    fecha: 'desc'
                }
            },
            include: {
                items: true
            }
        });
        if (!lastLiquidacion) {
            return res.json([]);
        }
        res.json(lastLiquidacion.items);
    }
    catch (error) {
        console.error('Error fetching liquidacion suggestions:', error);
        res.status(500).json({ error: 'Error fetching suggestions' });
    }
};
export const upsertLiquidacion = async (req, res) => {
    const funcionId = req.params.funcionId;
    const data = req.body;
    // Helper to ensure we send numbers or null to Prisma, avoiding empty strings
    const num = (val) => {
        if (val === undefined || val === null || val === '')
            return 0;
        if (typeof val === 'number')
            return Math.round(val * 100) / 100;
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const n = Number(clean);
        return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    };
    const nOrNull = (val) => {
        if (val === undefined || val === null || val === '')
            return null;
        if (typeof val === 'number')
            return Math.round(val * 100) / 100;
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const n = Number(clean);
        return isNaN(n) ? null : Math.round(n * 100) / 100;
    };
    try {
        // Use a transaction to ensure either everything is saved or nothing
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete existing items if we are updating
            await tx.liquidacionItem.deleteMany({
                where: { liquidacion: { funcionId } }
            });
            await tx.liquidacionReparto.deleteMany({
                where: { liquidacion: { funcionId } }
            });
            // 2. Upsert the Liquidacion
            const liquidacion = await tx.liquidacion.upsert({
                where: { funcionId },
                update: {
                    facturacionTotal: num(data.facturacionTotal),
                    costosVenta: num(data.costosVenta),
                    recaudacionBruta: num(data.recaudacionBruta),
                    recaudacionNeta: num(data.recaudacionNeta),
                    acuerdoPorcentaje: num(data.acuerdoPorcentaje),
                    acuerdoSobre: data.acuerdoSobre,
                    resultadoCompania: num(data.resultadoCompania),
                    impuestoTransferencias: num(data.impuestoTransferencias),
                    impuestoTransferenciaPorcentaje: num(data.impuestoTransferenciaPorcentaje),
                    resultadoFuncion: num(data.resultadoFuncion),
                    repartoArtistaPorcentaje: nOrNull(data.repartoArtistaPorcentaje),
                    repartoProduccionPorcentaje: nOrNull(data.repartoProduccionPorcentaje),
                    repartoArtistaMonto: nOrNull(data.repartoArtistaMonto),
                    repartoProduccionMonto: nOrNull(data.repartoProduccionMonto),
                    moneda: data.moneda,
                    tipoCambio: num(data.tipoCambio),
                    bordereauxImage: data.bordereauxImage,
                    confirmada: data.confirmada,
                    fechaConfirmacion: data.confirmada ? new Date() : null,
                    items: {
                        create: (data.items || []).map((item) => ({
                            tipo: item.tipo,
                            concepto: item.concepto,
                            porcentaje: nOrNull(item.porcentaje),
                            monto: num(item.monto),
                            deduceAntesDeSala: item.deduceAntesDeSala ?? true
                        }))
                    },
                    repartos: {
                        create: (data.repartos || []).map((r) => ({
                            nombreArtista: r.nombreArtista,
                            porcentaje: num(r.porcentaje),
                            base: r.base,
                            monto: num(r.monto),
                            retencionAAA: num(r.retencionAAA),
                            aplicaAAA: r.aplicaAAA ?? true
                        }))
                    }
                },
                create: {
                    funcionId,
                    facturacionTotal: num(data.facturacionTotal),
                    costosVenta: num(data.costosVenta),
                    recaudacionBruta: num(data.recaudacionBruta),
                    recaudacionNeta: num(data.recaudacionNeta),
                    acuerdoPorcentaje: num(data.acuerdoPorcentaje),
                    acuerdoSobre: data.acuerdoSobre,
                    resultadoCompania: num(data.resultadoCompania),
                    impuestoTransferencias: num(data.impuestoTransferencias),
                    impuestoTransferenciaPorcentaje: num(data.impuestoTransferenciaPorcentaje),
                    resultadoFuncion: num(data.resultadoFuncion),
                    repartoArtistaPorcentaje: nOrNull(data.repartoArtistaPorcentaje),
                    repartoProduccionPorcentaje: nOrNull(data.repartoProduccionPorcentaje),
                    repartoArtistaMonto: nOrNull(data.repartoArtistaMonto),
                    repartoProduccionMonto: nOrNull(data.repartoProduccionMonto),
                    moneda: data.moneda,
                    tipoCambio: num(data.tipoCambio),
                    bordereauxImage: data.bordereauxImage,
                    confirmada: data.confirmada,
                    fechaConfirmacion: data.confirmada ? new Date() : null,
                    items: {
                        create: (data.items || []).map((item) => ({
                            tipo: item.tipo,
                            concepto: item.concepto,
                            porcentaje: nOrNull(item.porcentaje),
                            monto: num(item.monto),
                            deduceAntesDeSala: item.deduceAntesDeSala ?? true
                        }))
                    },
                    repartos: {
                        create: (data.repartos || []).map((r) => ({
                            nombreArtista: r.nombreArtista,
                            porcentaje: num(r.porcentaje),
                            base: r.base,
                            monto: num(r.monto),
                            retencionAAA: num(r.retencionAAA),
                            aplicaAAA: r.aplicaAAA ?? true
                        }))
                    }
                },
                include: { items: true, repartos: true }
            });
            // 3. Update the associated Funcion with sales data
            await tx.funcion.update({
                where: { id: funcionId },
                data: {
                    vendidas: Math.round(num(data.vendidas)),
                    ultimaFacturacionBruta: num(data.facturacionTotal),
                    ultimaActualizacionVentas: new Date()
                }
            });
            return liquidacion;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error in upsertLiquidacion:', error);
        res.status(500).json({ error: `Error al guardar: ${error.message || error}` });
    }
};
export const uploadComprobantesFiles = async (req, res) => {
    const funcionId = req.params.funcionId;
    const files = req.files;
    const userId = req.user.id;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos' });
    }
    try {
        // Find existing liquidation or ensure it exists (we actually need it to link)
        // Check if liquidation exists for this function
        const liquidacion = await prisma.liquidacion.findUnique({
            where: { funcionId }
        });
        if (!liquidacion) {
            return res.status(404).json({ error: 'Primero debes guardar la liquidación (aunque sea como borrador) antes de subir comprobantes.' });
        }
        const documentos = await Promise.all(files.map(async (file) => {
            return prisma.documento.create({
                data: {
                    nombreDocumento: file.originalname,
                    tipoDocumento: 'Comprobante',
                    linkDrive: `/uploads/comprobantes/${file.filename}`, // Local storage path for now
                    driveFileId: 'local', // Placeholder
                    subidoPorId: userId,
                    liquidacionId: liquidacion.id
                }
            });
        }));
        res.json(documentos);
    }
    catch (error) {
        console.error('Error uploading comprobantes:', error);
        res.status(500).json({ error: 'Error al subir los comprobantes' });
    }
};
export const getComprobantes = async (req, res) => {
    const funcionId = req.params.funcionId;
    try {
        const liquidacion = await prisma.liquidacion.findUnique({
            where: { funcionId },
            include: {
                comprobantes: {
                    include: { subidoPor: { select: { nombre: true, apellido: true } } },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!liquidacion) {
            return res.json([]);
        }
        res.json(liquidacion.comprobantes);
    }
    catch (error) {
        console.error('Error fetching comprobantes:', error);
        res.status(500).json({ error: 'Error al obtener los comprobantes' });
    }
};
export const downloadComprobantesZip = async (req, res) => {
    const funcionId = req.params.funcionId;
    try {
        const liquidacion = await prisma.liquidacion.findUnique({
            where: { funcionId },
            include: {
                comprobantes: true
            }
        });
        if (!liquidacion || !liquidacion.comprobantes || liquidacion.comprobantes.length === 0) {
            return res.status(404).json({ error: 'No hay comprobantes para esta liquidación' });
        }
        const archive = archiver('zip', { zlib: { level: 9 } });
        const zipName = `Comprobantes_Liquidacion_${funcionId}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);
        archive.pipe(res);
        liquidacion.comprobantes.forEach((v) => {
            if (v.linkDrive.startsWith('/uploads/comprobantes/')) {
                const fileName = path.basename(v.linkDrive);
                const filePath = path.join(process.cwd(), 'uploads', 'comprobantes', fileName);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: v.nombreDocumento });
                }
            }
        });
        await archive.finalize();
    }
    catch (error) {
        console.error('Error downloading vouchers ZIP:', error);
        res.status(500).json({ error: 'Error al generar el archivo ZIP' });
    }
};
export const deleteComprobante = async (req, res) => {
    const { id } = req.params;
    try {
        const documento = await prisma.documento.findUnique({
            where: { id: id }
        });
        if (!documento) {
            return res.status(404).json({ error: 'Comprobante no encontrado' });
        }
        await prisma.documento.delete({
            where: { id: id }
        });
        if (documento.linkDrive.startsWith('/uploads/comprobantes/')) {
            const filePath = path.join(process.cwd(), documento.linkDrive);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting comprobante:', error);
        res.status(500).json({ error: 'Error al eliminar el comprobante' });
    }
};
export const downloadGrupalComprobantesZip = async (req, res) => {
    const { id: grupalId } = req.params;
    try {
        const liquidaciones = await prisma.liquidacion.findMany({
            where: { grupalId: grupalId },
            include: {
                comprobantes: true,
                funcion: true
            }
        });
        if (!liquidaciones || liquidaciones.length === 0) {
            return res.status(404).json({ error: 'No se encontraron liquidaciones para este grupo' });
        }
        const allComprobantes = liquidaciones.flatMap(l => l.comprobantes.map(c => ({ ...c, funcionFecha: l.funcion.fecha, obraNombre: 'Documento' })));
        if (allComprobantes.length === 0) {
            return res.status(404).json({ error: 'No hay comprobantes en ninguna de las liquidaciones del grupo' });
        }
        const archive = archiver('zip', { zlib: { level: 9 } });
        const zipName = `Comprobantes_Grupo_${grupalId}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);
        archive.pipe(res);
        allComprobantes.forEach((v, index) => {
            if (v.linkDrive.startsWith('/uploads/comprobantes/')) {
                const fileName = path.basename(v.linkDrive);
                const filePath = path.join(process.cwd(), 'uploads', 'comprobantes', fileName);
                if (fs.existsSync(filePath)) {
                    // Predix with function index or date to avoid name collisions
                    const prefix = v.funcionFecha ? `${new Date(v.funcionFecha).toISOString().split('T')[0]}_` : `${index}_`;
                    archive.file(filePath, { name: prefix + v.nombreDocumento });
                }
            }
        });
        await archive.finalize();
    }
    catch (error) {
        console.error('Error downloading group vouchers ZIP:', error);
        res.status(500).json({ error: 'Error al generar el archivo ZIP del grupo' });
    }
};
export const createLiquidacionGrupal = async (req, res) => {
    const { nombre, funcionIds } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const grupal = await tx.liquidacionGrupal.create({
                data: { nombre },
            });
            if (funcionIds && funcionIds.length > 0) {
                for (const funcionId of funcionIds) {
                    const funcion = await tx.funcion.findUnique({
                        where: { id: funcionId }
                    });
                    const brute = Number(funcion?.ultimaFacturacionBruta) || 0;
                    await tx.liquidacion.upsert({
                        where: { funcionId },
                        update: {
                            grupalId: grupal.id,
                            // If it's not confirmed and revenue/facturacion is 0, update it
                            facturacionTotal: {
                                set: brute
                            },
                            recaudacionBruta: {
                                set: brute
                            },
                        },
                        create: {
                            funcionId,
                            grupalId: grupal.id,
                            facturacionTotal: brute,
                            costosVenta: 0,
                            recaudacionBruta: brute,
                            recaudacionNeta: brute,
                            acuerdoPorcentaje: 0,
                            acuerdoSobre: 'Bruta',
                            resultadoCompania: 0,
                            impuestoTransferencias: 0,
                            resultadoFuncion: 0,
                        }
                    });
                    // We need a conditional update but Prisma upsert doesn't easily support "update IF condition".
                    // However, we can do a separate update if needed, but for simplicity let's just use the brute value 
                    // if it's currently 0 and unconfirmed.
                    // Actually, a better way is to fetch and then decide. We already fetch 'funcion'.
                    // Let's check existing liquidacion.
                    const existingLiq = await tx.liquidacion.findUnique({ where: { funcionId } });
                    if (existingLiq && !existingLiq.confirmada && Number(existingLiq.facturacionTotal) === 0) {
                        await tx.liquidacion.update({
                            where: { id: existingLiq.id },
                            data: {
                                facturacionTotal: brute,
                                recaudacionBruta: brute,
                                recaudacionNeta: brute,
                            }
                        });
                    }
                }
            }
            return grupal;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error creating group settlement:', error);
        res.status(500).json({ error: 'Error al crear la liquidación grupal' });
    }
};
export const listLiquidacionesGrupales = async (req, res) => {
    try {
        const grupales = await prisma.liquidacionGrupal.findMany({
            include: {
                liquidaciones: {
                    include: {
                        funcion: {
                            include: { obra: true }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(grupales);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching group settlements' });
    }
};
export const getLiquidacionGrupal = async (req, res) => {
    const { id } = req.params;
    try {
        const grupal = (await prisma.liquidacionGrupal.findUnique({
            where: { id: id },
            include: {
                liquidaciones: {
                    include: {
                        funcion: {
                            include: { obra: { include: { artistaPayouts: true } } }
                        },
                        items: true,
                        repartos: true,
                    }
                },
                items: true
            }
        }));
        if (!grupal)
            return res.status(404).json({ error: 'Group settlement not found' });
        // Fetch detailed expenses for each liquidation
        const liquidacionesWithGastos = await Promise.all(grupal.liquidaciones.map(async (l) => {
            const gastos = await prisma.gasto.findMany({
                where: { funcionId: l.funcion.id }
            });
            const gastosCajaSum = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
            return {
                ...l,
                gastosCajaSum,
                gastosCajaList: gastos // Return the full list
            };
        }));
        res.json({
            ...grupal,
            liquidaciones: liquidacionesWithGastos
        });
    }
    catch (error) {
        console.error('Error fetching group settlement:', error);
        res.status(500).json({ error: 'Error fetching group settlement' });
    }
};
export const deleteLiquidacionGrupal = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            // Unlink liquidations
            await tx.liquidacion.updateMany({
                where: { grupalId: id },
                data: { grupalId: null }
            });
            // Delete group
            await tx.liquidacionGrupal.delete({
                where: { id: id }
            });
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting group settlement' });
    }
};
export const addLiquidacionGrupalItem = async (req, res) => {
    const { id: grupalId } = req.params;
    const { tipo, concepto, monto, porcentaje } = req.body;
    try {
        const item = await prisma.liquidacionGrupalItem.create({
            data: {
                grupalId: grupalId,
                tipo,
                concepto,
                porcentaje: porcentaje !== undefined && porcentaje !== null ? Number(porcentaje) : null,
                monto: Number(monto)
            }
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Error adding group item' });
    }
};
export const upsertLiquidacionGrupal = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const num = (val) => {
        if (val === undefined || val === null || val === '')
            return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };
    const nOrNull = (val) => {
        if (val === undefined || val === null || val === '')
            return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
    };
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing group items if we are updating (optional, depending on how frontend works)
            // For simplicity, let's assume the frontend sends the whole list of items
            if (data.items) {
                await tx.liquidacionGrupalItem.deleteMany({
                    where: { grupalId: id }
                });
            }
            const grupal = await tx.liquidacionGrupal.update({
                where: { id: id },
                data: {
                    facturacionTotal: num(data.facturacionTotal),
                    costosVenta: num(data.costosVenta),
                    costosVentaPorcentaje: nOrNull(data.costosVentaPorcentaje),
                    recaudacionBruta: num(data.recaudacionBruta),
                    recaudacionNeta: num(data.recaudacionNeta),
                    acuerdoPorcentaje: num(data.acuerdoPorcentaje),
                    acuerdoSobre: data.acuerdoSobre,
                    impuestoTransferenciaPorcentaje: num(data.impuestoTransferenciaPorcentaje),
                    moneda: data.moneda,
                    tipoCambio: num(data.tipoCambio),
                    confirmada: data.confirmada,
                    items: data.items ? {
                        create: data.items.map((item) => ({
                            tipo: item.tipo,
                            concepto: item.concepto,
                            porcentaje: nOrNull(item.porcentaje),
                            monto: num(item.monto),
                            deduceAntesDeSala: item.deduceAntesDeSala ?? true
                        }))
                    } : undefined
                },
                include: { items: true }
            });
            return grupal;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error in upsertLiquidacionGrupal:', error);
        res.status(500).json({ error: 'Error saving group settlement' });
    }
};
export const deleteLiquidacionGrupalItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        await prisma.liquidacionGrupalItem.delete({
            where: { id: itemId }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting group item' });
    }
};
