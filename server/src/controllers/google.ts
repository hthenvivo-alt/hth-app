import { Request, Response } from 'express';
import {
    getGoogleAuthUrl,
    createOAuth2Client
} from '../services/googleService.js';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const authGoogle = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const url = getGoogleAuthUrl(userId);
    res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || typeof code !== 'string' || !userId) {
        return res.status(400).json({ error: 'Missing code or state for user identification' });
    }

    try {
        const oauth2Client = createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        await prisma.user.update({
            where: { id: userId },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });

        res.redirect('http://localhost:5173/settings?status=success');
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect('http://localhost:5173/settings?status=error');
    }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            googleRefreshToken: true,
            email: true
        }
    });

    res.json({ isLinked: !!user?.googleRefreshToken });
};

export const syncDrive = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { obraId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { createObraDriveFolder } = await import('../services/googleService.js');
        const result = await createObraDriveFolder(userId, obraId as string);

        res.json({ message: 'Carpeta de Drive creada con éxito', result });
    } catch (error: any) {
        console.error('Sync drive error:', error);
        res.status(500).json({ error: error.message || 'Error al crear carpeta' });
    }
};

export const syncAllFunciones = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { syncFuncionToCalendar } = await import('../services/googleService.js');

        // Get all future functions
        const futureFunciones = await prisma.funcion.findMany({
            where: {
                fecha: {
                    gte: new Date()
                }
            }
        });

        let successCount = 0;
        let failCount = 0;

        for (const funcion of futureFunciones) {
            try {
                await syncFuncionToCalendar(userId, funcion.id);
                successCount++;
            } catch (err) {
                console.error(`Error syncing funcion ${funcion.id}:`, err);
                failCount++;
            }
        }

        res.json({
            message: `Sincronización completada. Éxito: ${successCount}, Error: ${failCount}`,
            successCount,
            failCount
        });
    } catch (error: any) {
        console.error('Sync all error:', error);
        res.status(500).json({ error: error.message || 'Error al sincronizar todo' });
    }
};
