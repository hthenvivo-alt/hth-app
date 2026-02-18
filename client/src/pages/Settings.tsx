import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Settings as SettingsIcon,
    Mail,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    Calendar,
    HardDrive,
    Shield
} from 'lucide-react';
import ChangePasswordForm from '../components/ChangePasswordForm';
import BackupManager from '../components/BackupManager';

const Settings: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [linking, setLinking] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { data: status, isLoading } = useQuery({
        queryKey: ['google-status'],
        queryFn: async () => {
            const res = await api.get('/auth/google/status');
            return res.data;
        }
    });

    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam === 'success') {
            setMessage({ type: 'success', text: '¡Cuenta de Google vinculada con éxito!' });
            queryClient.invalidateQueries({ queryKey: ['google-status'] });
            setTimeout(() => {
                setSearchParams({});
                setMessage(null);
            }, 5000);
        } else if (statusParam === 'error') {
            setMessage({ type: 'error', text: 'Error al vincular la cuenta de Google. Inténtalo de nuevo.' });
            setTimeout(() => {
                setSearchParams({});
                setMessage(null);
            }, 5000);
        }
    }, [searchParams, queryClient, setSearchParams]);

    const handleLinkGoogle = async () => {
        setLinking(true);
        try {
            const res = await api.get('/auth/google/auth');
            // Redirect to Google OAuth URL
            window.location.href = res.data.url;
        } catch (error) {
            console.error('Error getting Google auth URL:', error);
            setMessage({ type: 'error', text: 'No se pudo iniciar el proceso de vinculación.' });
            setLinking(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 uppercase italic">
                    <SettingsIcon className="text-primary-500" size={36} />
                    Configuración
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Gestiona las integraciones y preferencias de tu cuenta.</p>
            </header>

            {message && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="space-y-12">
                {/* Google Workspace Integration Section */}
                <section className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight italic">Integración Google Workspace</h2>
                            <p className="text-sm text-gray-500 font-medium">Automatiza calendarios y documentos de Google Drive.</p>
                        </div>
                        {isLoading ? (
                            <Loader2 className="animate-spin text-gray-600" size={24} />
                        ) : status?.isLinked ? (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={14} />
                                Vinculado
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-500/10 border border-white/10 rounded-full text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                No vinculado
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                                <div className="p-3 bg-primary-500/10 rounded-xl h-fit">
                                    <Calendar className="text-primary-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-sm mb-1">Google Calendar</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        Sincronización automática de funciones y hojas de ruta en tu calendario personal o compartido.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                                <div className="p-3 bg-primary-500/10 rounded-xl h-fit">
                                    <HardDrive className="text-primary-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-sm mb-1">Google Drive</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        Organización automática de carpetas por Obra y Función. Guardado de presupuestos y contratos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-10 bg-black/20 border border-dashed border-white/10 rounded-3xl text-center">
                            {status?.isLinked ? (
                                <>
                                    <div className="mb-4 p-5 bg-green-500/10 rounded-full text-green-500 border border-green-500/20">
                                        <Mail size={40} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic mb-2">Tu cuenta está conectada</h3>
                                    <p className="text-gray-500 mb-8 max-w-md font-medium text-sm">
                                        Las funciones ahora se sincronizarán automáticamente con tu Calendar y los documentos se guardarán en tu Drive.
                                    </p>
                                    <button
                                        disabled={linking}
                                        className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                                    >
                                        Desvincular cuenta (Próximamente)
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="mb-4 p-5 bg-white/5 rounded-full text-gray-600 border border-white/5">
                                        <Mail size={40} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic mb-2">Conecta tu cuenta de Google</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm font-medium text-sm">
                                        Para activar las automatizaciones, necesitamos permiso para acceder a tu Google Calendar y Drive.
                                    </p>
                                    <button
                                        onClick={handleLinkGoogle}
                                        disabled={linking}
                                        className="bg-primary-500 text-white hover:bg-primary-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-primary-500/20 active:scale-95"
                                    >
                                        {linking ? <Loader2 className="animate-spin" size={20} /> : <ExternalLink size={20} strokeWidth={3} />}
                                        Vincular con Google
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Security Section (Password Change) */}
                <section className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <h2 className="text-xl font-black flex items-center gap-3 uppercase italic">
                            <Shield className="text-primary-500" size={24} />
                            Seguridad
                        </h2>
                        <p className="text-sm text-gray-500 font-medium italic">Gestiona tu contraseña de acceso.</p>
                    </div>

                    <div className="p-8">
                        <div className="max-w-md">
                            <ChangePasswordForm />
                        </div>
                    </div>
                </section>

                {/* Backup & Restore Section */}
                <section className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <h2 className="text-xl font-black flex items-center gap-3 uppercase italic">
                            <HardDrive className="text-primary-500" size={24} />
                            Copias de Seguridad
                        </h2>
                        <p className="text-sm text-gray-500 font-medium italic">Gestiona los respaldos automáticos y manuales de tu información.</p>
                    </div>
                    <div className="bg-[#121212]">
                        <BackupManager />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
