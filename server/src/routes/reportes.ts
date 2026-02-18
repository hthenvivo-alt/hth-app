import { Router } from 'express';
import { getArtistReport } from '../controllers/reportes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/artista', authenticate, getArtistReport);

export default router;
