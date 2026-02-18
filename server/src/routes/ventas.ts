import { Router } from 'express';
import {
    getVentasByFuncion,
    createVenta,
    deleteVenta
} from '../controllers/ventas.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:funcionId', authenticate, getVentasByFuncion);
router.post('/', authenticate, createVenta);
router.delete('/:id', authenticate, deleteVenta);

export default router;
