import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

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
        const obras = await prisma.obra.findMany({ select: { id: true, nombre: true } });
        res.json({ obras });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reference data' });
    }
};

export const createAgentFuncion = async (req: AuthRequest, res: Response) => {
    const { obraId, fecha, precioBase, salaNombre, ciudad, capacidadSala } = req.body;
    if (!obraId || !fecha || !salaNombre || !ciudad) {
        return res.status(400).json({ error: 'Missing required fields: obraId, fecha, salaNombre, ciudad' });
    }

    try {
        const obra = await prisma.obra.findUnique({ where: { id: obraId } });

        if (!obra) {
            return res.status(404).json({ error: 'Obra not found' });
        }

        const nuevaFuncion = await prisma.funcion.create({
            data: {
                obraId,
                fecha: new Date(fecha),
                precioEntradaBase: precioBase || 0,
                capacidadSala: capacidadSala || 0,
                salaNombre: salaNombre,
                ciudad: ciudad,
            }
        });

        // Automated Billboard Announcement (non-blocking)
        try {
            const dateStr = nuevaFuncion.fecha.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires'
            });
            const mensajeContenido = `🤖 **Agente OpenClaw** programó una nueva función:\n**${obra.nombre}** en ${nuevaFuncion.salaNombre} (${nuevaFuncion.ciudad}) para el día **${dateStr}**.`;

            await prisma.mensaje.create({
                data: {
                    contenido: mensajeContenido,
                    autorId: req.user!.id, // This will be 'external-agent' from middleware
                }
            });
        } catch (error) {
            console.warn('Auto-billboard announcement failed for agent:', error);
        }

        res.status(201).json(nuevaFuncion);
    } catch (error) {
        console.error('Agent create funcion error:', error);
        res.status(500).json({ error: 'Error creating funcion via agent' });
    }
};

export const getAgentFunciones = async (req: AuthRequest, res: Response) => {
    try {
        const funciones = await prisma.funcion.findMany({
            include: {
                obra: { select: { nombre: true } },
                liquidacion: { select: { recaudacionBruta: true, confirmada: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        const formattedFunciones = funciones.map((f: any) => ({
            id: f.id,
            obra: f.obra.nombre,
            fecha: f.fecha,
            salaNombre: f.salaNombre,
            ciudad: f.ciudad,
            entradasVendidas: f.vendidas,
            capacidadTotal: f.capacidadSala || 0,
            porcentajeOcupacion: f.capacidadSala && f.capacidadSala > 0
                ? Math.round((f.vendidas / f.capacidadSala) * 100)
                : 0,
            ingresoBruto: f.liquidacion?.recaudacionBruta || 0,
            liquidacionConfirmada: f.liquidacion?.confirmada || false
        }));

        res.json({
            count: formattedFunciones.length,
            funciones: formattedFunciones
        });
    } catch (error) {
        console.error('Agent get funciones error:', error);
        res.status(500).json({ error: 'Error fetching funciones via agent' });
    }
};

export const getAgentFuncionDetail = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Missing funcion ID' });
    }

    try {
        const funcion = await prisma.funcion.findUnique({
            where: { id: id as string },
            include: {
                obra: {
                    include: {
                        artistaPayouts: true
                    }
                },
                ventas: true,
                gastos: true,
                liquidacion: {
                    include: {
                        items: true,
                        repartos: true
                    }
                }
            }
        });

        if (!funcion) {
            return res.status(404).json({ error: 'Funcion not found' });
        }

        res.json(funcion);
    } catch (error) {
        console.error('Agent get funcion detail error:', error);
        res.status(500).json({ error: 'Error fetching funcion detail via agent' });
    }
};
