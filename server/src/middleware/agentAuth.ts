import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to authenticate external agents via API Key
 */
export const agentAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const agentKey = req.headers['x-agent-key'] || req.query.agentKey;
    const validKey = process.env.AGENT_API_KEY;

    if (!validKey) {
        console.error('AGENT_API_KEY not configured in environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!agentKey || agentKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Agent Key' });
    }

    // Ensure a virtual admin user exists for the agent in the database to satisfy foreign key constraints
    let agentUser = await import('../lib/prisma.js').then(m => m.default.user.findFirst({ where: { email: 'agent@openclaw.ai' } }));

    if (!agentUser) {
        agentUser = await import('../lib/prisma.js').then(m => m.default.user.create({
            data: {
                id: 'external-agent',
                email: 'agent@openclaw.ai',
                nombre: 'Agente',
                apellido: 'OpenClaw',
                rol: 'Administrador',
                activo: true
            }
        }));
    }

    req.user = {
        id: agentUser!.id,
        email: agentUser!.email,
        rol: agentUser!.rol
    };

    next();
};
