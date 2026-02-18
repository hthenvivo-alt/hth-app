
import { Router } from 'express';
import { createBackup, getBackups, restoreBackup, downloadBackup } from '../controllers/backup.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createBackup);
router.get('/', authenticate, getBackups);
router.post('/restore/:filename', authenticate, restoreBackup);
router.get('/download/:filename', authenticate, downloadBackup);

export default router;
