import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
    createObraDriveFolder,
    uploadFileToDrive,
    listFilesFromDriveFolder
} from '../services/googleService.js';

export const getObraDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const obraId = req.params.obraId as string;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const obra = await prisma.obra.findUnique({
            where: { id: obraId },
            select: { driveFolderId: true, nombre: true }
        });

        if (!obra) return res.status(404).json({ error: 'Obra not found' });

        // Get documents registered in DB
        const dbDocs = await prisma.documento.findMany({
            where: { obraId },
            include: { subidoPor: { select: { nombre: true, apellido: true } } },
            orderBy: { created_at: 'desc' }
        });

        // If folder exists, get live files from Drive to show things uploaded manually
        let driveFiles: any[] = [];
        if (obra.driveFolderId) {
            try {
                driveFiles = await listFilesFromDriveFolder(userId, obra.driveFolderId);
            } catch (err) {
                console.warn('Could not list drive files:', err);
            }
        }

        res.json({ dbDocs, driveFiles, driveFolderId: obra.driveFolderId });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const initObraFolder = async (req: AuthRequest, res: Response) => {
    try {
        const obraId = req.params.obraId as string;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const folder = await createObraDriveFolder(userId, obraId);
        res.json(folder);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
    try {
        const obraId = req.params.obraId as string;
        const { tipoDocumento, nombreDocumento } = req.body;
        const userId = req.user?.id;
        const file = req.file;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const obra = await prisma.obra.findUnique({ where: { id: obraId } });
        if (!obra || !obra.driveFolderId) {
            return res.status(400).json({ error: 'Obra does not have a Drive folder initialized' });
        }

        // Upload to Google Drive
        const driveFile = await uploadFileToDrive(userId, (obra as any).driveFolderId as string, {
            name: (nombreDocumento as string) || file.originalname,
            mimeType: file.mimetype,
            body: file.stream || Readable.from(file.buffer)
        });

        // Save to DB
        const doc = await prisma.documento.create({
            data: {
                obraId,
                nombreDocumento: nombreDocumento || file.originalname,
                tipoDocumento, // 'Contrato', 'Rider', etc.
                driveFileId: driveFile.id!,
                linkDrive: driveFile.webViewLink!,
                subidoPorId: userId
            }
        });

        res.json(doc);
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const searchAllDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const docs = await prisma.documento.findMany({
            where: {
                OR: [
                    { nombreDocumento: { contains: q as string, mode: 'insensitive' } },
                    { tipoDocumento: { contains: q as string, mode: 'insensitive' } }
                ]
            },
            include: {
                obra: { select: { nombre: true } },
                subidoPor: { select: { nombre: true, apellido: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Also need Readable for the buffer stream
import { Readable } from 'stream';
