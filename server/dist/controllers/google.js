import { getGoogleAuthUrl, createOAuth2Client, getAuthClientForUser } from '../services/googleService.js';
import prisma from '../lib/prisma.js';
export const authGoogle = async (req, res) => {
    const userId = req.user?.id;
    const url = getGoogleAuthUrl(userId);
    res.json({ url });
};
export const googleCallback = async (req, res) => {
    const { code, state } = req.query;
    const userId = state;
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
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/settings?status=success`);
    }
    catch (error) {
        console.error('Google callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/settings?status=error`);
    }
};
export const getStatus = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            googleRefreshToken: true,
            email: true
        }
    });
    if (!user?.googleRefreshToken) {
        return res.json({ isLinked: false });
    }
    try {
        // Active check: Try to refresh/get token
        const client = await getAuthClientForUser(userId);
        await client.getAccessToken();
        res.json({ isLinked: true });
    }
    catch (error) {
        const errorMsg = error.message || '';
        const isInvalid = errorMsg.includes('invalid_grant') ||
            (error.response?.data?.error === 'invalid_grant');
        if (isInvalid) {
            // Token is dead, clear it to stay in sync
            await prisma.user.update({
                where: { id: userId },
                data: {
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    googleTokenExpiry: null
                }
            });
            return res.json({ isLinked: false });
        }
        // Other errors (network, etc) we treat as linked but warn
        res.json({ isLinked: true, warning: 'Check failed but token exists' });
    }
};
export const disconnectGoogle = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null
            }
        });
        res.json({ message: 'Cuenta de Google desvinculada correctamente' });
    }
    catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: error.message || 'Error al desvincular cuenta' });
    }
};
export const syncDrive = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { obraId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { createObraDriveFolder } = await import('../services/googleService.js');
        const result = await createObraDriveFolder(userId, obraId);
        res.json({ message: 'Carpeta de Drive creada con éxito', result });
    }
    catch (error) {
        console.error('Sync drive error:', error);
        res.status(500).json({ error: error.message || 'Error al crear carpeta' });
    }
};
export const syncAllFunciones = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
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
            }
            catch (err) {
                console.error(`Error syncing funcion ${funcion.id}:`, err);
                failCount++;
            }
        }
        res.json({
            message: `Sincronización completada. Éxito: ${successCount}, Error: ${failCount}`,
            successCount,
            failCount
        });
    }
    catch (error) {
        console.error('Sync all error:', error);
        res.status(500).json({ error: error.message || 'Error al sincronizar todo' });
    }
};
