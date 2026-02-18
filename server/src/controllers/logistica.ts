import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getLogisticaByFuncion = async (req: AuthRequest, res: Response) => {
    const { funcionId } = req.params;
    try {
        const logistica = await prisma.logisticaRuta.findUnique({
            where: { funcionId: funcionId as string }
        });
        res.json(logistica);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching logistica' });
    }
};

export const upsertLogistica = async (req: AuthRequest, res: Response) => {
    const { funcionId } = req.params;
    const data = req.body;

    try {
        const logistica = await prisma.logisticaRuta.upsert({
            where: { funcionId: funcionId as string },
            update: data,
            create: {
                ...data,
                funcionId: funcionId as string
            }
        });
        res.json(logistica);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error saving logistica' });
    }
};

export const deleteLogistica = async (req: AuthRequest, res: Response) => {
    const { funcionId } = req.params;
    try {
        await prisma.logisticaRuta.delete({
            where: { funcionId: funcionId as string }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting logistica' });
    }
};
