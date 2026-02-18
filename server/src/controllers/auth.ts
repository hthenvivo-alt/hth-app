import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LOG_FILE = '/tmp/hth_auth.log';
function logToFile(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
    const { email: rawEmail, password, nombre, apellido, rol = 'Invitado', telefono } = req.body;
    const email = rawEmail.toLowerCase();

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
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

        const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

export const login = async (req: Request, res: Response) => {
    let { email: rawEmail, password } = req.body;
    let email = rawEmail?.toLowerCase()?.trim();

    if (email === 'admin') {
        email = 'admin@hth.com';
        logToFile(`Aliasing admin to admin@hth.com`);
    }

    logToFile(`[Login Attempt] Email: ${email}`);
    console.log(`[Login Attempt] Email: ${email}`);

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            logToFile(`[Login Failed] User not found: ${email}`);
            console.log(`[Login Failed] User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.passwordHash) {
            logToFile(`[Login Failed] No password hash for user: ${email}`);
            console.log(`[Login Failed] No password hash for user: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            logToFile(`[Login Failed] Incorrect password for user: ${email}. Provided password length: ${password?.length}`);
            console.log(`[Login Failed] Incorrect password for user: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        logToFile(`[Login Success] User: ${email}`);
        console.log(`[Login Success] User: ${email}`);

        const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { passwordHash, ...userData } = user;
        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase()?.trim();

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // SECURITY: Don't reveal if user exists, but for dev we might want to know.
            // Returning success even if not found to prevent email enumeration.
            return res.json({ message: 'Si el correo existe, se enviarán instrucciones.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires
            }
        });

        // In production, send email here. For now, log it.
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
        console.log(`[PASSWORD RESET] Link for ${email}: ${resetLink}`);
        logToFile(`[PASSWORD RESET] Link for ${email}: ${resetLink}`);

        res.json({ message: 'Instrucciones enviadas al correo.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error procesando solicitud de recuperación' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error restableciendo contraseña' });
    }
};
