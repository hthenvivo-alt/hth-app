import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getGastosByObra = async (req: AuthRequest, res: Response) => {
    const { obraId } = req.params;
    try {
        const gastos = await prisma.gasto.findMany({
            where: { obraId: obraId as string },
            include: {
                comprobanteDocumento: true
            },
            orderBy: { fechaGasto: 'desc' }
        });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching gastos' });
    }
};

export const getGastosByFuncion = async (req: AuthRequest, res: Response) => {
    const { funcionId } = req.params;
    try {
        const gastos = await prisma.gasto.findMany({
            where: { funcionId: funcionId as string },
            include: {
                comprobanteDocumento: true
            },
            orderBy: { fechaGasto: 'desc' }
        });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching gastos' });
    }
};

export const createGasto = async (req: AuthRequest, res: Response) => {
    const {
        obraId,
        funcionId,
        descripcion,
        monto,
        tipoGasto,
        fechaGasto,
        comprobanteDocumentoId
    } = req.body;

    try {
        const gasto = await prisma.gasto.create({
            data: {
                obraId,
                funcionId,
                descripcion,
                monto,
                tipoGasto,
                fechaGasto: new Date(fechaGasto),
                comprobanteDocumentoId
            }
        });
        res.status(201).json(gasto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error recording gasto' });
    }
};

export const updateGasto = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    if (data.fechaGasto) data.fechaGasto = new Date(data.fechaGasto);

    try {
        const gasto = await prisma.gasto.update({
            where: { id: id as string },
            data
        });
        res.json(gasto);
    } catch (error) {
        res.status(500).json({ error: 'Error updating gasto' });
    }
};

export const deleteGasto = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.gasto.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting gasto' });
    }
};

export const uploadVoucher = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const file = req.file;
    const userId = req.user!.id;

    if (!file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    try {
        const gasto = await prisma.gasto.findUnique({
            where: { id: id as string },
            include: { funcion: true, obra: true }
        });

        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        const documento = await prisma.documento.create({
            data: {
                nombreDocumento: file.originalname,
                tipoDocumento: 'Comprobante',
                linkDrive: `/uploads/comprobantes/${file.filename}`,
                driveFileId: 'local',
                subidoPorId: userId,
                obraId: gasto.obraId,
                funcionId: gasto.funcionId
            }
        });

        const updatedGasto = await prisma.gasto.update({
            where: { id: id as string },
            data: {
                comprobanteDocumentoId: documento.id
            },
            include: {
                comprobanteDocumento: true
            }
        });

        res.json(updatedGasto);
    } catch (error) {
        console.error('Error uploading voucher:', error);
        res.status(500).json({ error: 'Error al subir el comprobante' });
    }
};

export const downloadVouchers = async (req: AuthRequest, res: Response) => {
    const { funcionId } = req.params;

    try {
        const gastos = await prisma.gasto.findMany({
            where: { funcionId: funcionId as string },
            include: { comprobanteDocumento: true }
        });

        const vouchers = (gastos as any)
            .filter((g: any) => g.comprobanteDocumento && g.comprobanteDocumento.linkDrive)
            .map((g: any) => g.comprobanteDocumento!);

        if (vouchers.length === 0) {
            return res.status(404).json({ error: 'No hay comprobantes para esta función' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        const zipName = `Comprobantes_Funcion_${funcionId}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);

        archive.pipe(res);

        vouchers.forEach((v: any) => {
            const fileName = path.basename(v.linkDrive);
            const filePath = path.join(process.cwd(), 'uploads', 'comprobantes', fileName);

            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: v.nombreDocumento });
            }
        });

        await archive.finalize();
    } catch (error) {
        console.error('Error downloading vouchers ZIP:', error);
        res.status(500).json({ error: 'Error al generar el archivo ZIP' });
    }
};
