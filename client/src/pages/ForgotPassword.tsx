import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            setMessage(res.data.message);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#121212] relative overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-40 grayscale"
                style={{ backgroundImage: 'url("/artifacts/theater_background.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black opacity-80" />

            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center text-gray-400 hover:text-white transition-colors mb-6 group"
                >
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio de sesión
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Recuperar Contraseña</h1>
                    <p className="text-gray-400 mt-2 text-sm">Ingresa tu correo para recibir instrucciones</p>
                </div>

                {message ? (
                    <div className="flex flex-col items-center text-center p-6 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                        <CheckCircle className="text-primary-500 mb-4" size={48} />
                        <p className="text-white font-medium mb-1">¡Correo enviado!</p>
                        <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
                        >
                            Listo
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-inter"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <span>Enviar Instrucciones</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
