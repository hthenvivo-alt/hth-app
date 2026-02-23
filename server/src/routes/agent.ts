import { Router } from 'express';
import { getAgentBoard, getReferenceData, createAgentFuncion } from '../controllers/agent.js';
import { agentAuthenticate } from '../middleware/agentAuth.js';

const router = Router();

// All routes here are protected by Agent Key
router.use(agentAuthenticate);

router.get('/board', getAgentBoard);
router.get('/reference', getReferenceData);
router.post('/funciones', createAgentFuncion);

export default router;
