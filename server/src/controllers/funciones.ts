import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getFunciones = async (req: AuthRequest, res: Response) => {
    const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
    const where: any = {};
    if (!isAdmin) {
        where.confirmada = true;
    }

    try {
        const funciones = await prisma.funcion.findMany({
            where,
            include: {
                obra: {
                    include: { artistaPayouts: true }
                },
                productorAsociado: {
                    select: { nombre: true, apellido: true }
                },
                logistica: true,
                checklists: true,
                liquidacion: true,
            },
            orderBy: { fecha: 'asc' }
        });

        // Calculate checklist stats for each funcion
        const funcionesWithStats = funciones.map(f => {
            const logistica = f.logistica;
            const checklists = f.checklists || [];

            const isSet = (val: string | null | undefined) => Boolean(val && val.trim() !== '');

            const tasks = [
                // Auto Links
                isSet(logistica?.linkGraficaTicketera),
                isSet(f.linkVentaTicketera),
                isSet(f.linkMonitoreoVenta),
                isSet(logistica?.linkFlyersRedes),
                // Manual (Chequeo técnico)
                checklists.find(t => t.descripcionTarea === 'Chequeo técnico con la sala')?.completada || false,
                // Auto Logistics
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

        res.json(funcionesWithStats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching funciones' });
    }
};

export const createFuncion = async (req: AuthRequest, res: Response) => {
    const {
        obraId,
        fecha,
        fechas, // New field for bulk creation
        salaNombre,
        salaDireccion,
        ciudad,
        pais,
        capacidadSala,
        precioEntradaBase,
        linkVentaTicketera,
        userVentaTicketera,
        passVentaTicketera,
        linkMonitoreoVenta,
        notasProduccion,
        productorAsociadoId,
        confirmada
    } = req.body;

    // Normalize dates to an array
    const dateList = Array.isArray(fechas) ? fechas : [fecha];

    try {
        const createdFunciones = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const dateStr of dateList) {
                const funcion = await tx.funcion.create({
                    data: {
                        obraId,
                        fecha: new Date(dateStr),
                        salaNombre,
                        salaDireccion,
                        ciudad,
                        pais: pais || 'Argentina',
                        capacidadSala,
                        precioEntradaBase,
                        linkVentaTicketera,
                        userVentaTicketera,
                        passVentaTicketera,
                        linkMonitoreoVenta,
                        notasProduccion,
                        productorAsociadoId,
                        confirmada: confirmada !== undefined ? confirmada : true,
                    },
                });
                results.push(funcion);
            }
            return results;
        });

        // Automated Calendar Sync (non-blocking)
        for (const funcion of createdFunciones) {
            try {
                const { syncFuncionToCalendar } = await import('../services/googleService.js');
                await syncFuncionToCalendar(req.user!.id, funcion.id);
            } catch (error) {
                console.warn(`Auto-sync Calendar failed for funcion ${funcion.id}:`, error);
            }
        }

        // Automated Billboard Announcement (non-blocking)
        try {
            const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { nombre: true } });
            if (obra) {
                let mensajeContenido = '';
                if (createdFunciones.length === 1) {
                    const f = createdFunciones[0];
                    const dateStr = f.fecha.toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        timeZone: 'America/Argentina/Buenos_Aires'
                    });
                    mensajeContenido = `📣 ¡Nueva función programada!\n**${obra.nombre}** en ${f.salaNombre} (${f.ciudad}) para el día **${dateStr}**.`;
                } else {
                    mensajeContenido = `📣 ¡Nuevas funciones programadas!\nSe han agregado **${createdFunciones.length}** nuevas fechas de **${obra.nombre}** en ${salaNombre} (${ciudad}).`;
                }

                await prisma.mensaje.create({
                    data: {
                        contenido: mensajeContenido,
                        autorId: req.user!.id,
                    }
                });
            }
        } catch (error) {
            console.warn('Auto-billboard announcement failed:', error);
        }

        res.status(201).json(createdFunciones.length === 1 ? createdFunciones[0] : createdFunciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating funcion(es)' });
    }
};

export const updateFuncion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    if (data.fecha) data.fecha = new Date(data.fecha);

    try {
        const funcion = await prisma.funcion.update({
            where: { id: id as string },
            data,
        });
        res.json(funcion);
    } catch (error) {
        res.status(500).json({ error: 'Error updating funcion' });
    }
};

export const deleteFuncion = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.funcion.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting funcion' });
    }
};
