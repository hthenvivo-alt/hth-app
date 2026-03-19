
import { Router } from 'express';
import { createBackup, getBackups, restoreBackup, downloadBackup } from '../controllers/backup.js';
import { authenticate } from '../middleware/auth.js';
import { uploadBackup } from '../middleware/upload.js';

const router = Router();

router.post('/', authenticate, createBackup);
router.get('/', authenticate, getBackups);
router.post('/restore/:filename', authenticate, restoreBackup);
router.get('/download/:filename', authenticate, downloadBackup);
router.post('/upload', authenticate, uploadBackup.single('backup'), (req: any, res: any) => {
    res.json({ message: 'Backup subido correctamente' });
});

export default router;


