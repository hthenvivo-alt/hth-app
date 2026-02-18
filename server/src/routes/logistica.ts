import { Router } from 'express';
import {
    getLogisticaByFuncion,
    upsertLogistica,
    deleteLogistica
} from '../controllers/logistica.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:funcionId', authenticate, getLogisticaByFuncion);
router.post('/:funcionId', authenticate, upsertLogistica);
router.delete('/:funcionId', authenticate, deleteLogistica);

export default router;
