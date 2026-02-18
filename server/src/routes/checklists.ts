import { Router } from 'express';
import {
    getChecklistsByObra,
    getChecklistsByFuncion,
    createChecklist,
    updateChecklist,
    toggleChecklist,
    deleteChecklist
} from '../controllers/checklists.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/obra/:obraId', authenticate, getChecklistsByObra);
router.get('/funcion/:funcionId', authenticate, getChecklistsByFuncion);
router.post('/', authenticate, createChecklist);
router.patch('/:id', authenticate, updateChecklist);
router.patch('/:id/toggle', authenticate, toggleChecklist);
router.delete('/:id', authenticate, deleteChecklist);

export default router;
