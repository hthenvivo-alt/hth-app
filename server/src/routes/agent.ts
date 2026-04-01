import { Router } from 'express';
import {
    getAgentBoard,
    getReferenceData,
    createAgentFuncion,
    updateAgentFuncion,
    getAgentFunciones,
    getAgentFuncionDetail,
    getAgentObraDetalle,
    getAgentObraEvolucionVentas,
    getAgentGastosByObra,
    getAgentProjectionInput,
} from '../controllers/agent.js';
import { agentAuthenticate } from '../middleware/agentAuth.js';

const router = Router();

// All routes here are protected by Agent Key
router.use(agentAuthenticate);

router.get('/board', getAgentBoard);
router.get('/reference', getReferenceData);

// Funciones
router.get('/funciones', getAgentFunciones);
router.get('/funciones/:id/projection-input', getAgentProjectionInput);
router.get('/funciones/:id', getAgentFuncionDetail);
router.post('/funciones', createAgentFuncion);
router.put('/funciones/:id', updateAgentFuncion);

// Obras
router.get('/obras/:id/evolucion-ventas', getAgentObraEvolucionVentas);
router.get('/obras/:id/gastos', getAgentGastosByObra);
router.get('/obras/:id', getAgentObraDetalle);

export default router;
