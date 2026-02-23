import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to authenticate external agents via API Key
 */
export const agentAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const agentKey = req.headers['x-agent-key'] || req.query.agentKey;
    const validKey = process.env.AGENT_API_KEY;

    if (!validKey) {
        console.error('AGENT_API_KEY not configured in environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!agentKey || agentKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Agent Key' });
    }

    // Assign a virtual admin user for the agent to bypass role checks in existing logic if needed
    // or just to identify the agent in logs
    req.user = {
        id: 'external-agent',
        email: 'agent@openclaw.ai',
        rol: 'Admin'
    };

    next();
};
