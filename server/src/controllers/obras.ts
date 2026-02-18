import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getObras = async (req: AuthRequest, res: Response) => {
    try {
        const obras = await prisma.obra.findMany({
            include: {
                productorEjecutivo: {
                    select: { nombre: true, apellido: true }
                },
                artistaPayouts: true,
                artistas: {
                    select: { id: true, nombre: true, apellido: true, email: true }
                }
            }
        });
        res.json(obras);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching obras' });
    }
};

export const createObra = async (req: AuthRequest, res: Response) => {
    const { nombre, artistaPrincipal, descripcion, estado, fechaEstreno, artistaPayouts, artistas } = req.body;

    try {
        const obra = await prisma.obra.create({
            data: {
                nombre,
                artistaPrincipal,
                descripcion,
                estado,
                fechaEstreno: fechaEstreno ? new Date(fechaEstreno) : null,
                productorEjecutivoId: req.user!.id,
                artistaPayouts: {
                    create: artistaPayouts?.map((p: any) => ({
                        nombre: p.nombre,
                        porcentaje: p.porcentaje,
                        base: p.base
                    })) || []
                },
                artistas: {
                    connect: artistas?.map((id: string) => ({ id })) || []
                }
            },
            include: { artistaPayouts: true, artistas: true }
        });

        // Automated Drive Folder Creation (non-blocking)
        try {
            const { createObraDriveFolder } = await import('../services/googleService.js');
            await createObraDriveFolder(req.user!.id, obra.id);
        } catch (error) {
            console.warn('Auto-sync Drive failed:', error);
        }

        res.status(201).json(obra);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating obra' });
    }
};

export const updateObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, artistaPrincipal, descripcion, estado, fechaEstreno, artistaPayouts, artistas } = req.body;

    try {
        // Use a transaction to ensure atomic update of obra and its payouts
        const obra = await prisma.$transaction(async (tx) => {
            // Update main obra data
            const updatedObra = await tx.obra.update({
                where: { id: id as string },
                data: {
                    nombre,
                    artistaPrincipal,
                    descripcion,
                    estado,
                    fechaEstreno: fechaEstreno ? new Date(fechaEstreno) : undefined,
                    artistas: {
                        set: artistas?.map((id: string) => ({ id })) || []
                    }
                },
            });

            // Update payouts: delete old ones and create new ones is often simplest
            if (artistaPayouts) {
                await tx.artistaPayout.deleteMany({
                    where: { obraId: id as string }
                });

                await tx.artistaPayout.createMany({
                    data: artistaPayouts.map((p: any) => ({
                        obraId: id as string,
                        nombre: p.nombre,
                        porcentaje: p.porcentaje,
                        base: p.base
                    }))
                });
            }

            return tx.obra.findUnique({
                where: { id: id as string },
                include: { artistaPayouts: true, artistas: true }
            });
        });

        res.json(obra);
    } catch (error) {
        console.error('Error updating obra:', error);
        res.status(500).json({ error: 'Error updating obra' });
    }
};

export const deleteObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.obra.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting obra' });
    }
};
