import prisma from '../lib/prisma.js';
export const getMensajes = async (req, res) => {
    try {
        const mensajes = await prisma.mensaje.findMany({
            where: {
                isArchived: false,
                parentId: null
            },
            include: {
                autor: {
                    select: { id: true, nombre: true, apellido: true, rol: true }
                },
                replies: {
                    include: {
                        autor: {
                            select: { id: true, nombre: true, apellido: true, rol: true }
                        }
                    },
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { created_at: 'desc' }
            ],
            take: 50
        });
        res.json(mensajes);
    }
    catch (error) {
        console.error('Error fetching mensajes:', error);
        res.status(500).json({ error: 'Error fetching mensajes' });
    }
};
export const createMensaje = async (req, res) => {
    const { contenido, parentId } = req.body;
    if (!contenido)
        return res.status(400).json({ error: 'Contenido requerido' });
    try {
        const mensaje = await prisma.mensaje.create({
            data: {
                contenido,
                parentId: parentId || null,
                autorId: req.user.id
            },
            include: {
                autor: {
                    select: { id: true, nombre: true, apellido: true, rol: true }
                }
            }
        });
        res.status(201).json(mensaje);
    }
    catch (error) {
        console.error('Error creating mensaje:', error);
        res.status(500).json({ error: 'Error creating mensaje' });
    }
};
export const deleteMensaje = async (req, res) => {
    const { id } = req.params;
    try {
        const mensaje = await prisma.mensaje.findUnique({
            where: { id: id }
        });
        if (!mensaje)
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        // Admin or author can delete
        if (req.user.rol !== 'Admin' && mensaje.autorId !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        await prisma.mensaje.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting mensaje' });
    }
};
export const togglePin = async (req, res) => {
    const { id } = req.params;
    if (req.user.rol !== 'Admin')
        return res.status(403).json({ error: 'No autorizado' });
    try {
        const mensaje = await prisma.mensaje.findUnique({ where: { id: id } });
        if (!mensaje)
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        const updated = await prisma.mensaje.update({
            where: { id: id },
            data: { isPinned: !mensaje.isPinned }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Error toggling pin' });
    }
};
export const toggleArchive = async (req, res) => {
    const { id } = req.params;
    if (req.user.rol !== 'Admin')
        return res.status(403).json({ error: 'No autorizado' });
    try {
        const mensaje = await prisma.mensaje.findUnique({ where: { id: id } });
        if (!mensaje)
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        const updated = await prisma.mensaje.update({
            where: { id: id },
            data: { isArchived: !mensaje.isArchived }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Error toggling archive' });
    }
};
