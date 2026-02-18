import { Router } from 'express';
import { getUsers, createUser, deleteUser, updatePassword, updateUser } from '../controllers/users.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Rutas de administración (Solo Administrador)
router.get('/', authenticate, authorize(['Administrador', 'Admin']), getUsers);
router.post('/', authenticate, authorize(['Administrador', 'Admin']), createUser);
router.patch('/:id', authenticate, authorize(['Administrador', 'Admin']), updateUser);
router.delete('/:id', authenticate, authorize(['Administrador', 'Admin']), deleteUser);

// Ruta personal (Cualquier usuario autenticado)
router.post('/change-password', authenticate, updatePassword);

export default router;
