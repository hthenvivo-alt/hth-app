import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Calendar,
    Users,
    TrendingUp,
    MapPin,
    Ticket,
    ChevronRight,
    Loader2,
    Music2,
    Filter,
    Clock
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import SalesEvolutionModal from '../components/SalesEvolutionModal';

const ArtistReports: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador' || user?.rol === 'Admin';
    const [selectedObraId, setSelectedObraId] = useState<string>('all');
    const [selectedFuncionForChart, setSelectedFuncionForChart] = useState<any>(null);

    const { data: obras, isLoading } = useQuery({
        queryKey: ['artist-reports'],
        queryFn: async () => {
            const res = await api.get('/reportes/artista');
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary-500 w-12 h-12" />
            </div>
        );
    }

    const allFunciones = obras?.flatMap((obra: any) =>
        obra.funciones.map((f: any) => ({ ...f, obraNombre: obra.nombre, obraId: obra.id }))
    ).sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) || [];

    const filteredFunciones = selectedObraId === 'all'
        ? allFunciones
        : allFunciones.filter((f: any) => f.obraId === selectedObraId);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header section with a premium feel */}
            <header className="relative py-12 px-10 rounded-[2.5rem] bg-[#121212] border border-white/5 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Music2 size={240} className="text-primary-500" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-sm font-black text-primary-500 uppercase tracking-[0.4em] mb-3 flex items-center gap-3">
                            <TrendingUp size={24} />
                            {isAdmin ? 'Panel de Administración' : 'Portal del Artista'}
                        </h1>
                        <h2 className="text-5xl font-black text-white tracking-tighter mb-4 italic">Monitor de {isAdmin ? 'Ventas' : 'Funciones'}</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            Control de venta de entradas y agenda en tiempo real
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="relative group min-w-[300px]">
                            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                            <select
                                value={selectedObraId}
                                onChange={(e) => setSelectedObraId(e.target.value)}
                                className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-black uppercase text-[10px] tracking-widest text-white appearance-none cursor-pointer hover:bg-white/10"
                            >
                                <option value="all">Todas las Obras</option>
                                {obras?.map((obra: any) => (
                                    <option key={obra.id} value={obra.id}>{obra.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </header>

            {filteredFunciones.length === 0 ? (
                <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Calendar size={40} className="text-gray-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No hay funciones programadas</h3>
                    <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest">
                        {selectedObraId !== 'all' ? 'No hay funciones registradas para esta obra' : 'Tus próximas presentaciones aparecerán aquí'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredFunciones.map((f: any) => {
                        const totalSold = f.vendidas || 0;
                        const capacity = f.capacidadSala || 0;
                        const percentage = capacity > 0 ? Math.min((totalSold / capacity) * 100, 100) : 0;

                        return (
                            <div key={f.id} className="group relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden hover:border-primary-500/30 transition-all duration-300 shadow-xl">
                                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                    {/* Column 1: Date & Time */}
                                    <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-white/5 md:pr-10">
                                        <span className="text-primary-500 font-black text-3xl italic tracking-tighter leading-none">
                                            {new Date(f.fecha).getDate().toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                            {new Date(f.fecha).toLocaleDateString('es-ES', { month: 'long' })}
                                        </span>
                                    </div>

                                    {/* Column 2: Work & Location */}
                                    <div className="flex-1 min-w-[200px] space-y-1">
                                        <h4 className="text-white font-black text-lg uppercase tracking-tight leading-tight">{f.obraNombre}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{f.salaNombre}</span>
                                            <span className="text-gray-800">•</span>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <MapPin size={10} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">{f.ciudad}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Sales Progress */}
                                    <div className="hidden lg:flex flex-col flex-[1.5] min-w-[250px] space-y-3 px-6">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={16} className="text-primary-500" />
                                                <span className="text-lg font-black text-white">{totalSold.toLocaleString('es-AR')}</span>
                                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest self-end pb-0.5">/ {capacity.toLocaleString('es-AR')}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-primary-500">{Math.round(percentage)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Column 4: Revenue & Link */}
                                    <div className="flex flex-col items-end min-w-[150px] space-y-2 border-l border-white/5 md:pl-10">
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-0.5">Recaudación Bruta</span>
                                            <span className="text-xl font-black text-white">$ {Number(f.ultimaFacturacionBruta || 0).toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[8px] font-black text-gray-700 uppercase tracking-widest">
                                            <Clock size={10} />
                                            {formatDateTime(f.ultimaActualizacionVentas)}
                                        </div>
                                    </div>

                                    {/* Link Icon / Action */}
                                    {f.linkMonitoreoVenta && (
                                        <button
                                            onClick={() => setSelectedFuncionForChart(f)}
                                            className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary-500 text-gray-600 hover:text-white transition-all group/action shadow-lg"
                                            title="Ver Evolución de Ventas"
                                        >
                                            <TrendingUp size={20} className="group-hover/action:scale-110 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedFuncionForChart && (
                <SalesEvolutionModal
                    funcionId={selectedFuncionForChart.id}
                    obraNombre={selectedFuncionForChart.obraNombre}
                    salaNombre={selectedFuncionForChart.salaNombre}
                    onClose={() => setSelectedFuncionForChart(null)}
                />
            )}
        </div>
    );
};

export default ArtistReports;
