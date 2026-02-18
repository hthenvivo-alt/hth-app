import { Router } from 'express';
import {
    getGastosByObra,
    getGastosByFuncion,
    createGasto,
    updateGasto,
    deleteGasto,
    uploadVoucher,
    downloadVouchers
} from '../controllers/gastos.js';
import { authenticate } from '../middleware/auth.js';
import { uploadComprobantes } from '../middleware/upload.js';

const router = Router();

router.get('/obra/:obraId', authenticate, getGastosByObra);
router.get('/funcion/:funcionId', authenticate, getGastosByFuncion);
router.get('/funcion/:funcionId/download-vouchers', authenticate, downloadVouchers);
router.post('/', authenticate, createGasto);
router.post('/:id/upload-voucher', authenticate, uploadComprobantes.single('voucher'), uploadVoucher);
router.patch('/:id', authenticate, updateGasto);
router.delete('/:id', authenticate, deleteGasto);

export default router;
