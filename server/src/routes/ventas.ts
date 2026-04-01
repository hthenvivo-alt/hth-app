import { Router } from 'express';
import {
    getVentasByFuncion,
    createVenta,
    deleteVenta
} from '../controllers/ventas.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/:funcionId', flexAuth, getVentasByFuncion);
router.post('/', flexAuth, createVenta);
router.delete('/:id', flexAuth, deleteVenta);

export default router;
