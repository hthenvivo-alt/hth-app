import { Router } from 'express';
import { getArtistReport, getObraSalesEvolution, getMatrixReportData } from '../controllers/reportes.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/artista', flexAuth, getArtistReport);
router.get('/evolucion-obra/:obraId', flexAuth, getObraSalesEvolution);
router.get('/matrix-report', flexAuth, getMatrixReportData);

export default router;
