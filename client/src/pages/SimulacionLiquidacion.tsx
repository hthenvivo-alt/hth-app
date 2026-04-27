import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
    FlaskConical,
    Plus,
    Trash2,
    ChevronRight,
    Clapperboard,
    Layers,
    Clock,
    TrendingUp
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface SimulacionSummary {
    id: string;
    nombre: string;
    moneda: string;
    notas: string | null;
    created_at: string;
    updated_at: string;
    obra: { id: string; nombre: string };
    createdBy: { nombre: string; apellido: string };
    escenarios: { id: string }[];
}

const SimulacionLiquidacion: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showNew, setShowNew] = React.useState(false);
    const [newNombre, setNewNombre] = React.useState('');
    const [newObraId, setNewObraId] = React.useState('');
    const [newMoneda, setNewMoneda] = React.useState<'ARS' | 'USD' | 'EUR'>('ARS');
    const [newNotas, setNewNotas] = React.useState('');

    const { data: sims, isLoading } = useQuery<SimulacionSummary[]>({
        queryKey: ['simulaciones'],
        queryFn: async () => {
            const res = await api.get('/simulacion');
            return res.data;
        }
    });

    const { data: obras } = useQuery<{ id: string; nombre: string }[]>({
        queryKey: ['obras-list'],
        queryFn: async () => {
            const res = await api.get('/obras');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/simulacion', {
                nombre: newNombre,
                obraId: newObraId,
                moneda: newMoneda,
                notas: newNotas
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['simulaciones'] });
            navigate(`/simulacion/${data.id}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/simulacion/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulaciones'] });
        }
    });

    const handleCreate = () => {
        if (!newNombre.trim() || !newObraId) return;
        createMutation.mutate();
    };

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FlaskConical size={22} className="text-violet-400" />
                        <h1 className="text-3xl font-bold tracking-tight">Simulaciones</h1>
                    </div>
                    <p className="text-gray-500">Proyectá liquidaciones hipotéticas antes de la función.</p>
                </div>
                <button
                    onClick={() => setShowNew(v => !v)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/20 transition-all"
                >
                    <Plus size={16} />
                    Nueva Simulación
                </button>
            </header>

            {/* New Simulation Form */}
            {showNew && (
                <div className="mb-8 bg-[#1a1a2e] border border-violet-500/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-3 duration-300">
                    <h2 className="text-sm font-black uppercase tracking-widest text-violet-400 mb-4">Nueva Simulación</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Nombre *</label>
                            <input
                                type="text"
                                value={newNombre}
                                onChange={e => setNewNombre(e.target.value)}
                                placeholder="Ej: Temporada 2026 - Escenario base"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Obra *</label>
                            <select
                                value={newObraId}
                                onChange={e => setNewObraId(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none"
                            >
                                <option value="">Seleccioná una obra...</option>
                                {obras?.map(o => (
                                    <option key={o.id} value={o.id}>{o.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Moneda</label>
                            <select
                                value={newMoneda}
                                onChange={e => setNewMoneda(e.target.value as any)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none"
                            >
                                <option value="ARS">Pesos (ARS)</option>
                                <option value="USD">Dólares (USD)</option>
                                <option value="EUR">Euros (EUR)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Notas (opcional)</label>
                            <input
                                type="text"
                                value={newNotas}
                                onChange={e => setNewNotas(e.target.value)}
                                placeholder="Contexto, hipótesis..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            disabled={!newNombre.trim() || !newObraId || createMutation.isPending}
                            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-all"
                        >
                            {createMutation.isPending ? 'Creando...' : 'Crear Simulación'}
                        </button>
                        <button
                            onClick={() => setShowNew(false)}
                            className="px-5 py-2.5 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">
                    <FlaskConical size={40} className="mx-auto mb-4 opacity-20 animate-pulse" />
                    <p>Cargando simulaciones...</p>
                </div>
            ) : !sims?.length ? (
                <div className="text-center py-20 bg-[#121212] border border-white/5 rounded-2xl text-gray-500">
                    <FlaskConical size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium mb-2">No hay simulaciones todavía</p>
                    <p className="text-sm">Creá una para proyectar el resultado de una función antes de que suceda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sims.map(sim => (
                        <div
                            key={sim.id}
                            onClick={() => navigate(`/simulacion/${sim.id}`)}
                            className="bg-[#121212] border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FlaskConical size={16} className="text-violet-400 flex-shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Simulación</span>
                                    </div>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (confirm('¿Eliminar esta simulación?')) deleteMutation.mutate(sim.id);
                                        }}
                                        className="p-1 text-gray-600 hover:text-red-400 bg-white/0 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors text-base mb-1">{sim.nombre}</h3>

                                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-tight mb-3">
                                    <Clapperboard size={11} className="opacity-60" />
                                    <span>{sim.obra.nombre}</span>
                                </div>

                                {sim.notas && (
                                    <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">{sim.notas}</p>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-gray-600 text-[10px] font-bold uppercase">
                                            <Layers size={10} />
                                            <span>{sim.escenarios.length} escenario{sim.escenarios.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600 text-[10px] font-bold uppercase">
                                            <Clock size={10} />
                                            <span>{formatDate(sim.updated_at)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SimulacionLiquidacion;
