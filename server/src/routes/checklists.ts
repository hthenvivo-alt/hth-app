import { Router } from 'express';
import {
    getChecklistsByObra,
    getChecklistsByFuncion,
    createChecklist,
    updateChecklist,
    toggleChecklist,
    deleteChecklist
} from '../controllers/checklists.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/obra/:obraId', flexAuth, getChecklistsByObra);
router.get('/funcion/:funcionId', flexAuth, getChecklistsByFuncion);
router.post('/', flexAuth, createChecklist);
router.patch('/:id', flexAuth, updateChecklist);
router.patch('/:id/toggle', flexAuth, toggleChecklist);
router.delete('/:id', flexAuth, deleteChecklist);

export default router;
