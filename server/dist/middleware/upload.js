import multer from 'multer';
import path from 'path';
import fs from 'fs';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/bordereaux';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten imágenes y PDFs'), false);
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const comprobantesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/comprobantes';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'comprobante-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const comprobantesFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten imágenes y PDFs'), false);
    }
};
export const uploadComprobantes = multer({
    storage: comprobantesStorage,
    fileFilter: comprobantesFilter,
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
const backupFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten archivos JSON'), false);
    }
};
export const uploadBackup = multer({
    storage: backupStorage,
    fileFilter: backupFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
