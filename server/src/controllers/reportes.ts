import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getArtistReport = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
        const isProductor = req.user?.rol === 'Productor';

        const obras = await prisma.obra.findMany({
            where: (isAdmin || isProductor) ? {} : {
                OR: [
                    { artistas: { some: { id: userId } } },
                    { productorEjecutivoId: userId }
                ]
            },
            include: {
                funciones: {
                    orderBy: {
                        fecha: 'asc'
                    }
                }
            }
        });

        res.json(obras);
    } catch (error) {
        console.error('Error fetching artist report:', error);
        res.status(500).json({ error: 'Error fetching artist report' });
    }
};
