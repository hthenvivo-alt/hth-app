import { Router } from 'express';
import { getArtistReport, getObraSalesEvolution, getMatrixReportData } from '../controllers/reportes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/artista', authenticate, getArtistReport);
router.get('/evolucion-obra/:obraId', authenticate, getObraSalesEvolution);
router.get('/matrix-report', authenticate, getMatrixReportData);

export default router;
