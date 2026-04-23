#!/usr/bin/env node
/**
 * backup-prod.js
 * Hace un backup completo de la base de datos de producción via la API.
 * 
 * Uso:
 *   node server/scripts/backup-prod.js <URL_API> <EMAIL_ADMIN> <PASSWORD_ADMIN>
 * 
 * Ejemplo:
 *   node server/scripts/backup-prod.js https://tu-app.onrender.com admin@hth.com miPassword123
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [,, API_URL, EMAIL, PASSWORD] = process.argv;

if (!API_URL || !EMAIL || !PASSWORD) {
    console.error('❌ Uso: node backup-prod.js <URL_API> <EMAIL_ADMIN> <PASSWORD_ADMIN>');
    console.error('   Ej: node backup-prod.js https://hth-api.onrender.com admin@hth.com password123');
    process.exit(1);
}

const BASE = API_URL.replace(/\/$/, '');
const isHttps = BASE.startsWith('https');
const requester = isHttps ? https : http;

function request(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const req = requester.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log(`\n🔐 Conectando a: ${BASE}`);

    // 1. LOGIN
    console.log(`   Autenticando como ${EMAIL}...`);
    const loginUrl = new URL(`${BASE}/auth/login`);
    const loginRes = await request(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: EMAIL, password: PASSWORD });

    if (loginRes.status !== 200 || !loginRes.body.token) {
        console.error('❌ Error de autenticación:', loginRes.body);
        process.exit(1);
    }

    const token = loginRes.body.token;
    console.log('   ✅ Login exitoso');

    // 2. TRIGGER BACKUP
    console.log('\n📦 Generando backup en servidor...');
    const backupUrl = new URL(`${BASE}/backup`);
    const backupRes = await request(backupUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (backupRes.status !== 200) {
        console.error('❌ Error al crear backup:', backupRes.body);
        process.exit(1);
    }

    const { filename } = backupRes.body;
    console.log(`   ✅ Backup generado: ${filename}`);

    // 3. DOWNLOAD BACKUP FILE
    console.log('\n⬇️  Descargando archivo...');
    const downloadUrl = new URL(`${BASE}/backup/download/${filename}`);

    const localDir = path.join(__dirname, '..', 'backups', 'local');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const localFile = path.join(localDir, `prod-backup-${timestamp}.json`);

    await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(localFile);
        const r = requester.get(downloadUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        });
        r.on('error', reject);
    });

    const stats = fs.statSync(localFile);
    const sizeKb = (stats.size / 1024).toFixed(1);

    console.log(`\n✅ BACKUP COMPLETO`);
    console.log(`   Archivo: ${localFile}`);
    console.log(`   Tamaño:  ${sizeKb} KB`);
    console.log(`   Timestamp: ${new Date().toLocaleString('es-AR')}`);
    console.log(`\n   Para restaurar: usa el endpoint POST /backup/restore/${filename}\n`);
}

run().catch(err => {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
});
