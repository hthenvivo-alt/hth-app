import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import LogisticaForm from '../components/LogisticaForm';
import ChecklistManager from '../components/ChecklistManager';
import FinancialSummary from '../components/FinancialSummary';
import VentasManager from '../components/VentasManager';
import GastosList from '../components/GastosList';
import {
    ChevronLeft,
    MapPin,
    Calendar,
    ExternalLink,
    Printer,
    TrendingUp,
    Truck
} from 'lucide-react';
import { generateRoadmapPDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/dateUtils';

const LogisticaDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = React.useState<'logistica' | 'finanzas'>('logistica');

    const { data: funcion, isLoading: isLoadingFuncion } = useQuery({
        queryKey: ['funcion', id],
        queryFn: async () => {
            const res = await api.get(`/funciones`);
            // Find the specific funcion since we don't have a direct detail endpoint yet
            return res.data.find((f: any) => f.id === id);
        }
    });

    const { data: logistica, isLoading: isLoadingLogistica } = useQuery({
        queryKey: ['logistica', id],
        queryFn: async () => {
            const res = await api.get(`/logistica/${id}`);
            return res.data;
        }
    });

    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post(`/logistica/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistica', id] });
            queryClient.invalidateQueries({ queryKey: ['funcion', id] });
            queryClient.invalidateQueries({ queryKey: ['funciones'] });
            alert('Hoja de Ruta guardada correctamente');
        }
    });

    if (isLoadingFuncion || isLoadingLogistica) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!funcion) {
        return <div className="p-8 text-center text-red-500">Función no encontrada</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <button
                onClick={() => navigate('/funciones')}
                className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"
            >
                <ChevronLeft size={20} />
                Volver a Funciones
            </button>

            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary-500 font-bold mb-2">
                        <span className="px-2 py-0.5 bg-primary-500/10 rounded-md text-xs uppercase tracking-widest">Panel de Producción</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter mb-4">{funcion.obra.nombre}</h1>

                    <div className="flex flex-wrap gap-6 text-gray-400">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} />
                            <span>{funcion.salaNombre}, {funcion.ciudad}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary-400 font-semibold">
                            <Calendar size={18} />
                            <span>{formatDate(funcion.fecha)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => generateRoadmapPDF(funcion, logistica)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all text-primary-400"
                    >
                        <Printer size={18} />
                        Generar Hoja de Ruta en PDF
                    </button>
                    <button
                        onClick={() => window.open(funcion.linkVentaTicketera, '_blank')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                    >
                        <ExternalLink size={18} />
                        Ver Ticketera
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
                <button
                    onClick={() => setActiveTab('logistica')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logistica' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    <Truck size={18} />
                    Logística
                </button>
                <button
                    onClick={() => setActiveTab('finanzas')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'finanzas' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    <TrendingUp size={18} />
                    Finanzas & Ventas
                </button>
            </div>

            {activeTab === 'logistica' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2">
                        <section className="bg-[#121212] border border-white/5 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                Detalles de Logística
                            </h3>
                            <LogisticaForm
                                initialData={logistica}
                                onSubmit={(data) => upsertMutation.mutate(data)}
                                onCancel={() => navigate('/funciones')}
                                isLoading={upsertMutation.isPending}
                            />
                        </section>
                    </div>

                    <aside className="space-y-8">
                        <ChecklistManager funcionId={id!} />

                        <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-6 group">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-primary-400">Notas de Producción</h4>
                                <button
                                    onClick={() => {
                                        const newNotes = window.prompt('Editar Notas de Producción:', funcion.notasProduccion || '');
                                        if (newNotes !== null) {
                                            api.put(`/funciones/${id}`, { notasProduccion: newNotes })
                                                .then(() => queryClient.invalidateQueries({ queryKey: ['funcion', id] }));
                                        }
                                    }}
                                    className="p-1 px-2 text-[10px] font-bold bg-primary-500/10 text-primary-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    EDITAR
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed italic">
                                {funcion.notasProduccion || "Sin notas adicionales."}
                            </p>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FinancialSummary funcionId={id!} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <VentasManager funcionId={id!} />
                        <GastosList funcionId={id!} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogisticaDetail;
