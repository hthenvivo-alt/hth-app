import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

const SIMULACION_INCLUDE = {
    obra: {
        include: { artistaPayouts: true, deducciones: true }
    },
    createdBy: { select: { id: true, nombre: true, apellido: true } },
    escenarios: {
        include: {
            categorias: true,
            gastos: true,
            deducciones: true,
            repartos: true
        },
        orderBy: { created_at: 'asc' as const }
    }
};

// GET /simulacion — lista de simulaciones
export const listSimulaciones = async (req: AuthRequest, res: Response) => {
    try {
        const sims = await prisma.simulacionLiquidacion.findMany({
            include: {
                obra: { select: { id: true, nombre: true } },
                createdBy: { select: { nombre: true, apellido: true } },
                escenarios: { select: { id: true } }
            },
            orderBy: { updated_at: 'desc' }
        });
        res.json(sims);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// GET /simulacion/:id — detalle con todos los escenarios
export const getSimulacion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const sim = await prisma.simulacionLiquidacion.findUnique({
            where: { id },
            include: SIMULACION_INCLUDE
        });
        if (!sim) return res.status(404).json({ error: 'Simulación no encontrada' });
        res.json(sim);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// POST /simulacion — crear simulación con un primer escenario
export const createSimulacion = async (req: AuthRequest, res: Response) => {
    const { nombre, obraId, moneda = 'ARS', notas } = req.body;
    const userId = req.user!.id;

    if (!nombre || !obraId) {
        return res.status(400).json({ error: 'nombre y obraId son requeridos' });
    }

    try {
        // Obtener deducciones y repartos de la obra para pre-cargarlos
        const obra = await prisma.obra.findUnique({
            where: { id: obraId },
            include: { artistaPayouts: true, deducciones: true }
        });
        if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

        const sim = await prisma.simulacionLiquidacion.create({
            data: {
                nombre,
                obraId,
                moneda,
                notas,
                createdById: userId,
                escenarios: {
                    create: [{
                        nombre: 'Moderado',
                        ocupacionPorcentaje: 75,
                        acuerdoPorcentaje: 0,
                        acuerdoSobre: 'Neta',
                        impuestoTransferenciaPorcentaje: moneda === 'ARS' ? 1.2 : 0,
                        categorias: {
                            create: [{ nombre: 'General', precio: 0, aforo: 0 }]
                        },
                        deducciones: {
                            create: obra.deducciones.map(d => ({
                                concepto: d.nombre,
                                porcentaje: d.porcentaje ? Number(d.porcentaje) : null,
                                monto: d.monto ? Number(d.monto) : null,
                                deduceAntesDeSala: d.deduceAntesDeSala
                            }))
                        },
                        repartos: {
                            create: obra.artistaPayouts.map(p => ({
                                nombreArtista: p.nombre,
                                porcentaje: Number(p.porcentaje),
                                base: p.base,
                                aplicaAAA: true
                            }))
                        },
                        gastos: { create: [] }
                    }]
                }
            },
            include: SIMULACION_INCLUDE
        });

        res.status(201).json(sim);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// PUT /simulacion/:id — actualizar nombre/notas/moneda
export const updateSimulacion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { nombre, notas, moneda } = req.body;
    try {
        const sim = await prisma.simulacionLiquidacion.update({
            where: { id },
            data: { nombre, notas, moneda },
            include: SIMULACION_INCLUDE
        });
        res.json(sim);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// DELETE /simulacion/:id
export const deleteSimulacion = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.simulacionLiquidacion.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// POST /simulacion/:id/escenario — agregar escenario nuevo (clonar el primero como base)
export const addEscenario = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { nombre = 'Nuevo Escenario', clonarDeId } = req.body;
    try {
        let baseData: any = {
            ocupacionPorcentaje: 100,
            costoTarjetaPorcentaje: 0,
            acuerdoPorcentaje: 0,
            acuerdoSobre: 'Neta',
            impuestoTransferenciaPorcentaje: 1.2,
            categorias: { create: [{ nombre: 'General', precio: 0, aforo: 0 }] },
            deducciones: { create: [] },
            gastos: { create: [] },
            repartos: { create: [] }
        };

        if (clonarDeId) {
            const source = await prisma.simulacionEscenario.findUnique({
                where: { id: clonarDeId },
                include: { categorias: true, deducciones: true, gastos: true, repartos: true }
            });
            if (source) {
                baseData = {
                    ocupacionPorcentaje: source.ocupacionPorcentaje,
                    costoTarjetaPorcentaje: source.costoTarjetaPorcentaje,
                    acuerdoPorcentaje: source.acuerdoPorcentaje,
                    acuerdoSobre: source.acuerdoSobre,
                    impuestoTransferenciaPorcentaje: source.impuestoTransferenciaPorcentaje,
                    categorias: {
                        create: source.categorias.map(c => ({ nombre: c.nombre, precio: Number(c.precio), aforo: c.aforo }))
                    },
                    deducciones: {
                        create: source.deducciones.map(d => ({
                            concepto: d.concepto,
                            porcentaje: d.porcentaje ? Number(d.porcentaje) : null,
                            monto: d.monto ? Number(d.monto) : null,
                            deduceAntesDeSala: d.deduceAntesDeSala
                        }))
                    },
                    gastos: {
                        create: source.gastos.map(g => ({ concepto: g.concepto, monto: Number(g.monto) }))
                    },
                    repartos: {
                        create: source.repartos.map(r => ({
                            nombreArtista: r.nombreArtista,
                            porcentaje: Number(r.porcentaje),
                            base: r.base,
                            aplicaAAA: r.aplicaAAA
                        }))
                    }
                };
            }
        }

        const escenario = await prisma.simulacionEscenario.create({
            data: { simulacionId: id, nombre, ...baseData },
            include: { categorias: true, deducciones: true, gastos: true, repartos: true }
        });
        res.status(201).json(escenario);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// PUT /simulacion/escenario/:escenarioId — guardar escenario completo (replace all children)
export const upsertEscenario = async (req: AuthRequest, res: Response) => {
    const { escenarioId } = req.params;
    const {
        nombre,
        ocupacionPorcentaje,
        costoTarjetaPorcentaje,
        acuerdoPorcentaje,
        acuerdoSobre,
        impuestoTransferenciaPorcentaje,
        categorias = [],
        gastos = [],
        deducciones = [],
        repartos = []
    } = req.body;

    try {
        // Delete all children first, then recreate
        await prisma.$transaction([
            prisma.simulacionCategoria.deleteMany({ where: { escenarioId } }),
            prisma.simulacionGasto.deleteMany({ where: { escenarioId } }),
            prisma.simulacionDeduccion.deleteMany({ where: { escenarioId } }),
            prisma.simulacionReparto.deleteMany({ where: { escenarioId } }),
        ]);

        const updated = await prisma.simulacionEscenario.update({
            where: { id: escenarioId },
            data: {
                nombre,
                ocupacionPorcentaje,
                costoTarjetaPorcentaje,
                acuerdoPorcentaje,
                acuerdoSobre,
                impuestoTransferenciaPorcentaje,
                updated_at: new Date(),
                categorias: {
                    create: categorias.map((c: any) => ({
                        nombre: c.nombre,
                        precio: Number(c.precio) || 0,
                        aforo: Number(c.aforo) || 0
                    }))
                },
                gastos: {
                    create: gastos.map((g: any) => ({
                        concepto: g.concepto,
                        monto: Number(g.monto) || 0
                    }))
                },
                deducciones: {
                    create: deducciones.map((d: any) => ({
                        concepto: d.concepto,
                        porcentaje: d.porcentaje !== '' && d.porcentaje != null ? Number(d.porcentaje) : null,
                        monto: d.monto !== '' && d.monto != null ? Number(d.monto) : null,
                        deduceAntesDeSala: d.deduceAntesDeSala ?? true
                    }))
                },
                repartos: {
                    create: repartos.map((r: any) => ({
                        nombreArtista: r.nombreArtista,
                        porcentaje: Number(r.porcentaje) || 0,
                        base: r.base || 'Utilidad',
                        aplicaAAA: r.aplicaAAA ?? true
                    }))
                }
            },
            include: { categorias: true, gastos: true, deducciones: true, repartos: true }
        });

        // Update simulacion updated_at
        await prisma.simulacionLiquidacion.update({
            where: { id: updated.simulacionId },
            data: { updated_at: new Date() }
        });

        res.json(updated);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// DELETE /simulacion/escenario/:escenarioId
export const deleteEscenario = async (req: AuthRequest, res: Response) => {
    const { escenarioId } = req.params;
    try {
        // Check at least 1 remains
        const esc = await prisma.simulacionEscenario.findUnique({ where: { id: escenarioId } });
        if (!esc) return res.status(404).json({ error: 'Escenario no encontrado' });
        const count = await prisma.simulacionEscenario.count({ where: { simulacionId: esc.simulacionId } });
        if (count <= 1) return res.status(400).json({ error: 'Debe quedar al menos un escenario' });

        await prisma.simulacionEscenario.delete({ where: { id: escenarioId } });
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
