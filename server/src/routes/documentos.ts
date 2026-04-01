import { Router } from 'express';
import { getObraDocuments, initObraFolder, uploadDocument, searchAllDocuments } from '../controllers/documentos.js';
import { flexAuth } from '../middleware/flexAuth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/obra/:obraId', flexAuth, getObraDocuments);
router.get('/search', flexAuth, searchAllDocuments);
router.post('/init-folder/:obraId', flexAuth, initObraFolder);
router.post('/upload/:obraId', flexAuth, upload.single('file'), uploadDocument);

export default router;
