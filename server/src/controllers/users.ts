import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

import { sendWelcomeEmail } from '../services/emailService.js';

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { created_at: 'desc' }
        });

        // Remove password hashes from response
        const usersData = users.map(user => {
            const { passwordHash: _, ...userData } = user;
            return userData;
        });

        res.json(usersData);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

export const createUser = async (req: AuthRequest, res: Response) => {
    const { email, password, nombre, apellido, rol, telefono } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                nombre,
                apellido,
                rol,
                telefono,
            },
        });

        // Send welcome email (asynchronous, don't await if we don't want to block the response)
        sendWelcomeEmail(email, nombre, password).catch(err => console.error('Email failed:', err));

        const { passwordHash: _, ...userData } = user;
        res.status(201).json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (id === req.user?.id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    try {
        await prisma.user.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId as string } });

        if (!user || !user.passwordHash) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId as string },
            data: { passwordHash: newPasswordHash }
        });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email, nombre, apellido, rol, telefono, activo } = req.body;

    try {
        const userToUpdate = await prisma.user.findUnique({ where: { id: id as string } });
        if (!userToUpdate) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Prevent deactivating yourself
        if (id === req.user?.id && activo === false) {
            return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id as string },
            data: {
                email: email ?? userToUpdate.email,
                nombre: nombre ?? userToUpdate.nombre,
                apellido: apellido ?? userToUpdate.apellido,
                rol: rol ?? userToUpdate.rol,
                telefono: telefono ?? userToUpdate.telefono,
                activo: activo ?? userToUpdate.activo,
            }
        });

        const { passwordHash: _, ...userData } = updatedUser;
        res.json(userData);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};
