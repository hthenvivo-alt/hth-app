const email = 'admin@hth.com';
const password = 'admin123';
const backupFile = 'backup-2026-02-12T17-44-07-326Z.json';

async function verifyRestore() {
    try {
        console.log(`Intentando login para ${email}...`);
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            const errorText = await loginRes.text();
            console.error('Error en login:', loginRes.status, errorText);
            process.exit(1);
        }

        const { token } = await loginRes.json();
        console.log('Login exitoso.');

        console.log(`Intentando restaurar backup: ${backupFile}...`);
        const restoreRes = await fetch(`http://localhost:3000/backup/restore/${backupFile}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!restoreRes.ok) {
            const errorText = await restoreRes.text();
            console.error('Error en restauración (Status ' + restoreRes.status + '):');
            console.error(errorText);
            process.exit(1);
        }

        const restoreData = await restoreRes.json();
        console.log('Respuesta del servidor:', restoreData);
        console.log('--------------------------------------------------');
        console.log('¡ÉXITO! El backup se restauró correctamente.');
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error('Error de ejecución:', error.message);
        process.exit(1);
    }
}

verifyRestore();
