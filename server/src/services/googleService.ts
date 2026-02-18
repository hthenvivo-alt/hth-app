import { google } from 'googleapis';
import prisma from '../lib/prisma.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
};

export const getGoogleAuthUrl = (state?: string) => {
    const oauth2Client = createOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: state
    });
};

export const getAuthClientForUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.googleRefreshToken) {
        throw new Error('User has not linked Google account');
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken || undefined,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : undefined,
    });

    // Handle token refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    googleRefreshToken: tokens.refresh_token,
                },
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });
    });

    return oauth2Client;
};

// Calendar Sync
export const syncFuncionToCalendar = async (userId: string, funcionId: string) => {
    const auth = await getAuthClientForUser(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const funcion = await prisma.funcion.findUnique({
        where: { id: funcionId },
        include: { obra: true }
    });

    if (!funcion) throw new Error('Funcion not found');

    const event = {
        summary: `${funcion.obra.nombre} - ${funcion.salaNombre}`,
        location: `${funcion.salaNombre}, ${funcion.ciudad}`,
        description: funcion.notasProduccion || '',
        start: {
            dateTime: new Date(funcion.fecha).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
            dateTime: new Date(new Date(funcion.fecha).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2h duration default
            timeZone: 'America/Argentina/Buenos_Aires',
        },
    };

    const HTH_CALENDAR_ID = '79167829db9f0c7c8c7631499ddc890b69a114cbf6677bc3e700632e55f4d7c8@group.calendar.google.com';

    const syncToSpecificCalendar = async (calendarId: string) => {
        // Search for existing event with same summary and start time
        const existingEvents = await calendar.events.list({
            calendarId,
            timeMin: new Date(new Date(funcion.fecha).getTime() - 1000).toISOString(),
            timeMax: new Date(new Date(funcion.fecha).getTime() + 1000).toISOString(),
            singleEvents: true,
        });

        const existing = existingEvents.data.items?.find(e => e.summary === event.summary);

        if (existing?.id) {
            const res = await calendar.events.patch({
                calendarId,
                eventId: existing.id,
                requestBody: event,
            });
            return res.data;
        } else {
            const res = await calendar.events.insert({
                calendarId,
                requestBody: event,
            });
            return res.data;
        }
    };

    try {
        return await syncToSpecificCalendar(HTH_CALENDAR_ID);
    } catch (error) {
        console.warn('Error syncing to HTH calendar, trying primary:', error);
        try {
            return await syncToSpecificCalendar('primary');
        } catch (primaryError) {
            console.error('Error syncing to primary calendar:', primaryError);
            throw primaryError;
        }
    }
};

// Drive Management
const ROOT_FOLDER_NAME = 'HTH APP';

const getOrCreateRootFolder = async (drive: any) => {
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

export const createObraDriveFolder = async (userId: string, obraId: string) => {
    const auth = await getAuthClientForUser(userId);
    const drive = google.drive({ version: 'v3', auth });

    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) throw new Error('Obra not found');

    const folderName = `HTH - ${obra.nombre}`;

    try {
        const rootFolderId = await getOrCreateRootFolder(drive);

        // Search for ANY folder with this name in the user's Drive
        const searchRes = await drive.files.list({
            q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, parents)',
        });

        let folderId: string;
        const existingFolder = searchRes.data.files?.[0];

        if (existingFolder) {
            folderId = existingFolder.id!;
            console.log(`Found existing folder: ${folderId}`);

            // Check if it's already in the root folder
            const isInsideRoot = existingFolder.parents?.includes(rootFolderId);

            if (!isInsideRoot) {
                console.log(`Moving folder ${folderId} to root folder ${rootFolderId}`);
                // Move folder to HTH APP
                const previousParents = existingFolder.parents?.join(',');
                await drive.files.update({
                    fileId: folderId,
                    addParents: rootFolderId,
                    removeParents: previousParents,
                    fields: 'id, parents',
                });
            }
        } else {
            // Create new folder inside root
            console.log(`Creating new folder for ${obra.nombre} inside root`);
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [rootFolderId]
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });
            folderId = file.data.id!;
        }

        // Update Obra with the folder ID
        await prisma.obra.update({
            where: { id: obraId },
            data: { driveFolderId: folderId }
        });

        const finalFolder = await drive.files.get({
            fileId: folderId,
            fields: 'id, webViewLink, name'
        });

        return finalFolder.data;
    } catch (error) {
        console.error('Error organizing drive folder:', error);
        throw error;
    }
};

export const listFilesFromDriveFolder = async (userId: string, folderId: string) => {
    const auth = await getAuthClientForUser(userId);
    const drive = google.drive({ version: 'v3', auth });

    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime, size)',
            orderBy: 'name',
        });

        return res.data.files || [];
    } catch (error) {
        console.error('Error listing drive files:', error);
        throw error;
    }
};

export const uploadFileToDrive = async (userId: string, folderId: string, file: { name: string, mimeType: string, body: any }) => {
    const auth = await getAuthClientForUser(userId);
    const drive = google.drive({ version: 'v3', auth });

    try {
        const res = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [folderId],
            },
            media: {
                mimeType: file.mimeType,
                body: file.body,
            },
            fields: 'id, webViewLink, webContentLink',
        });

        return res.data;
    } catch (error) {
        console.error('Error uploading to drive:', error);
        throw error;
    }
};

// Calendar List Events
export const listCalendarEvents = async (userId: string) => {
    const auth = await getAuthClientForUser(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const HTH_CALENDAR_ID = '79167829db9f0c7c8c7631499ddc890b69a114cbf6677bc3e700632e55f4d7c8@group.calendar.google.com';

    try {
        // Try provided HTH Calendar ID first
        const res = await calendar.events.list({
            calendarId: HTH_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return res.data.items || [];
    } catch (error) {
        console.warn('Could not access HTH calendar by ID, searching for it by name...', error);

        try {
            const calendarList = await calendar.calendarList.list();
            const hthCalendar = calendarList.data.items?.find(c =>
                c.summary?.toLowerCase().includes('giras hth') ||
                c.summary?.toLowerCase().includes('hth')
            );

            const calendarId = hthCalendar?.id || 'primary';
            console.log(`Using calendar: ${calendarId} (${hthCalendar?.summary || 'primary'})`);

            const res = await calendar.events.list({
                calendarId: calendarId,
                timeMin: new Date().toISOString(),
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return res.data.items || [];
        } catch (listError) {
            console.error('Error listing calendar events:', listError);
            throw listError;
        }
    }
};

