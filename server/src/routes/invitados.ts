import { Router } from 'express';
import { getInvitados, addInvitado, deleteInvitado, exportToExcel, exportToPDF } from '../controllers/invitados.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:funcionId', authenticate, getInvitados);
router.post('/', authenticate, addInvitado);
router.delete('/:id', authenticate, deleteInvitado);
router.get('/:funcionId/export/excel', authenticate, exportToExcel);
router.get('/:funcionId/export/pdf', authenticate, exportToPDF);

export default router;
