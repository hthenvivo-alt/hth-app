import { Router } from 'express';
import { getLiquidacionByFuncion, upsertLiquidacion, uploadBordereaux, getLastExpensesByObra, uploadComprobantesFiles, getComprobantes, createLiquidacionGrupal, getLiquidacionGrupal, deleteLiquidacionGrupal, listLiquidacionesGrupales, addLiquidacionGrupalItem, deleteLiquidacionGrupalItem, upsertLiquidacionGrupal } from '../controllers/liquidacion.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadComprobantes } from '../middleware/upload.js';

const router = Router();

router.get('/:funcionId', authenticate, getLiquidacionByFuncion);
router.post('/grupal', authenticate, createLiquidacionGrupal);
router.get('/grupal/list', authenticate, listLiquidacionesGrupales);
router.get('/grupal/:id', authenticate, getLiquidacionGrupal);
router.delete('/grupal/:id', authenticate, deleteLiquidacionGrupal);
router.post('/grupal/:id/items', authenticate, addLiquidacionGrupalItem);
router.post('/grupal/item/:itemId', authenticate, deleteLiquidacionGrupalItem);
router.put('/grupal/:id', authenticate, upsertLiquidacionGrupal);
router.post('/:funcionId', authenticate, upsertLiquidacion);
router.post('/:funcionId/upload-bordereaux', authenticate, upload.single('bordereaux'), uploadBordereaux);
router.post('/:funcionId/comprobantes', authenticate, uploadComprobantes.array('comprobantes'), uploadComprobantesFiles);
router.get('/:funcionId/comprobantes', authenticate, getComprobantes);
router.get('/obra/:obraId/last-expenses', authenticate, getLastExpensesByObra);

export default router;
