import prisma from '../lib/prisma.js';
export const getObras = async (req, res) => {
    try {
        const obras = await prisma.obra.findMany({
            include: {
                productorEjecutivo: {
                    select: { nombre: true, apellido: true }
                },
                artistaPayouts: true,
                deducciones: true,
                artistas: {
                    select: { id: true, nombre: true, apellido: true, email: true }
                }
            }
        });
        res.json(obras);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching obras' });
    }
};
export const createObra = async (req, res) => {
    const { nombre, artistaPrincipal, descripcion, estado, fechaEstreno, artistaPayouts, deducciones, artistas } = req.body;
    try {
        const obra = await prisma.obra.create({
            data: {
                nombre,
                artistaPrincipal,
                descripcion,
                estado,
                fechaEstreno: fechaEstreno ? new Date(fechaEstreno) : null,
                productorEjecutivoId: req.user.id,
                artistaPayouts: {
                    create: artistaPayouts?.map((p) => ({
                        nombre: p.nombre,
                        porcentaje: p.porcentaje,
                        base: p.base
                    })) || []
                },
                deducciones: {
                    create: deducciones?.map((d) => ({
                        nombre: d.nombre,
                        porcentaje: d.porcentaje || null,
                        monto: d.monto || null,
                        deduceAntesDeSala: d.deduceAntesDeSala ?? true
                    })) || []
                },
                artistas: {
                    connect: artistas?.map((id) => ({ id })) || []
                }
            },
            include: { artistaPayouts: true, deducciones: true, artistas: true }
        });
        // Automated Drive Folder Creation (non-blocking)
        try {
            const { createObraDriveFolder } = await import('../services/googleService.js');
            await createObraDriveFolder(req.user.id, obra.id);
        }
        catch (error) {
            console.warn('Auto-sync Drive failed:', error);
        }
        res.status(201).json(obra);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating obra' });
    }
};
export const updateObra = async (req, res) => {
    const { id } = req.params;
    const { nombre, artistaPrincipal, descripcion, estado, fechaEstreno, artistaPayouts, deducciones, artistas } = req.body;
    try {
        // Use a transaction to ensure atomic update of obra and its payouts
        const obra = await prisma.$transaction(async (tx) => {
            // Update main obra data
            const updatedObra = await tx.obra.update({
                where: { id: id },
                data: {
                    nombre,
                    artistaPrincipal,
                    descripcion,
                    estado,
                    fechaEstreno: fechaEstreno ? new Date(fechaEstreno) : undefined,
                    artistas: {
                        set: artistas?.map((id) => ({ id })) || []
                    }
                },
            });
            // Update payouts: delete old ones and create new ones is often simplest
            if (artistaPayouts) {
                await tx.artistaPayout.deleteMany({
                    where: { obraId: id }
                });
                await tx.artistaPayout.createMany({
                    data: artistaPayouts.map((p) => ({
                        obraId: id,
                        nombre: p.nombre,
                        porcentaje: p.porcentaje,
                        base: p.base
                    }))
                });
            }
            // Update deductions: delete old and create new
            if (deducciones) {
                await tx.obraDeduccion.deleteMany({
                    where: { obraId: id }
                });
                await tx.obraDeduccion.createMany({
                    data: deducciones.map((d) => ({
                        obraId: id,
                        nombre: d.nombre,
                        porcentaje: d.porcentaje || null,
                        monto: d.monto || null,
                        deduceAntesDeSala: d.deduceAntesDeSala ?? true
                    }))
                });
            }
            return tx.obra.findUnique({
                where: { id: id },
                include: { artistaPayouts: true, deducciones: true, artistas: true }
            });
        });
        res.json(obra);
    }
    catch (error) {
        console.error('Error updating obra:', error);
        res.status(500).json({ error: 'Error updating obra' });
    }
};
export const deleteObra = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.obra.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting obra' });
    }
};
