import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendWelcomeEmail = async (to: string, nombre: string, passwordTemporal: string) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject: 'Bienvenido a HTH Productora - Tus Accesos',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #0ea5e9; text-align: center;">¡Bienvenido/a, ${nombre}!</h1>
                <p>Tu cuenta en la plataforma de gestión de <strong>HTH Productora</strong> ha sido creada correctamente.</p>
                <p>A continuación, encontrarás tus credenciales de acceso para empezar a trabajar:</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #0369a1;"><strong>Email:</strong> ${to}</p>
                    <p style="margin: 10px 0 0 0; color: #0369a1;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${passwordTemporal}</span></p>
                </div>
                
                <p style="font-size: 14px; color: #666;">Por seguridad, te recomendamos cambiar tu contraseña desde la sección de <strong>Configuración</strong> una vez que hayas ingresado.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:5173" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ingresar a la Plataforma</a>
                </div>
                
                <hr style="margin: 40px 0 20px 0; border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999; text-align: center;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // We don't throw here to avoid failing the whole user creation if email fails
        // but in a real scenario we might want to log this in a DB or retry
    }
};
