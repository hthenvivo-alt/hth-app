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
import { flexAuth } from '../middleware/flexAuth.js';
import { uploadComprobantes } from '../middleware/upload.js';

const router = Router();

router.get('/obra/:obraId', flexAuth, getGastosByObra);
router.get('/funcion/:funcionId', flexAuth, getGastosByFuncion);
router.get('/funcion/:funcionId/download-vouchers', flexAuth, downloadVouchers);
router.post('/', flexAuth, createGasto);
router.post('/:id/upload-voucher', flexAuth, uploadComprobantes.single('voucher'), uploadVoucher);
router.patch('/:id', flexAuth, updateGasto);
router.delete('/:id', flexAuth, deleteGasto);

export default router;
