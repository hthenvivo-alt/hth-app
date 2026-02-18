import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const getInvitados = async (req: Request, res: Response) => {
    const { funcionId } = req.params;
    try {
        const invitados = await prisma.invitado.findMany({
            where: { funcionId: funcionId as string },
            orderBy: { created_at: 'desc' }
        });
        res.json(invitados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener invitados' });
    }
};

export const addInvitado = async (req: Request, res: Response) => {
    const { funcionId, nombre, cantidad } = req.body;
    try {
        const invitado = await prisma.invitado.create({
            data: {
                funcionId,
                nombre,
                cantidad: parseInt(cantidad)
            }
        });
        res.status(201).json(invitado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar invitado' });
    }
};

export const deleteInvitado = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.invitado.delete({ where: { id: id as string } });
        res.json({ message: 'Invitado eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar invitado' });
    }
};

export const exportToExcel = async (req: Request, res: Response) => {
    const { funcionId } = req.params;
    try {
        const funcion = (await prisma.funcion.findUnique({
            where: { id: funcionId as string },
            include: { obra: true, invitados: true }
        })) as any;

        if (!funcion) return res.status(404).json({ error: 'Función no encontrada' });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Invitados');

        worksheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Cantidad', key: 'cantidad', width: 10 }
        ];

        funcion.invitados.forEach((inv: any) => {
            worksheet.addRow({ nombre: inv.nombre, cantidad: inv.cantidad });
        });

        const total = funcion.invitados.reduce((acc: number, inv: any) => acc + inv.cantidad, 0);
        worksheet.addRow({});
        worksheet.addRow({ nombre: 'TOTAL', cantidad: total });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=invitados-${funcion.obra.nombre}-${funcionId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al exportar Excel' });
    }
};

export const exportToPDF = async (req: Request, res: Response) => {
    const { funcionId } = req.params;
    try {
        const funcion = (await prisma.funcion.findUnique({
            where: { id: funcionId as string },
            include: { obra: true, invitados: true }
        })) as any;

        if (!funcion) return res.status(404).json({ error: 'Función no encontrada' });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invitados-${funcion.obra.nombre}-${funcionId}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text(`Lista de Invitados - ${funcion.obra.nombre}`, { align: 'center' });
        doc.fontSize(12).text(`Fecha: ${new Date(funcion.fecha).toLocaleDateString()}`, { align: 'center' });
        doc.text(`Sala: ${funcion.salaNombre} - ${funcion.ciudad}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Invitados:', { underline: true });
        doc.moveDown();

        funcion.invitados.forEach((inv: any) => {
            doc.fontSize(12).text(`${inv.nombre}: ${inv.cantidad}`);
        });

        const total = funcion.invitados.reduce((acc: number, inv: any) => acc + inv.cantidad, 0);
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(14).text(`SUMA TOTAL: ${total}`);

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al exportar PDF' });
    }
};
