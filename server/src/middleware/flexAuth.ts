import { Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from './auth.js';

/**
 * Middleware que acepta JWT (usuarios de la app) O x-agent-key (agentes externos/OpenClaw).
 * Si el header x-agent-key coincide con AGENT_API_KEY, se simula un usuario administrador.
 */
export const flexAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const agentKey = req.headers['x-agent-key'] as string;
    const validKey = process.env.AGENT_API_KEY;

    if (agentKey && validKey && agentKey === validKey) {
        req.user = { id: 'external-agent', email: 'agent@openclaw.ai', rol: 'Administrador' };
        return next();
    }

    // Fall back to JWT auth
    authenticate(req, res, next);
};
