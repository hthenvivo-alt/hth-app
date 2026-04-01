import { Router } from 'express';
import { getObras, createObra, updateObra, deleteObra } from '../controllers/obras.js';
import { authorize } from '../middleware/auth.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

router.use(flexAuth);

// List Obras (Needed for dropdowns in other forms)
router.get('/', getObras);

// Admin-only management routes
const adminOnly = authorize(['Admin', 'Administrador']);

router.post('/', adminOnly, createObra);
router.put('/:id', adminOnly, updateObra);
router.delete('/:id', adminOnly, deleteObra);

export default router;
