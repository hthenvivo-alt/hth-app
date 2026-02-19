import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
    X,
    TrendingUp,
    Loader2,
    Ticket,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

interface Venta {
    id: string;
    fechaRegistro: string;
    entradasVendidas: number;
    tipoVenta: string;
}

interface SalesEvolutionModalProps {
    funcionId: string;
    obraNombre: string;
    salaNombre: string;
    onClose: () => void;
}

const SalesEvolutionModal: React.FC<SalesEvolutionModalProps> = ({
    funcionId,
    obraNombre,
    salaNombre,
    onClose
}) => {
    const { data: ventas, isLoading } = useQuery<Venta[]>({
        queryKey: ['ventas-evolucion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/ventas/${funcionId}`);
            // Reverse to show chronological order (backend returns desc)
            return [...res.data].reverse();
        }
    });

    const chartData = React.useMemo(() => {
        if (!ventas) return [];
        return ventas.map(v => ({
            fecha: new Date(v.fechaRegistro).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
            fullFecha: new Date(v.fechaRegistro).toLocaleString('es-AR'),
            vendidas: v.entradasVendidas,
            tipo: v.tipoVenta
        }));
    }, [ventas]);

    const latestVenta = ventas && ventas.length > 0 ? ventas[ventas.length - 1] : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary-500/10 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <TrendingUp size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{obraNombre}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em]">{salaNombre}</span>
                                <span className="text-gray-800">•</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Evolución de Ventas</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all border border-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="animate-spin text-primary-500 w-12 h-12" />
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Cargando datos históricos...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="text-center py-32 opacity-20">
                            <TrendingUp size={80} className="mx-auto mb-6" />
                            <p className="text-xl font-black uppercase italic">No hay datos de evolución registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <div className="flex items-center gap-3 mb-4 text-primary-400">
                                        <Ticket size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Actual</span>
                                    </div>
                                    <div className="text-4xl font-black text-white tracking-tighter italic">
                                        {latestVenta?.entradasVendidas.toLocaleString('es-AR')}
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <div className="flex items-center gap-3 mb-4 text-green-400">
                                        <ArrowUpRight size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Último Registro</span>
                                    </div>
                                    <div className="text-xl font-black text-white tracking-tight uppercase">
                                        {latestVenta ? formatDate(latestVenta.fechaRegistro) : '-'}
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                                        <Calendar size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Muestras</span>
                                    </div>
                                    <div className="text-4xl font-black text-white tracking-tighter italic">
                                        {chartData.length}
                                    </div>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="h-[400px] w-full bg-black/20 rounded-[2rem] p-8 border border-white/5 shadow-inner">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="fecha"
                                            stroke="#444"
                                            fontSize={10}
                                            fontWeight="900"
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#444"
                                            fontSize={10}
                                            fontWeight="900"
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#121212',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '16px',
                                                padding: '12px'
                                            }}
                                            itemStyle={{
                                                color: '#eab308',
                                                fontSize: '14px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase'
                                            }}
                                            labelStyle={{
                                                color: '#666',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                marginBottom: '4px',
                                                textTransform: 'uppercase'
                                            }}
                                            labelFormatter={(label, items) => {
                                                const item = items[0]?.payload;
                                                return item ? `${item.fullFecha} (${item.tipo})` : label;
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="vendidas"
                                            stroke="#eab308"
                                            strokeWidth={4}
                                            dot={{ r: 4, strokeWidth: 2, fill: '#000' }}
                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#eab308' }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-black/40 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                    >
                        Cerrar Monitor
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesEvolutionModal;
