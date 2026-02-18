import React, { useState } from 'react';
import api from '../lib/api';
import { Lock, Shield, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordFormProps {
    onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget; // Capture reference
        setLoading(true);
        setMessage(null);

        const formData = new FormData(form);
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/users/change-password', { currentPassword, newPassword });
            console.log('Password updated successfully:', res.data);
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            form.reset();
            if (onSuccess) setTimeout(onSuccess, 2000);
        } catch (err: any) {
            console.error('Password change error:', err);
            const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido';
            setMessage({ type: 'error', text: `Error: ${errorDetail}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-xs font-bold">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Contraseña Actual</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input
                            name="currentPassword"
                            required
                            type={showCurrentPassword ? "text" : "password"}
                            className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                name="newPassword"
                                required
                                type={showNewPassword ? "text" : "password"}
                                className="w-full pl-5 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Confirmar</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                required
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full pl-5 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black transition-all text-sm uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={18} strokeWidth={3} />}
                    <span>Actualizar Contraseña</span>
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
