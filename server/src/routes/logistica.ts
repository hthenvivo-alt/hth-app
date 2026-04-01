import { Router } from 'express';
import {
    getLogisticaByFuncion,
    upsertLogistica,
    deleteLogistica
} from '../controllers/logistica.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/:funcionId', flexAuth, getLogisticaByFuncion);
router.post('/:funcionId', flexAuth, upsertLogistica);
router.delete('/:funcionId', flexAuth, deleteLogistica);

export default router;
