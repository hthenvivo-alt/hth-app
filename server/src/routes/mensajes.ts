import { Router } from 'express';
import { getMensajes, createMensaje, deleteMensaje } from '../controllers/mensajes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getMensajes);
router.post('/', createMensaje);
router.delete('/:id', deleteMensaje);

export default router;
