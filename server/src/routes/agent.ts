import { Router } from 'express';
import { getAgentBoard, getReferenceData, createAgentFuncion, updateAgentFuncion, getAgentFunciones, getAgentFuncionDetail } from '../controllers/agent.js';
import { agentAuthenticate } from '../middleware/agentAuth.js';

const router = Router();

// All routes here are protected by Agent Key
router.use(agentAuthenticate);

router.get('/board', getAgentBoard);
router.get('/reference', getReferenceData);
router.get('/funciones', getAgentFunciones);
router.get('/funciones/:id', getAgentFuncionDetail);
router.post('/funciones', createAgentFuncion);
router.put('/funciones/:id', updateAgentFuncion);

export default router;
