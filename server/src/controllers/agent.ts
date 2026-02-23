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

        res.status(201).json(nuevaFuncion);
    } catch (error) {
        console.error('Agent create funcion error:', error);
        res.status(500).json({ error: 'Error creating funcion via agent' });
    }
};
