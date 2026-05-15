import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Bordereaux & Comprobantes: Memory storage (files go to Google Drive) ---
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes y PDFs'), false);
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadComprobantes = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

const backupStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'backups';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original name for backups if preferred, or add timestamp
    }
});

const backupFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos JSON'), false);
    }
};

export const uploadBackup = multer({
    storage: backupStorage,
    fileFilter: backupFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

