import { Router } from 'express';
import { flexAuth } from '../middleware/flexAuth.js';
import { authorize } from '../middleware/auth.js';
import {
    listSimulaciones,
    getSimulacion,
    createSimulacion,
    updateSimulacion,
    deleteSimulacion,
    addEscenario,
    upsertEscenario,
    deleteEscenario
} from '../controllers/simulacion.js';

const router = Router();

const adminOnly = [flexAuth, authorize(['Administrador', 'Admin'])];

router.get('/', ...adminOnly, listSimulaciones);
router.get('/:id', ...adminOnly, getSimulacion);
router.post('/', ...adminOnly, createSimulacion);
router.put('/:id', ...adminOnly, updateSimulacion);
router.delete('/:id', ...adminOnly, deleteSimulacion);
router.post('/:id/escenario', ...adminOnly, addEscenario);
router.put('/escenario/:escenarioId', ...adminOnly, upsertEscenario);
router.delete('/escenario/:escenarioId', ...adminOnly, deleteEscenario);

export default router;
