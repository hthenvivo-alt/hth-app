import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import obrasRoutes from './routes/obras.js';
import funcionesRoutes from './routes/funciones.js';
import googleRoutes from './routes/google.js';
import logisticaRoutes from './routes/logistica.js';
import checklistRoutes from './routes/checklists.js';
import ventasRoutes from './routes/ventas.js';
import gastosRoutes from './routes/gastos.js';
import statsRoutes from './routes/stats.js';
import mensajesRoutes from './routes/mensajes.js';
import usersRoutes from './routes/users.js';
import liquidacionRoutes from './routes/liquidacion.js';
import documentosRoutes from './routes/documentos.js';
import backupRoutes from './routes/backup.js';
import invitadosRoutes from './routes/invitados.js';
import reportesRoutes from './routes/reportes.js';
import agentRoutes from './routes/agent.js';
import { createBackup } from './controllers/backup.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/auth', authRoutes);
app.use('/obras', obrasRoutes);
app.use('/funciones', funcionesRoutes);
app.use('/auth/google', googleRoutes);
app.use('/logistica', logisticaRoutes);
app.use('/checklists', checklistRoutes);
app.use('/ventas', ventasRoutes);
app.use('/gastos', gastosRoutes);
app.use('/stats', statsRoutes);
app.use('/mensajes', mensajesRoutes);
app.use('/users', usersRoutes);
app.use('/liquidacion', liquidacionRoutes);
app.use('/documentos', documentosRoutes);
app.use('/backup', backupRoutes);
app.use('/invitados', invitadosRoutes);
app.use('/reportes', reportesRoutes);
app.use('/agent', agentRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve static files from the React app
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));
// Catch-all route to serve index.html for SPA routing
app.get('*splat', (req, res) => {
    // Check if it's an API route that wasn't matched (optional but good practice)
    // Here we just serve index.html for anything not caught by previous routes
    res.sendFile(path.join(clientPath, 'index.html'));
});
// Automatic Daily Backup (24h)
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(() => {
    console.log('Starting automatic daily backup...');
    createBackup();
}, BACKUP_INTERVAL);
// Run a backup on startup if desired, or just log
console.log('Backup system initialized. Next auto-backup in 24h.');
// createBackup(); // Create one on startup to be safe (optional, disabled to speed up dev restarts)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
