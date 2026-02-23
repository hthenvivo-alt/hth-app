import prisma from '../lib/prisma.js';
export const getChecklistsByObra = async (req, res) => {
    const { obraId } = req.params;
    try {
        const checklists = await prisma.checklistTarea.findMany({
            where: { obraId: obraId },
            include: {
                responsable: {
                    select: { nombre: true, apellido: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });
        res.json(checklists);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching checklists' });
    }
};
export const getChecklistsByFuncion = async (req, res) => {
    const { funcionId } = req.params;
    try {
        const checklists = await prisma.checklistTarea.findMany({
            where: { funcionId: funcionId },
            include: {
                responsable: {
                    select: { nombre: true, apellido: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });
        res.json(checklists);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching checklists' });
    }
};
export const createChecklist = async (req, res) => {
    const { obraId, funcionId, descripcionTarea, responsableId, fechaLimite, observaciones } = req.body;
    try {
        const checklist = await prisma.checklistTarea.create({
            data: {
                obraId,
                funcionId,
                descripcionTarea,
                responsableId: responsableId === 'system' ? await getSystemUserId() : responsableId,
                fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
                observaciones
            }
        });
        res.status(201).json(checklist);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating checklist' });
    }
};
async function getSystemUserId() {
    // Helper to find or create a system user for automated tasks
    let user = await prisma.user.findFirst({ where: { email: 'sistema@hth.com' } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'sistema@hth.com',
                nombre: 'Sistema',
                apellido: 'Checklist',
                passwordHash: 'no-password',
                rol: 'Admin'
            }
        });
    }
    return user.id;
}
export const updateChecklist = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    if (data.fechaLimite) {
        data.fechaLimite = new Date(data.fechaLimite);
    }
    try {
        const checklist = await prisma.checklistTarea.update({
            where: { id: id },
            data
        });
        res.json(checklist);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating checklist' });
    }
};
export const toggleChecklist = async (req, res) => {
    const { id } = req.params;
    const { completada, observaciones } = req.body;
    try {
        const current = await prisma.checklistTarea.findUnique({ where: { id: id } });
        if (!current)
            return res.status(404).json({ error: 'Tarea not found' });
        const checklist = await prisma.checklistTarea.update({
            where: { id: id },
            data: {
                completada: completada !== undefined ? completada : !current.completada,
                observaciones: observaciones !== undefined ? observaciones : current.observaciones
            }
        });
        res.json(checklist);
    }
    catch (error) {
        res.status(500).json({ error: 'Error toggling checklist' });
    }
};
export const deleteChecklist = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.checklistTarea.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting checklist' });
    }
};
