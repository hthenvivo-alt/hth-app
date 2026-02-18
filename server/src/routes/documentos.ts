import { Router } from 'express';
import { getObraDocuments, initObraFolder, uploadDocument, searchAllDocuments } from '../controllers/documentos.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/obra/:obraId', authenticate, getObraDocuments);
router.get('/search', authenticate, searchAllDocuments);
router.post('/init-folder/:obraId', authenticate, initObraFolder);
router.post('/upload/:obraId', authenticate, upload.single('file'), uploadDocument);

export default router;
