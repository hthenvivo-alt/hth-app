import { Router } from 'express';
import { authGoogle, googleCallback, getStatus, syncDrive, syncAllFunciones } from '../controllers/google.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/auth', authenticate, authGoogle);
router.get('/callback', googleCallback);
router.get('/status', authenticate, getStatus);
router.post('/sync-all', authenticate, syncAllFunciones);

export default router;
