import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { execSync } from 'child_process';

// ─────────────────────────────────────────────────────────────
// MAINTENANCE
// ─────────────────────────────────────────────────────────────

export const runMigration = async (req: AuthRequest, res: Response) => {
    try {
        const output = execSync('npx prisma migrate deploy', {
            cwd: process.cwd(),
            timeout: 60000,
            encoding: 'utf8',
            env: { ...process.env }
        });
        res.json({ success: true, output });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message, stderr: error.stderr });
    }
};



export const getAgentBoard = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [funcionesCount, liquidacionesPendientes, mensajes] = await Promise.all([
            prisma.funcion.count({ where: { fecha: { gte: startOfMonth, lte: endOfMonth } } }),
            prisma.funcion.count({
                where: {
                    fecha: { lt: now },
                    OR: [
                        { liquidacion: null },
                        { liquidacion: { confirmada: false } }
                    ]
                }
            }),
            prisma.mensaje.findMany({
                where: { isArchived: false, parentId: null },
                include: { autor: { select: { nombre: true, apellido: true } } },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);

        res.json({
            status: 'online',
            monthStats: { funciones: funcionesCount },
            pendingSettlements: liquidacionesPendientes,
            recentMessages: mensajes.map(m => ({
                id: m.id,
                author: `${m.autor.nombre} ${m.autor.apellido}`,
                content: m.contenido,
                date: m.created_at
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching agent board' });
    }
};

export const getReferenceData = async (req: Request, res: Response) => {
    try {
        const obras = await prisma.obra.findMany({
            select: { id: true, nombre: true, artistaPrincipal: true, estado: true }
        });
        res.json({ obras });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reference data' });
    }
};

// ─────────────────────────────────────────────────────────────
// FUNCIONES
// ─────────────────────────────────────────────────────────────

export const getAgentFunciones = async (req: AuthRequest, res: Response) => {
    try {
        const funciones = await prisma.funcion.findMany({
            include: {
                obra: { select: { id: true, nombre: true, artistaPrincipal: true } },
                liquidacion: { select: { recaudacionBruta: true, resultadoFuncion: true, confirmada: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        const formattedFunciones = funciones.map((f: any) => ({
            id: f.id,
            obraId: f.obraId,
            obra: f.obra?.nombre ?? 'Sin obra',
            artistaPrincipal: f.obra?.artistaPrincipal ?? '',
            fecha: f.fecha,
            salaNombre: f.salaNombre,
            ciudad: f.ciudad,
            pais: f.pais,
            confirmada: f.confirmada,
            capacidadTotal: f.capacidadSala ?? 0,
            precioEntradaBase: f.precioEntradaBase ? Number(f.precioEntradaBase) : null,
            entradasVendidas: f.vendidas ?? 0,
            porcentajeOcupacion: f.capacidadSala && f.capacidadSala > 0
                ? Math.round(((f.vendidas ?? 0) / f.capacidadSala) * 100)
                : null,
            ingresoBruto: f.liquidacion?.recaudacionBruta ? Number(f.liquidacion.recaudacionBruta) : null,
            resultadoFuncion: f.liquidacion?.resultadoFuncion ? Number(f.liquidacion.resultadoFuncion) : null,
            liquidacionConfirmada: f.liquidacion?.confirmada ?? false,
        }));

        res.json({ count: formattedFunciones.length, funciones: formattedFunciones });
    } catch (error) {
        console.error('Agent get funciones error:', error);
        res.status(500).json({ error: 'Error fetching funciones via agent' });
    }
};

export const getAgentFuncionDetail = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing funcion ID' });

    try {
        const funcion = await prisma.funcion.findUnique({
            where: { id: id as string },
            include: {
                obra: {
                    include: {
                        artistaPayouts: true,
                        deducciones: true
                    }
                },
                ventas: { orderBy: { fechaRegistro: 'asc' } },
                gastos: true,
                liquidacion: {
                    include: {
                        items: true,
                        repartos: true
                    }
                }
            }
        });

        if (!funcion) return res.status(404).json({ error: 'Funcion not found' });

        res.json(funcion);
    } catch (error) {
        console.error('Agent get funcion detail error:', error);
        res.status(500).json({ error: 'Error fetching funcion detail via agent' });
    }
};

export const createAgentFuncion = async (req: AuthRequest, res: Response) => {
    const { obraId, fecha, precioBase, salaNombre, ciudad, capacidadSala } = req.body;
    if (!obraId || !fecha || !salaNombre || !ciudad) {
        return res.status(400).json({ error: 'Missing required fields: obraId, fecha, salaNombre, ciudad' });
    }

    try {
        const obra = await prisma.obra.findUnique({ where: { id: obraId } });
        if (!obra) return res.status(404).json({ error: 'Obra not found' });

        const nuevaFuncion = await prisma.funcion.create({
            data: {
                obraId,
                fecha: new Date(fecha),
                precioEntradaBase: precioBase || 0,
                capacidadSala: capacidadSala || 0,
                salaNombre,
                ciudad,
            }
        });

        try {
            if (nuevaFuncion.confirmada !== false) {
                const dateStr = nuevaFuncion.fecha.toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit',
                    timeZone: 'America/Argentina/Buenos_Aires'
                });
                await prisma.mensaje.create({
                    data: {
                        contenido: `🤖 **Agente OpenClaw** programó una nueva función:\n**${obra.nombre}** en ${nuevaFuncion.salaNombre} (${nuevaFuncion.ciudad}) para el día **${dateStr}**.`,
                        autorId: req.user!.id,
                    }
                });
            }
        } catch (e) { console.warn('Auto-billboard failed:', e); }

        res.status(201).json(nuevaFuncion);
    } catch (error) {
        console.error('Agent create funcion error:', error);
        res.status(500).json({ error: 'Error creating funcion via agent' });
    }
};

export const updateAgentFuncion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { obraId, fecha, precioBase, salaNombre, ciudad, capacidadSala } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing funcion ID' });

    try {
        const updateData: any = {};
        if (obraId) updateData.obraId = obraId;
        if (fecha) updateData.fecha = new Date(fecha);
        if (precioBase !== undefined) updateData.precioEntradaBase = precioBase;
        if (salaNombre) updateData.salaNombre = salaNombre;
        if (ciudad) updateData.ciudad = ciudad;
        if (capacidadSala !== undefined) updateData.capacidadSala = capacidadSala;

        const updatedFuncion = await prisma.funcion.update({
            where: { id: id as string },
            data: updateData,
            include: { obra: { select: { nombre: true } } }
        }) as any;

        try {
            const dateStr = updatedFuncion.fecha.toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires'
            });
            await prisma.mensaje.create({
                data: {
                    contenido: `🤖 **Agente OpenClaw** actualizó la función:\n**${updatedFuncion.obra.nombre}** en ${updatedFuncion.salaNombre} (${updatedFuncion.ciudad}) para el día **${dateStr}**.`,
                    autorId: req.user!.id,
                }
            });
        } catch (e) { console.warn('Auto-billboard failed:', e); }

        res.json(updatedFuncion);
    } catch (error) {
        console.error('Agent update funcion error:', error);
        res.status(500).json({ error: 'Error updating funcion via agent' });
    }
};

// ─────────────────────────────────────────────────────────────
// OBRAS
// ─────────────────────────────────────────────────────────────

export const getAgentObraDetalle = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing obra ID' });

    try {
        const obra = await prisma.obra.findUnique({
            where: { id: id as string },
            include: {
                artistaPayouts: true,
                deducciones: true,
                funciones: {
                    select: {
                        id: true, fecha: true, salaNombre: true, ciudad: true,
                        confirmada: true, vendidas: true, capacidadSala: true,
                        liquidacion: { select: { confirmada: true, recaudacionBruta: true, resultadoFuncion: true } }
                    },
                    orderBy: { fecha: 'desc' }
                }
            }
        });

        if (!obra) return res.status(404).json({ error: 'Obra not found' });
        res.json(obra);
    } catch (error) {
        console.error('Agent get obra detalle error:', error);
        res.status(500).json({ error: 'Error fetching obra detail' });
    }
};

export const getAgentObraEvolucionVentas = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing obra ID' });

    try {
        const funciones = await prisma.funcion.findMany({
            where: { obraId: id as string, confirmada: true },
            include: {
                ventas: { orderBy: { fechaRegistro: 'asc' } },
                liquidacion: {
                    select: { confirmada: true, recaudacionBruta: true, resultadoFuncion: true }
                }
            },
            orderBy: { fecha: 'desc' }
        });

        const resultado = funciones.map(f => ({
            funcionId: f.id,
            fecha: f.fecha,
            salaNombre: f.salaNombre,
            ciudad: f.ciudad,
            pais: f.pais,
            capacidadSala: f.capacidadSala,
            precioEntradaBase: f.precioEntradaBase ? Number(f.precioEntradaBase) : null,
            entradasVendidasFinal: f.vendidas,
            porcentajeOcupacionFinal: f.capacidadSala && f.capacidadSala > 0
                ? Math.round((f.vendidas / f.capacidadSala) * 100)
                : null,
            recaudacionBrutaFinal: f.liquidacion?.recaudacionBruta ? Number(f.liquidacion.recaudacionBruta) : null,
            resultadoFuncion: f.liquidacion?.resultadoFuncion ? Number(f.liquidacion.resultadoFuncion) : null,
            liquidacionConfirmada: f.liquidacion?.confirmada ?? false,
            // Evolución de ventas (cada registro con días de antelación)
            evolucionVentas: f.ventas.map(v => ({
                fecha: v.fechaRegistro,
                diasAntelacion: Math.max(0, Math.round((new Date(f.fecha).getTime() - new Date(v.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))),
                entradasVendidas: v.entradasVendidas,
                facturacionBruta: v.facturacionBruta ? Number(v.facturacionBruta) : null,
                canal: v.canalVenta,
            }))
        }));

        res.json({ obraId: id, count: resultado.length, funciones: resultado });
    } catch (error) {
        console.error('Agent evolucion ventas error:', error);
        res.status(500).json({ error: 'Error fetching evolucion ventas' });
    }
};

export const getAgentGastosByObra = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing obra ID' });

    try {
        const gastos = await prisma.gasto.findMany({
            where: { obraId: id as string },
            include: {
                funcion: { select: { id: true, fecha: true, salaNombre: true, ciudad: true } }
            },
            orderBy: { fechaGasto: 'desc' }
        });

        // Group by tipoGasto for analytics
        const porTipo = gastos.reduce((acc: Record<string, number>, g) => {
            acc[g.tipoGasto] = (acc[g.tipoGasto] || 0) + Number(g.monto);
            return acc;
        }, {});

        res.json({
            obraId: id,
            totalGastos: gastos.reduce((acc, g) => acc + Number(g.monto), 0),
            porTipo,
            gastos: gastos.map(g => ({
                id: g.id,
                descripcion: g.descripcion,
                monto: Number(g.monto),
                tipoGasto: g.tipoGasto,
                fechaGasto: g.fechaGasto,
                funcion: g.funcion ? {
                    id: g.funcion.id,
                    fecha: g.funcion.fecha,
                    sala: g.funcion.salaNombre,
                    ciudad: g.funcion.ciudad,
                } : null
            }))
        });
    } catch (error) {
        console.error('Agent gastos obra error:', error);
        res.status(500).json({ error: 'Error fetching gastos by obra' });
    }
};

// ─────────────────────────────────────────────────────────────
// PROYECCIÓN CONSOLIDADA
// ─────────────────────────────────────────────────────────────

export const getAgentProjectionInput = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing funcion ID' });

    try {
        // 1. Función actual con datos completos
        const funcion = await prisma.funcion.findUnique({
            where: { id: id as string },
            include: {
                obra: {
                    include: { artistaPayouts: true, deducciones: true }
                },
                ventas: { orderBy: { fechaRegistro: 'asc' } },
                gastos: true,
                liquidacion: { include: { items: true, repartos: true } }
            }
        });

        if (!funcion) return res.status(404).json({ error: 'Funcion not found' });

        // 2. Funciones históricas de la misma obra (excluyendo la actual)
        const historialObra = await prisma.funcion.findMany({
            where: {
                obraId: funcion.obraId,
                confirmada: true,
                NOT: { id: id as string }
            },
            include: {
                ventas: { orderBy: { fechaRegistro: 'asc' } },
                gastos: true,
                liquidacion: {
                    include: { items: true, repartos: true }
                }
            },
            orderBy: { fecha: 'desc' },
            take: 20 // Máximo 20 comparables
        });

        // 3. Funciones comparables (misma sala o misma ciudad, de la misma obra)
        const comparablesSalaCiudad = historialObra
            .filter(f =>
                (f.salaNombre && f.salaNombre === funcion.salaNombre) ||
                (f.ciudad && f.ciudad === funcion.ciudad)
            )
            .map(f => f.id);

        // 4. Gastos promedio históricos por tipo (solo funciones confirmadas con liquidación)
        const gastosHistorial = historialObra.flatMap(f => f.gastos);
        const gastosPorTipoPromedio = gastosHistorial.reduce((acc: Record<string, {total: number, count: number}>, g) => {
            if (!acc[g.tipoGasto]) acc[g.tipoGasto] = { total: 0, count: 0 };
            acc[g.tipoGasto].total += Number(g.monto);
            acc[g.tipoGasto].count += 1;
            return acc;
        }, {});

        const gastoPromedioHistorico = Object.entries(gastosPorTipoPromedio).map(([tipo, data]) => ({
            tipoGasto: tipo,
            promedioMonto: Math.round(data.total / data.count),
            n: data.count
        }));

        // 5. Respuesta consolidada
        res.json({
            // La función objetivo
            funcion: {
                id: funcion.id,
                fecha: funcion.fecha,
                salaNombre: funcion.salaNombre,
                ciudad: funcion.ciudad,
                pais: funcion.pais,
                capacidadSala: funcion.capacidadSala,
                precioEntradaBase: funcion.precioEntradaBase ? Number(funcion.precioEntradaBase) : null,
                entradasVendidas: funcion.vendidas,
                confirmada: funcion.confirmada,
                liquidacion: funcion.liquidacion,
                ventasRegistradas: funcion.ventas.map(v => ({
                    fecha: v.fechaRegistro,
                    diasAntelacion: Math.max(0, Math.round(
                        (new Date(funcion.fecha).getTime() - new Date(v.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24)
                    )),
                    entradas: v.entradasVendidas,
                    bruto: v.facturacionBruta ? Number(v.facturacionBruta) : null,
                    canal: v.canalVenta,
                })),
                gastos: funcion.gastos.map(g => ({
                    descripcion: g.descripcion,
                    monto: Number(g.monto),
                    tipo: g.tipoGasto,
                }))
            },
            // Configuración económica de la obra
            obra: {
                id: funcion.obra.id,
                nombre: funcion.obra.nombre,
                artistaPrincipal: funcion.obra.artistaPrincipal,
                artistaPayouts: funcion.obra.artistaPayouts.map((p: any) => ({
                    nombre: p.nombre,
                    porcentaje: Number(p.porcentaje),
                    base: p.base
                })),
                deducciones: funcion.obra.deducciones.map((d: any) => ({
                    nombre: d.nombre,
                    porcentaje: d.porcentaje ? Number(d.porcentaje) : null,
                    monto: d.monto ? Number(d.monto) : null,
                    deduceAntesDeSala: d.deduceAntesDeSala
                }))
            },
            // Comparables históricos
            comparables: {
                totalFuncionesHistoricas: historialObra.length,
                idsFuncionesMismaSalaOCiudad: comparablesSalaCiudad,
                gastoPromedioHistoricoPorTipo: gastoPromedioHistorico,
                funciones: historialObra.map(f => ({
                    id: f.id,
                    fecha: f.fecha,
                    salaNombre: f.salaNombre,
                    ciudad: f.ciudad,
                    capacidadSala: f.capacidadSala,
                    precioEntradaBase: f.precioEntradaBase ? Number(f.precioEntradaBase) : null,
                    entradasVendidasFinal: f.vendidas,
                    porcentajeOcupacionFinal: f.capacidadSala && f.capacidadSala > 0
                        ? Math.round((f.vendidas / f.capacidadSala) * 100) : null,
                    recaudacionBrutaFinal: f.liquidacion?.recaudacionBruta ? Number(f.liquidacion.recaudacionBruta) : null,
                    resultadoFuncion: f.liquidacion?.resultadoFuncion ? Number(f.liquidacion.resultadoFuncion) : null,
                    liquidacionConfirmada: f.liquidacion?.confirmada ?? false,
                    totalGastos: f.gastos.reduce((acc, g) => acc + Number(g.monto), 0),
                    evolucionVentas: f.ventas.map(v => ({
                        fecha: v.fechaRegistro,
                        diasAntelacion: Math.max(0, Math.round(
                            (new Date(f.fecha).getTime() - new Date(v.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24)
                        )),
                        entradas: v.entradasVendidas,
                        bruto: v.facturacionBruta ? Number(v.facturacionBruta) : null,
                    }))
                }))
            }
        });
    } catch (error) {
        console.error('Agent projection input error:', error);
        res.status(500).json({ error: 'Error fetching projection input' });
    }
};

// ─────────────────────────────────────────────────────────────
// LIQUIDACIONES
// ─────────────────────────────────────────────────────────────

export const getAgentLiquidacion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing funcion ID' });

    try {
        const [funcion, liquidacion, gastos] = await Promise.all([
            prisma.funcion.findUnique({
                where: { id: id as string },
                include: {
                    obra: {
                        include: { artistaPayouts: true, deducciones: true }
                    }
                }
            }),
            prisma.liquidacion.findUnique({
                where: { funcionId: id as string },
                include: { items: true, repartos: true }
            }),
            prisma.gasto.findMany({ where: { funcionId: id as string } })
        ]);

        if (!funcion) return res.status(404).json({ error: 'Funcion not found' });

        const gastosCajaSum = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

        // Fetch suggestions from the last similar liquidacion (same obra + same sala)
        const lastSimilar = await prisma.liquidacion.findFirst({
            where: {
                funcion: {
                    obraId: funcion.obraId,
                    salaNombre: funcion.salaNombre,
                    fecha: { lt: funcion.fecha }
                }
            },
            orderBy: { funcion: { fecha: 'desc' } },
            include: { items: true, repartos: true }
        });

        res.json({
            funcion: {
                id: funcion.id,
                fecha: funcion.fecha,
                salaNombre: funcion.salaNombre,
                ciudad: funcion.ciudad,
                pais: funcion.pais,
                capacidadSala: funcion.capacidadSala,
                precioEntradaBase: funcion.precioEntradaBase ? Number(funcion.precioEntradaBase) : null,
                entradasVendidas: funcion.vendidas,
                ultimaFacturacionBruta: funcion.ultimaFacturacionBruta ? Number(funcion.ultimaFacturacionBruta) : null,
            },
            obra: {
                id: funcion.obra.id,
                nombre: funcion.obra.nombre,
                artistaPrincipal: funcion.obra.artistaPrincipal,
                artistaPayouts: funcion.obra.artistaPayouts.map((p: any) => ({
                    nombre: p.nombre,
                    porcentaje: Number(p.porcentaje),
                    base: p.base
                })),
                deducciones: funcion.obra.deducciones.map((d: any) => ({
                    nombre: d.nombre,
                    porcentaje: d.porcentaje ? Number(d.porcentaje) : null,
                    monto: d.monto ? Number(d.monto) : null,
                    deduceAntesDeSala: d.deduceAntesDeSala
                }))
            },
            liquidacion: liquidacion ? {
                ...liquidacion,
                gastosCajaSum
            } : null,
            gastosCaja: gastos.map(g => ({
                descripcion: g.descripcion,
                monto: Number(g.monto),
                tipo: g.tipoGasto
            })),
            sugerencias: lastSimilar ? {
                liquidacionId: lastSimilar.id,
                acuerdoPorcentaje: lastSimilar.acuerdoPorcentaje ? Number(lastSimilar.acuerdoPorcentaje) : null,
                acuerdoSobre: lastSimilar.acuerdoSobre,
                impuestoTransferenciaPorcentaje: lastSimilar.impuestoTransferenciaPorcentaje ? Number(lastSimilar.impuestoTransferenciaPorcentaje) : null,
                moneda: lastSimilar.moneda,
                tipoCambio: lastSimilar.tipoCambio ? Number(lastSimilar.tipoCambio) : null,
                repartoArtistaPorcentaje: lastSimilar.repartoArtistaPorcentaje ? Number(lastSimilar.repartoArtistaPorcentaje) : null,
                repartoProduccionPorcentaje: lastSimilar.repartoProduccionPorcentaje ? Number(lastSimilar.repartoProduccionPorcentaje) : null,
                itemsGastos: lastSimilar.items.filter((it: any) => it.tipo === 'Gasto').map((it: any) => ({
                    concepto: it.concepto,
                    porcentaje: it.porcentaje ? Number(it.porcentaje) : null,
                    monto: Number(it.monto),
                    deduceAntesDeSala: it.deduceAntesDeSala
                }))
            } : null
        });
    } catch (error) {
        console.error('Agent get liquidacion error:', error);
        res.status(500).json({ error: 'Error fetching liquidacion via agent' });
    }
};

export const saveAgentLiquidacion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const funcionId = id as string;
    if (!funcionId) return res.status(400).json({ error: 'Missing funcion ID' });

    const data = req.body;

    const num = (val: any) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return Math.round(val * 100) / 100;
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const n = Number(clean);
        return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    };

    const nOrNull = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return Math.round(val * 100) / 100;
        const clean = String(val).replace(/\./g, '').replace(',', '.');
        const n = Number(clean);
        return isNaN(n) ? null : Math.round(n * 100) / 100;
    };

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing items before upserting
            await tx.liquidacionItem.deleteMany({ where: { liquidacion: { funcionId } } });
            await tx.liquidacionReparto.deleteMany({ where: { liquidacion: { funcionId } } });

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
                    confirmada: data.confirmada ?? false,
                    fechaConfirmacion: data.confirmada ? new Date() : null,
                    items: {
                        create: (data.items || []).map((item: any) => ({
                            tipo: item.tipo,
                            concepto: item.concepto,
                            porcentaje: nOrNull(item.porcentaje),
                            monto: num(item.monto),
                            deduceAntesDeSala: item.deduceAntesDeSala ?? true
                        }))
                    },
                    repartos: {
                        create: (data.repartos || []).map((r: any) => ({
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
                    confirmada: data.confirmada ?? false,
                    fechaConfirmacion: data.confirmada ? new Date() : null,
                    items: {
                        create: (data.items || []).map((item: any) => ({
                            tipo: item.tipo,
                            concepto: item.concepto,
                            porcentaje: nOrNull(item.porcentaje),
                            monto: num(item.monto),
                            deduceAntesDeSala: item.deduceAntesDeSala ?? true
                        }))
                    },
                    repartos: {
                        create: (data.repartos || []).map((r: any) => ({
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

            // Update the Funcion with final sales count
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

        // Post a message to the billboard if the liquidation is confirmed
        if (data.confirmada) {
            try {
                const funcion = await prisma.funcion.findUnique({
                    where: { id: funcionId },
                    include: { obra: { select: { nombre: true } } }
                }) as any;
                if (funcion) {
                    const dateStr = funcion.fecha.toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit',
                        timeZone: 'America/Argentina/Buenos_Aires'
                    });
                    await prisma.mensaje.create({
                        data: {
                            contenido: `🤖 **Agente OpenClaw** confirmó la liquidación:\n**${funcion.obra.nombre}** – ${funcion.salaNombre} (${funcion.ciudad}) ${dateStr}. Resultado: $${Number(result.resultadoFuncion).toLocaleString('es-AR')}.`,
                            autorId: req.user!.id,
                        }
                    });
                }
            } catch (e) { console.warn('Auto-billboard on liquidacion confirm failed:', e); }
        }

        res.json(result);
    } catch (error: any) {
        console.error('Agent save liquidacion error:', error);
        res.status(500).json({ error: `Error al guardar liquidación: ${error.message || error}` });
    }
};
