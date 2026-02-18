import { Router } from 'express';
import { getFunciones, createFuncion, updateFuncion, deleteFuncion } from '../controllers/funciones.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getFunciones);
router.post('/', createFuncion);
router.put('/:id', updateFuncion);
router.delete('/:id', deleteFuncion);

export default router;
