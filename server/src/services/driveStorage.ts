import { google } from 'googleapis';
import prisma from '../lib/prisma.js';
import { createOAuth2Client } from './googleService.js';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const ROOT_FOLDER_NAME = 'HTH APP';
const COMPROBANTES_FOLDER_NAME = 'Comprobantes';

/**
 * Check if Google Drive is available (admin user with Google linked exists).
 */
const isDriveAvailable = async (): Promise<boolean> => {
    const adminUser = await prisma.user.findFirst({
        where: {
            googleRefreshToken: { not: null },
            rol: { in: ['Admin', 'Administrador'] }
        }
    });
    return !!adminUser;
};

/**
 * Gets the OAuth2 client for the admin user with Google linked.
 * Same pattern as uploadBackupToDrive in googleService.ts.
 */
const getAdminAuth = async () => {
    const adminUser = await prisma.user.findFirst({
        where: {
            googleRefreshToken: { not: null },
            rol: { in: ['Admin', 'Administrador'] }
        }
    });

    if (!adminUser) {
        throw new Error('No admin user with Google account linked. Cannot upload to Drive.');
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: adminUser.googleAccessToken || undefined,
        refresh_token: adminUser.googleRefreshToken!,
        expiry_date: adminUser.googleTokenExpiry ? new Date(adminUser.googleTokenExpiry).getTime() : undefined,
    });

    // Handle token refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await prisma.user.update({
                where: { id: adminUser.id },
                data: { googleRefreshToken: tokens.refresh_token },
            });
        }
        await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });
    });

    return { auth: oauth2Client, userId: adminUser.id };
};

/**
 * Get or create the root 'HTH APP' folder.
 */
const getOrCreateRootFolder = async (drive: any): Promise<string> => {
    const list = await drive.files.list({
        q: `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
    });

    if (list.data.files && list.data.files.length > 0) {
        return list.data.files[0].id;
    }

    const res = await drive.files.create({
        requestBody: {
            name: ROOT_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
    });

    return res.data.id;
};

/**
 * Get or create the 'Comprobantes' subfolder inside 'HTH APP'.
 */
const getOrCreateComprobantesFolder = async (drive: any): Promise<string> => {
    const rootFolderId = await getOrCreateRootFolder(drive);

    const list = await drive.files.list({
        q: `name = '${COMPROBANTES_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`,
        fields: 'files(id)',
    });

    if (list.data.files && list.data.files.length > 0) {
        return list.data.files[0].id;
    }

    const res = await drive.files.create({
        requestBody: {
            name: COMPROBANTES_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
        },
        fields: 'id',
    });

    console.log(`[DriveStorage] Created 'Comprobantes' folder: ${res.data.id}`);
    return res.data.id;
};

/**
 * LOCAL FALLBACK: Save file to disk when Google Drive is not available.
 */
const uploadToLocal = (
    buffer: Buffer,
    filename: string,
    subfolder: string = 'comprobantes'
): { driveFileId: string; webViewLink: string; webContentLink: string; localPath: string } => {
    const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(filename);
    const localFilename = `${subfolder === 'bordereaux' ? 'bordereaux' : 'comprobante'}-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, localFilename);

    fs.writeFileSync(filePath, buffer);
    const localPath = `/uploads/${subfolder}/${localFilename}`;

    console.log(`[DriveStorage] LOCAL fallback: saved ${filename} → ${localPath}`);

    return {
        driveFileId: 'local',
        webViewLink: localPath,
        webContentLink: localPath,
        localPath,
    };
};

/**
 * Upload a file buffer to Google Drive under HTH APP/Comprobantes.
 * Falls back to local disk storage if Google Drive is not available.
 * Makes the file publicly accessible via link so the PDF generator can load it.
 * 
 * @param buffer - The file content as a Buffer
 * @param filename - The original filename (for display in Drive)
 * @param mimeType - The MIME type of the file
 * @returns Object with driveFileId and path info
 */
export const uploadToDrive = async (
    buffer: Buffer,
    filename: string,
    mimeType: string
): Promise<{ driveFileId: string; webViewLink: string; webContentLink: string; localPath?: string }> => {
    // Check if Drive is available, otherwise fall back to local
    const driveOk = await isDriveAvailable();
    if (!driveOk) {
        console.warn('[DriveStorage] No Google account linked. Using local fallback.');
        return uploadToLocal(buffer, filename);
    }

    const { auth } = await getAdminAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folderId = await getOrCreateComprobantesFolder(drive);

    // Upload file
    const stream = Readable.from(buffer);
    const uploadRes = await drive.files.create({
        requestBody: {
            name: filename,
            parents: [folderId],
        },
        media: {
            mimeType,
            body: stream,
        },
        fields: 'id, webViewLink, webContentLink',
    });

    const fileId = uploadRes.data.id!;

    // Make file publicly accessible via link (anyone with the link can view)
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    console.log(`[DriveStorage] Uploaded: ${filename} → ${fileId}`);

    return {
        driveFileId: fileId,
        webViewLink: uploadRes.data.webViewLink || '',
        webContentLink: uploadRes.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
};

/**
 * Download a file from Google Drive by its fileId.
 * Returns the file content as a stream along with metadata.
 */
export const downloadFromDrive = async (fileId: string): Promise<{
    stream: any;
    mimeType: string;
    filename: string;
}> => {
    const { auth } = await getAdminAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata first
    const meta = await drive.files.get({
        fileId,
        fields: 'name, mimeType',
    });

    // Download file content
    const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    );

    return {
        stream: response.data,
        mimeType: meta.data.mimeType || 'application/octet-stream',
        filename: meta.data.name || 'file',
    };
};

/**
 * Delete a file from Google Drive by its fileId.
 */
export const deleteFromDrive = async (fileId: string): Promise<void> => {
    try {
        if (fileId === 'local') return; // Skip local files
        const { auth } = await getAdminAuth();
        const drive = google.drive({ version: 'v3', auth });
        await drive.files.delete({ fileId });
        console.log(`[DriveStorage] Deleted: ${fileId}`);
    } catch (error: any) {
        console.warn(`[DriveStorage] Failed to delete ${fileId}:`, error.message);
    }
};

