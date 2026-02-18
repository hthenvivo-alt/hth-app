import axios from 'axios';

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:3000/auth/login', {
            email: 'admin@hth.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token acquired.');

        console.log('Attempting password change...');
        const changeRes = await axios.post('http://localhost:3000/users/change-password',
            {
                currentPassword: 'password123',
                newPassword: 'password123'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('Response Status:', changeRes.status);
        console.log('Response Data:', changeRes.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error message:', error.message);
        }
    }
}

test();
