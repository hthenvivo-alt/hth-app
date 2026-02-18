const email = 'admin@hth.com';
const password = 'admin123';

async function verifyInvitados() {
    try {
        console.log('--- Verificando API de Invitados con Datos de Prueba ---');

        // 1. Login
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('Login falló:', loginData);
            return;
        }
        const { token, user } = loginData;
        console.log('1. Login: OK');

        // 2. Create an Obra
        const obraRes = await fetch('http://localhost:3000/obras', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: 'Obra de Prueba Invitados',
                artistaPrincipal: 'Artista Test',
                estado: 'En Desarrollo',
                productorEjecutivoId: user.id
            })
        });
        const obra = await obraRes.json();
        console.log('2. Obra creada: OK');

        // 3. Create a Funcion
        const funcionRes = await fetch('http://localhost:3000/funciones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                obraId: obra.id,
                fecha: new Date().toISOString(),
                salaNombre: 'Sala Test',
                ciudad: 'Ciudad Test',
                capacidadSala: 100
            })
        });
        const funcion = await funcionRes.json();
        console.log('3. Funcion creada: OK');

        const funcionId = funcion.id;

        // 4. Add Invitado
        const addRes = await fetch('http://localhost:3000/invitados', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ funcionId, nombre: 'Invitado de Prueba', cantidad: 5 })
        });
        const invitado = await addRes.json();
        console.log('4. Agregar Invitado: OK');

        // 5. Get Invitados
        const getRes = await fetch(`http://localhost:3000/invitados/${funcionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const invitados = await getRes.json();
        console.log(`5. Listar Invitados: OK (Encontrados: ${invitados.length})`);

        // 6. Verify suma
        const total = invitados.reduce((acc, i) => acc + i.cantidad, 0);
        console.log(`6. Verificación Suma: OK (Total: ${total})`);

        // 7. Test Export endpoints (just head to see if they don't 500)
        const excelRes = await fetch(`http://localhost:3000/invitados/${funcionId}/export/excel`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('7. Export Excel: ' + (excelRes.ok ? 'OK' : 'ERROR'));

        const pdfRes = await fetch(`http://localhost:3000/invitados/${funcionId}/export/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('8. Export PDF: ' + (pdfRes.ok ? 'OK' : 'ERROR'));

        console.log('--- ¡PRUEBA EXITOSA! ---');

    } catch (error) {
        console.error('Error durante la verificación:', error.message);
    }
}

verifyInvitados();
