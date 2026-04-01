import { Router } from 'express';
import { getMensajes, createMensaje, deleteMensaje, togglePin, toggleArchive } from '../controllers/mensajes.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.use(flexAuth);

router.get('/', getMensajes);
router.post('/', createMensaje);
router.delete('/:id', deleteMensaje);
router.patch('/:id/pin', togglePin);
router.patch('/:id/archive', toggleArchive);

export default router;
