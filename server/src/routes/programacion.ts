import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAll, getByObra, create, update, remove, confirmar } from '../controllers/programacion.js';

const router = Router();

// All programacion routes require authentication
router.use(authenticate);

router.get('/', getAll);
router.get('/obra/:obraId', getByObra);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/confirmar', confirmar);

export default router;
