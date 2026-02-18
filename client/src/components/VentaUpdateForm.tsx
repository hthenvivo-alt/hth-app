import React, { useState } from 'react';
import api from '../lib/api';
import { Loader2, Ticket, DollarSign, ExternalLink, User, Lock } from 'lucide-react';

interface VentaUpdateFormProps {
    funcion: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const VentaUpdateForm: React.FC<VentaUpdateFormProps> = ({ funcion, onSuccess, onCancel }) => {
    const funcionId = funcion?.id;
    const [entradasVendidas, setEntradasVendidas] = useState(funcion?.vendidas?.toString() || '');
    const [facturacionBruta, setFacturacionBruta] = useState(funcion?.ultimaFacturacionBruta?.toString() || '');
    const [canalVenta, setCanalVenta] = useState('Ticketera');
    const [tipoVenta, setTipoVenta] = useState('Preventa');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Update state if funcion prop changes
    React.useEffect(() => {
        if (funcion) {
            setEntradasVendidas(funcion.vendidas?.toString() || '');
            setFacturacionBruta(funcion.ultimaFacturacionBruta?.toString() || '');
        }
    }, [funcion]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/ventas', {
                funcionId,
                entradasVendidas: parseInt(entradasVendidas),
                facturacionBruta: facturacionBruta ? parseFloat(facturacionBruta) : null,
                canalVenta,
                tipoVenta // 'Preventa' para actualizaciones diarias, 'Venta Final' para el cierre
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al actualizar ventas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticketera Info & Link */}
            <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary-500 mb-1">Acceso a Ticketera</h4>
                        <p className="text-gray-500 text-[11px] font-medium italic">Utiliza estas credenciales para ver el reporte de preventa.</p>
                    </div>
                    {funcion?.linkMonitoreoVenta ? (
                        <button
                            type="button"
                            onClick={() => window.open(funcion.linkMonitoreoVenta, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95 whitespace-nowrap"
                        >
                            <ExternalLink size={14} strokeWidth={3} />
                            Ir a Backend
                        </button>
                    ) : (
                        <span className="text-[10px] text-gray-600 font-bold uppercase italic">Link no configurado</span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                        <User size={14} className="text-primary-400" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500 leading-none mb-0.5">Usuario</span>
                            <span className="text-sm font-bold text-white leading-tight">{funcion?.userVentaTicketera || 'No definido'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                        <Lock size={14} className="text-primary-400" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500 leading-none mb-0.5">Password</span>
                            <span className="text-sm font-mono font-bold text-white leading-tight">{funcion?.passVentaTicketera || 'No definida'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Entradas Vendidas (Total Acumulado)</label>
                <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="number"
                        required
                        value={entradasVendidas}
                        onChange={(e) => setEntradasVendidas(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                        placeholder="Ej: 156"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Facturación Bruta (Opcional)</label>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="number"
                        step="0.01"
                        value={facturacionBruta}
                        onChange={(e) => setFacturacionBruta(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                        placeholder="Ej: 450000"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Canal</label>
                    <select
                        value={canalVenta}
                        onChange={(e) => setCanalVenta(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                    >
                        <option value="Ticketera">Ticketera</option>
                        <option value="Puerta">Puerta</option>
                        <option value="Web HTH">Web HTH</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                    <select
                        value={tipoVenta}
                        onChange={(e) => setTipoVenta(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                    >
                        <option value="Preventa">Actualización (Preventa)</option>
                        <option value="Venta Final">Cierre (Venta Final)</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Guardar Venta</span>}
                </button>
            </div>
        </form>
    );
};

export default VentaUpdateForm;
