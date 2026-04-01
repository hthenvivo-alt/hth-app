import { Router } from 'express';
import { getUsers, createUser, deleteUser, updatePassword, updateUser } from '../controllers/users.js';
import { authorize } from '../middleware/auth.js';
import { flexAuth } from '../middleware/flexAuth.js';

const router = Router();

// Rutas de administración (Solo Administrador)
router.get('/', flexAuth, authorize(['Administrador', 'Admin']), getUsers);
router.post('/', flexAuth, authorize(['Administrador', 'Admin']), createUser);
router.patch('/:id', flexAuth, authorize(['Administrador', 'Admin']), updateUser);
router.delete('/:id', flexAuth, authorize(['Administrador', 'Admin']), deleteUser);

// Ruta personal (Cualquier usuario autenticado)
router.post('/change-password', flexAuth, updatePassword);

export default router;
