import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Ticket,
    Plus,
    Trash2,
    Loader2,
    TrendingUp,
    History
} from 'lucide-react';
import { evaluateArithmetic } from '../utils/evaluate';
import { formatDate } from '../utils/dateUtils';

interface Props {
    funcionId: string;
}

const VentasManager: React.FC<Props> = ({ funcionId }) => {
    const queryClient = useQueryClient();
    const [entradas, setEntradas] = useState<string | number>('');
    const [monto, setMonto] = useState<string | number>('');
    const [tipo, setTipo] = useState('Preventa');
    const [canal, setCanal] = useState('Ticketera');

    const { data: history, isLoading } = useQuery({
        queryKey: ['ventas', funcionId],
        queryFn: async () => {
            const res = await api.get(`/ventas/${funcionId}`);
            return res.data;
        }
    });

    const addMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/ventas', { ...data, funcionId });
        },
        onSuccess: () => {
            setEntradas('');
            setMonto('');
            queryClient.invalidateQueries({ queryKey: ['ventas', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funciones'] }); // Update the main counter
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/ventas/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventas', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funciones'] });
        }
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (entradas) {
            addMutation.mutate({
                entradasVendidas: parseInt(String(entradas)),
                facturacionBruta: monto ? parseFloat(String(monto)) : null,
                tipoVenta: tipo,
                canalVenta: canal
            });
        }
    };

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary-500" size={20} />
                Seguimiento de Ventas
            </h3>

            <form onSubmit={handleAdd} className="space-y-4 mb-8 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase">
                    <label>Entradas</label>
                    <label>Monto Bruto ($)</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={entradas}
                        onChange={(e) => setEntradas(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const result = evaluateArithmetic(String(entradas));
                                if (result !== null) setEntradas(result);
                            }
                        }}
                        placeholder="Ej: 50"
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 ring-primary-500 outline-none"
                    />
                    <input
                        type="text"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const result = evaluateArithmetic(String(monto));
                                if (result !== null) setMonto(result);
                            }
                        }}
                        placeholder="Ej: 150000"
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 ring-primary-500 outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm appearance-none outline-none"
                    >
                        <option value="Preventa">Preventa</option>
                        <option value="Venta Final">Venta Final</option>
                    </select>
                    <select
                        value={canal}
                        onChange={(e) => setCanal(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm appearance-none outline-none"
                    >
                        <option value="Ticketera">Ticketera</option>
                        <option value="Puerta">Puerta</option>
                        <option value="Web Propia">Web</option>
                    </select>
                </div>
                <button
                    disabled={addMutation.isPending || !entradas}
                    className="w-full bg-primary-500 hover:bg-primary-600 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                    {addMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Cargar Novedad
                </button>
            </form>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase mb-2">
                    <History size={14} />
                    Historial de Cargas
                </div>
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : history?.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                                <Ticket className="text-primary-500" size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">+{v.entradasVendidas} entradas</p>
                                <p className="text-[10px] text-gray-500">
                                    {v.tipoVenta} • {v.canalVenta} • {formatDate(v.fechaRegistro)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-primary-400">${parseFloat(v.facturacionBruta || 0).toLocaleString('es-AR')}</span>
                            <button
                                onClick={() => deleteMutation.mutate(v.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VentasManager;
