import { Router } from 'express';
import { getFunciones, createFuncion, updateFuncion, deleteFuncion } from '../controllers/funciones.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.use(flexAuth);

router.get('/', getFunciones);
router.post('/', createFuncion);
router.put('/:id', updateFuncion);
router.delete('/:id', deleteFuncion);

export default router;
