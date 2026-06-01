import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

// ─────────────────────────────────────────────────────────────
// GET /programacion  — todos los prospectos agrupados por obra
// ─────────────────────────────────────────────────────────────
export const getAll = async (req: AuthRequest, res: Response) => {
    try {
        const obras = await prisma.obra.findMany({
            where: { estado: { not: 'Archivada' } },
            include: {
                prospectos: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        funcion: {
                            select: { id: true, fecha: true, salaNombre: true, ciudad: true, confirmada: true }
                        }
                    }
                },
                funciones: {
                    where: { confirmada: true },
                    select: { id: true, fecha: true, salaNombre: true, ciudad: true, pais: true },
                    orderBy: { fecha: 'asc' }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        res.json(obras);
    } catch (error) {
        console.error('Error fetching programacion:', error);
        res.status(500).json({ error: 'Error al obtener la programación' });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /programacion/obra/:obraId
// ─────────────────────────────────────────────────────────────
export const getByObra = async (req: AuthRequest, res: Response) => {
    const { obraId } = req.params;
    try {
        const [prospectos, funciones] = await Promise.all([
            prisma.fechaProspecto.findMany({
                where: { obraId: obraId as string },
                orderBy: { created_at: 'desc' },
                include: {
                    funcion: {
                        select: { id: true, fecha: true, salaNombre: true, ciudad: true }
                    }
                }
            }),
            prisma.funcion.findMany({
                where: { obraId: obraId as string, confirmada: true },
                select: { id: true, fecha: true, salaNombre: true, ciudad: true, pais: true },
                orderBy: { fecha: 'asc' }
            })
        ]);

        res.json({ prospectos, funciones });
    } catch (error) {
        console.error('Error fetching prospectos by obra:', error);
        res.status(500).json({ error: 'Error al obtener prospectos' });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /programacion
// ─────────────────────────────────────────────────────────────
export const create = async (req: AuthRequest, res: Response) => {
    const {
        obraId, ciudad, pais, fechaTentativa,
        salaNombre, contactoNombre, contactoEmail, contactoTel,
        acuerdoTipo, acuerdoPorcentaje, acuerdoSobre, acuerdoMonto,
        estado, notas
    } = req.body;

    if (!obraId || !ciudad) {
        return res.status(400).json({ error: 'obraId y ciudad son requeridos' });
    }

    try {
        const prospecto = await prisma.fechaProspecto.create({
            data: {
                obraId,
                ciudad,
                pais: pais || 'Argentina',
                fechaTentativa: fechaTentativa ? new Date(fechaTentativa) : null,
                salaNombre: salaNombre || null,
                contactoNombre: contactoNombre || null,
                contactoEmail: contactoEmail || null,
                contactoTel: contactoTel || null,
                acuerdoTipo: acuerdoTipo || null,
                acuerdoPorcentaje: acuerdoPorcentaje != null ? Number(acuerdoPorcentaje) : null,
                acuerdoSobre: acuerdoSobre || null,
                acuerdoMonto: acuerdoMonto != null ? Number(acuerdoMonto) : null,
                estado: estado || 'idea',
                notas: notas || null,
            }
        });

        res.status(201).json(prospecto);
    } catch (error) {
        console.error('Error creating prospecto:', error);
        res.status(500).json({ error: 'Error al crear el prospecto' });
    }
};

// ─────────────────────────────────────────────────────────────
// PUT /programacion/:id
// ─────────────────────────────────────────────────────────────
export const update = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        ciudad, pais, fechaTentativa,
        salaNombre, contactoNombre, contactoEmail, contactoTel,
        acuerdoTipo, acuerdoPorcentaje, acuerdoSobre, acuerdoMonto,
        estado, notas
    } = req.body;

    try {
        const prospecto = await prisma.fechaProspecto.update({
            where: { id: id as string },
            data: {
                ciudad,
                pais,
                fechaTentativa: fechaTentativa !== undefined
                    ? (fechaTentativa ? new Date(fechaTentativa) : null)
                    : undefined,
                salaNombre: salaNombre !== undefined ? salaNombre || null : undefined,
                contactoNombre: contactoNombre !== undefined ? contactoNombre || null : undefined,
                contactoEmail: contactoEmail !== undefined ? contactoEmail || null : undefined,
                contactoTel: contactoTel !== undefined ? contactoTel || null : undefined,
                acuerdoTipo: acuerdoTipo !== undefined ? acuerdoTipo || null : undefined,
                acuerdoPorcentaje: acuerdoPorcentaje !== undefined
                    ? (acuerdoPorcentaje != null ? Number(acuerdoPorcentaje) : null)
                    : undefined,
                acuerdoSobre: acuerdoSobre !== undefined ? acuerdoSobre || null : undefined,
                acuerdoMonto: acuerdoMonto !== undefined
                    ? (acuerdoMonto != null ? Number(acuerdoMonto) : null)
                    : undefined,
                estado: estado || undefined,
                notas: notas !== undefined ? notas || null : undefined,
            }
        });

        res.json(prospecto);
    } catch (error) {
        console.error('Error updating prospecto:', error);
        res.status(500).json({ error: 'Error al actualizar el prospecto' });
    }
};

// ─────────────────────────────────────────────────────────────
// DELETE /programacion/:id
// ─────────────────────────────────────────────────────────────
export const remove = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.fechaProspecto.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting prospecto:', error);
        res.status(500).json({ error: 'Error al eliminar el prospecto' });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /programacion/:id/confirmar
// Convierte el prospecto en una Función real con el acuerdo pre-cargado
// ─────────────────────────────────────────────────────────────
export const confirmar = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { fecha, capacidadSala, precioEntradaBase } = req.body;

    if (!fecha) {
        return res.status(400).json({ error: 'La fecha exacta de la función es requerida' });
    }

    try {
        const prospecto = await prisma.fechaProspecto.findUnique({
            where: { id: id as string },
            include: { obra: { select: { nombre: true } } }
        });

        if (!prospecto) {
            return res.status(404).json({ error: 'Prospecto no encontrado' });
        }
        if (prospecto.estado === 'confirmada') {
            return res.status(400).json({ error: 'Este prospecto ya fue confirmado' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear la Función con el acuerdo económico del prospecto
            const nuevaFuncion = await tx.funcion.create({
                data: {
                    obraId: prospecto.obraId,
                    fecha: new Date(fecha),
                    salaNombre: prospecto.salaNombre || undefined,
                    ciudad: prospecto.ciudad,
                    pais: prospecto.pais,
                    capacidadSala: capacidadSala ? Number(capacidadSala) : undefined,
                    precioEntradaBase: precioEntradaBase ? Number(precioEntradaBase) : undefined,
                    confirmada: true,
                    // Pre-cargar el acuerdo con la sala
                    acuerdoPorcentaje: prospecto.acuerdoPorcentaje ?? undefined,
                    acuerdoSobre: prospecto.acuerdoSobre ?? undefined,
                }
            });

            // 2. Marcar el prospecto como confirmado y vincularlo a la Función
            const prospectoActualizado = await tx.fechaProspecto.update({
                where: { id: id as string },
                data: {
                    estado: 'confirmada',
                    funcionId: nuevaFuncion.id
                }
            });

            return { funcion: nuevaFuncion, prospecto: prospectoActualizado };
        });

        // 3. Post en el billboard (no bloqueante)
        try {
            const dateStr = result.funcion.fecha.toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires'
            });
            await prisma.mensaje.create({
                data: {
                    contenido: `📣 ¡Nueva función confirmada desde Programación!\n**${prospecto.obra.nombre}** en ${prospecto.salaNombre || prospecto.ciudad} (${prospecto.ciudad}) para el día **${dateStr}**.`,
                    autorId: req.user!.id,
                }
            });
        } catch (e) { console.warn('Auto-billboard failed:', e); }

        res.json(result);
    } catch (error: any) {
        console.error('Error confirming prospecto:', error);
        res.status(500).json({ error: `Error al confirmar: ${error.message}` });
    }
};
