import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/', flexAuth, getDashboardStats);

export default router;
