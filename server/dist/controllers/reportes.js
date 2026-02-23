import prisma from '../lib/prisma.js';
export const getArtistReport = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
        const obras = await prisma.obra.findMany({
            where: isAdmin ? {} : {
                artistas: {
                    some: { id: userId }
                }
            },
            include: {
                funciones: {
                    where: {
                        fecha: {
                            gte: new Date() // Only future or current functions
                        }
                    },
                    orderBy: {
                        fecha: 'asc'
                    }
                }
            }
        });
        res.json(obras);
    }
    catch (error) {
        console.error('Error fetching artist report:', error);
        res.status(500).json({ error: 'Error fetching artist report' });
    }
};
