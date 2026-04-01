import { Router } from 'express';
import { getInvitados, addInvitado, deleteInvitado, exportToExcel, exportToPDF } from '../controllers/invitados.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.get('/:funcionId', flexAuth, getInvitados);
router.post('/', flexAuth, addInvitado);
router.delete('/:id', flexAuth, deleteInvitado);
router.get('/:funcionId/export/excel', flexAuth, exportToExcel);
router.get('/:funcionId/export/pdf', flexAuth, exportToPDF);

export default router;
