import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();

        // Start of week (Monday)
        const startOfWeek = new Date(now);
        const day = now.getDay(); // 0 is Sunday, 1 is Monday...
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // This Month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Yearly stats
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const [funcionesSemana, funcionesMes, funcionesAnio] = await Promise.all([
            prisma.funcion.count({
                where: { fecha: { gte: startOfWeek, lte: endOfWeek } }
            }),
            prisma.funcion.count({
                where: { fecha: { gte: startOfMonth, lte: endOfMonth } }
            }),
            prisma.funcion.count({
                where: { fecha: { gte: startOfYear, lte: endOfYear } }
            })
        ]);

        const funcionesRecientes = await prisma.funcion.findMany({
            take: 10, // Increase for scrollability
            orderBy: { fecha: 'asc' },
            where: { fecha: { gte: new Date() } },
            include: {
                obra: true,
                logistica: true,
                checklists: true
            }
        });

        const funcionesWithStats = funcionesRecientes.map(f => {
            const logistica = f.logistica;
            const checklists = f.checklists || [];

            const isSet = (val: string | null | undefined) => Boolean(val && val.trim() !== '');

            const tasks = [
                isSet(logistica?.linkGraficaTicketera),
                isSet(f.linkVentaTicketera),
                isSet(f.linkMonitoreoVenta),
                isSet(logistica?.linkFlyersRedes),
                checklists.find(t => t.descripcionTarea === 'Chequeo técnico con la sala')?.completada || false,
                isSet(logistica?.tipoTrasladoIdaArtista) || isSet(logistica?.tipoTrasladoVueltaArtista) || isSet(logistica?.tipoTrasladoIdaProduccion) || isSet(logistica?.tipoTrasladoVueltaProduccion),
                isSet(logistica?.hotelNombreArtista) || logistica?.alojamientoNoAplicaArtista === true || isSet(logistica?.hotelNombreProduccion) || logistica?.alojamientoNoAplicaProduccion === true
            ];

            const completadas = tasks.filter(t => t === true).length;

            return {
                ...f,
                checklistStats: {
                    total: 7,
                    completadas
                }
            };
        });

        res.json({
            stats: {
                semana: funcionesSemana,
                mes: funcionesMes,
                anio: funcionesAnio
            },
            funciones: funcionesWithStats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
};
