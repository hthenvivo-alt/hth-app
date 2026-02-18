import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getMensajes = async (req: AuthRequest, res: Response) => {
    try {
        const mensajes = await prisma.mensaje.findMany({
            include: {
                autor: {
                    select: { id: true, nombre: true, apellido: true, rol: true }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(mensajes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching mensajes' });
    }
};

export const createMensaje = async (req: AuthRequest, res: Response) => {
    const { contenido } = req.body;
    if (!contenido) return res.status(400).json({ error: 'Contenido requerido' });

    try {
        const mensaje = await prisma.mensaje.create({
            data: {
                contenido,
                autorId: req.user!.id
            },
            include: {
                autor: {
                    select: { id: true, nombre: true, apellido: true, rol: true }
                }
            }
        });
        res.status(201).json(mensaje);
    } catch (error) {
        res.status(500).json({ error: 'Error creating mensaje' });
    }
};

export const deleteMensaje = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const mensaje = await prisma.mensaje.findUnique({
            where: { id: id as string }
        });

        if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

        // Admin or author can delete
        if (req.user!.rol !== 'Admin' && mensaje.autorId !== req.user!.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await prisma.mensaje.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting mensaje' });
    }
};
