import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getDashboardStats);

export default router;
