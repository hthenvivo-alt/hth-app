
import { Router, Response, NextFunction } from 'express';
import { createBackup, getBackups, restoreBackup, downloadBackup } from '../controllers/backup.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { uploadBackup } from '../middleware/upload.js';

const router = Router();

// Allow either JWT auth or Agent API Key for backup routes
const flexAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const agentKey = req.headers['x-agent-key'] as string;
    const validKey = process.env.AGENT_API_KEY;

    if (agentKey && validKey && agentKey === validKey) {
        req.user = { id: 'external-agent', email: 'agent@openclaw.ai', rol: 'Administrador' };
        return next();
    }

    // Fall back to JWT auth
    authenticate(req, res, next);
};

router.post('/', flexAuth, createBackup);
router.get('/', flexAuth, getBackups);
router.post('/restore/:filename', flexAuth, restoreBackup);
router.get('/download/:filename', flexAuth, downloadBackup);
router.post('/upload', flexAuth, uploadBackup.single('backup'), (req: any, res: any) => {
    res.json({ message: 'Backup subido correctamente' });
});

export default router;
