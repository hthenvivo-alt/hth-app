import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardAlerts, linkFuncionToMeta } from '../controllers/metaController.js';

const router = express.Router();

router.get('/campaigns/alerts', authenticate, getDashboardAlerts);
router.post('/link-funcion', authenticate, linkFuncionToMeta);

export default router;
