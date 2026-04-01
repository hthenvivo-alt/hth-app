import { Router } from 'express';
import { getLiquidacionByFuncion, upsertLiquidacion, uploadBordereaux, getLastExpensesByObra, getLiquidacionSuggestions, uploadComprobantesFiles, getComprobantes, downloadComprobantesZip, downloadGrupalComprobantesZip, deleteComprobante, createLiquidacionGrupal, getLiquidacionGrupal, deleteLiquidacionGrupal, listLiquidacionesGrupales, addLiquidacionGrupalItem, deleteLiquidacionGrupalItem, upsertLiquidacionGrupal } from '../controllers/liquidacion.js';
import { flexAuth } from '../middleware/flexAuth.js';
import { upload, uploadComprobantes } from '../middleware/upload.js';

const router = Router();

router.get('/:funcionId', flexAuth, getLiquidacionByFuncion);
router.post('/grupal', flexAuth, createLiquidacionGrupal);
router.get('/grupal/list', flexAuth, listLiquidacionesGrupales);
router.get('/grupal/:id', flexAuth, getLiquidacionGrupal);
router.get('/grupal/:id/download-vouchers', flexAuth, downloadGrupalComprobantesZip);
router.delete('/grupal/:id', flexAuth, deleteLiquidacionGrupal);
router.post('/grupal/:id/items', flexAuth, addLiquidacionGrupalItem);
router.post('/grupal/item/:itemId', flexAuth, deleteLiquidacionGrupalItem);
router.put('/grupal/:id', flexAuth, upsertLiquidacionGrupal);
router.post('/:funcionId', flexAuth, upsertLiquidacion);
router.post('/:funcionId/upload-bordereaux', flexAuth, upload.single('bordereaux'), uploadBordereaux);
router.post('/:funcionId/comprobantes', flexAuth, uploadComprobantes.array('comprobantes'), uploadComprobantesFiles);
router.get('/:funcionId/comprobantes', flexAuth, getComprobantes);
router.get('/:funcionId/comprobantes/download', flexAuth, downloadComprobantesZip);
router.delete('/comprobante/:id', flexAuth, deleteComprobante);
router.get('/suggestions/:funcionId', flexAuth, getLiquidacionSuggestions);
router.get('/obra/:obraId/last-expenses', flexAuth, getLastExpensesByObra);

export default router;
