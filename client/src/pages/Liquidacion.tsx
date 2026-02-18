import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { TrendingUp, DollarSign, Calendar, MapPin, ChevronRight, CheckCircle2, Clock, FileSpreadsheet, ChevronDown, Layers, Plus, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/dateUtils';

interface Funcion {
    id: string;
    fecha: string;
    salaNombre: string;
    ciudad: string;
    obra: {
        nombre: string;
    };
    vendidas: number;
    ultimaFacturacionBruta: number | null;
    liquidacion?: {
        id: string;
        confirmada: boolean;
        resultadoFuncion: number;
        recaudacionBruta: number;
        repartoProduccionMonto: number | null;
    } | null;
}

const Liquidacion: React.FC = () => {
    const navigate = useNavigate();
    const [showClosed, setShowClosed] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const { data: funciones, isLoading, refetch } = useQuery<Funcion[]>({
        queryKey: ['funciones-liquidacion'],
        queryFn: async () => {
            const res = await api.get('/funciones');
            return res.data;
        }
    });

    const { data: grupales } = useQuery({
        queryKey: ['liquidaciones-grupales'],
        queryFn: async () => {
            const res = await api.get('/liquidacion/grupal/list');
            return res.data;
        }
    });

    const queryClient = useQueryClient();

    const createBatchMutation = useMutation({
        mutationFn: async (nombre: string) => {
            const res = await api.post('/liquidacion/grupal', { nombre, funcionIds: selectedIds });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['liquidaciones-grupales'] });
            queryClient.invalidateQueries({ queryKey: ['funciones-liquidacion'] });
            setSelectedIds([]);
            navigate(`/liquidacion/grupal/${data.id}`);
        }
    });

    const deleteBatchMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/liquidacion/grupal/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liquidaciones-grupales'] });
            queryClient.invalidateQueries({ queryKey: ['funciones-liquidacion'] });
        }
    });

    const handleCreateBatch = () => {
        const nombre = prompt('Nombre de la liquidación grupal (ej: Temporada Enero)');
        if (nombre) createBatchMutation.mutate(nombre);
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const activeFunciones = funciones?.filter(f => {
        const isPast = new Date(f.fecha) < new Date();
        return isPast && !f.liquidacion?.confirmada;
    }) || [];
    const closedFunciones = funciones?.filter(f => f.liquidacion?.confirmada) || [];

    const availableMonths = React.useMemo(() => {
        if (!funciones) return [];
        const months = new Set<string>();
        funciones.forEach(f => {
            const d = new Date(f.fecha);
            if (!isNaN(d.getTime())) {
                months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [funciones]);

    const formatMonthDisplay = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1));
    };

    const rentabilidadMensual = funciones?.filter(f => {
        const d = new Date(f.fecha);
        if (isNaN(d.getTime())) return false;
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return m === selectedMonth && f.liquidacion?.confirmada;
    }).reduce((acc, f) => {
        const hthResult = Number(f.liquidacion?.repartoProduccionMonto) || Number(f.liquidacion?.resultadoFuncion) || 0;
        return acc + hthResult;
    }, 0) || 0;

    const pendientes = activeFunciones.length;

    const exportToExcel = () => {
        if (!funciones) return;

        const confirmedFunciones = closedFunciones
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        const reportData = confirmedFunciones.map(f => ({
            'Fecha': formatDate(f.fecha),
            'Obra': f.obra?.nombre || '---',
            'Lugar': `${f.salaNombre}, ${f.ciudad}`,
            'Entradas Vendidas': f.vendidas,
            'Recaudación Bruta': f.liquidacion?.recaudacionBruta ? Number(f.liquidacion.recaudacionBruta) : 0,
            'Resultado HTH': (Number(f.liquidacion?.repartoProduccionMonto) || Number(f.liquidacion?.resultadoFuncion) || 0)
        }));

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Informe de Funciones");
        XLSX.writeFile(wb, `Informe_Anual_HTH_${new Date().getFullYear()}.xlsx`);
    };

    const renderLiquidacionTable = (list: Funcion[], isClosed: boolean = false) => (
        <div className={`bg-[#121212] border border-white/5 rounded-2xl overflow-hidden ${isClosed ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-wider">
                            {!isClosed && <th className="px-6 py-4 font-semibold w-10">Select</th>}
                            <th className="px-6 py-4 font-semibold">Función</th>
                            <th className="px-6 py-4 font-semibold">Estado de Venta</th>
                            <th className="px-6 py-4 font-semibold">Liquidación</th>
                            <th className="px-6 py-4 font-semibold text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {list.map((func) => (
                            <tr
                                key={func.id}
                                onClick={() => navigate(`/liquidacion/${func.id}`)}
                                className="hover:bg-white/[0.02] cursor-pointer transition-all group"
                            >
                                {!isClosed && (
                                    <td className="px-6 py-5" onClick={(e) => toggleSelect(func.id, e)}>
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(func.id) ? 'bg-primary-500 border-primary-500' : 'border-white/10 group-hover:border-primary-500/30'}`}>
                                            {selectedIds.includes(func.id) && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </td>
                                )}
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-base group-hover:text-primary-400 transition-colors uppercase tracking-tight text-white/90">{func.obra?.nombre || '---'}</h4>
                                            <div className="flex items-center text-gray-500 text-[10px] font-bold mt-1 space-x-3 uppercase">
                                                <div className="flex items-center">
                                                    <Calendar size={12} className="mr-1 opacity-50" />
                                                    <span>{formatDate(func.fecha)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin size={12} className="mr-1 opacity-50" />
                                                    <span>{func.ciudad}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-300">$ {(func.ultimaFacturacionBruta || 0).toLocaleString('es-AR')} Brutos</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">{func.vendidas} Entradas</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    {func.liquidacion?.confirmada ? (
                                        <div className="flex items-center space-x-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full w-fit border border-green-500/20">
                                            <CheckCircle2 size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Cerrada</span>
                                        </div>
                                    ) : func.liquidacion ? (
                                        <div className="flex items-center space-x-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full w-fit border border-amber-500/20">
                                            <Clock size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Borrador</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1.5 text-gray-500 bg-gray-500/10 px-2.5 py-1 rounded-full w-fit border border-gray-500/20">
                                            <Clock size={12} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Pendiente</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button className="p-2 text-gray-500 group-hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10">
                                        <ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Liquidación</h1>
                    <p className="text-gray-500">Reportes financieros y cierres de funciones.</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 transition-all mb-1"
                >
                    <FileSpreadsheet size={18} />
                    Informe Anual de Funciones
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl relative group overflow-visible">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3 text-primary-500">
                            <TrendingUp size={20} />
                            <span className="text-sm font-black uppercase tracking-widest opacity-80">Rentabilidad Mensual</span>
                        </div>
                        <div className="relative group/menu">
                            <button className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white bg-white/5 px-2 py-1 rounded-lg transition-colors capitalize">
                                {formatMonthDisplay(selectedMonth)}
                                <ChevronDown size={12} />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50">
                                <div className="p-2 max-h-60 overflow-y-auto">
                                    {availableMonths.map(month => (
                                        <button
                                            key={month}
                                            onClick={() => setSelectedMonth(month)}
                                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors capitalize ${selectedMonth === month ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {formatMonthDisplay(month)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mt-3">
                        $ {rentabilidadMensual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Total Cerrado en el Periodo</p>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center space-x-3 text-amber-500 mb-2">
                        <Clock size={20} />
                        <span className="text-sm font-black uppercase tracking-widest opacity-80">Funciones por Liquidar</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mt-3">{pendientes}</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Liquidaciones en Proceso</p>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#1a1a1a]">
                    <div className="flex items-center space-x-3 text-green-500 mb-2">
                        <DollarSign size={20} />
                        <span className="text-sm font-black uppercase tracking-widest opacity-80">Rentabilidad Acumulada</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mt-3">
                        $ {(funciones?.reduce((acc, f) => {
                            const hthResult = Number(f.liquidacion?.repartoProduccionMonto) || Number(f.liquidacion?.resultadoFuncion) || 0;
                            return acc + hthResult;
                        }, 0) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Total Histórico Confirmado</p>
                </div>
            </div>
            {/* Batch Settlements Section */}
            {grupales && grupales.length > 0 && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <Layers size={20} className="text-primary-500" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Liquidaciones Grupales</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grupales.map((g: any) => (
                            <div
                                key={g.id}
                                onClick={() => navigate(`/liquidacion/grupal/${g.id}`)}
                                className="bg-[#121212] border border-white/5 p-5 rounded-2xl hover:border-primary-500/30 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('¿Eliminar grupo?')) deleteBatchMutation.mutate(g.id); }}
                                        className="p-1.5 text-gray-600 hover:text-red-500 bg-white/5 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight">{g.nombre}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                                    {(g.liquidaciones || []).length} Funciones Incluidas
                                </p>
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    {(g.liquidaciones || []).slice(0, 3).map((l: any) => (
                                        <span key={l.id} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase">
                                            {l.funcion?.obra?.nombre || 'Obra'}
                                        </span>
                                    ))}
                                    {(g.liquidaciones || []).length > 3 && (
                                        <span className="text-[8px] text-gray-600 font-bold">+{g.liquidaciones.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-primary-500" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Funciones Individuales</h2>
                </div>
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{selectedIds.length} Seleccionadas</span>
                        <button
                            onClick={handleCreateBatch}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20"
                        >
                            <Plus size={14} />
                            Liquidar en Grupo
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            {/* Closed Settlements Toggle */}
            {closedFunciones.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowClosed(!showClosed)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary-500 font-bold uppercase text-[10px] tracking-widest transition-all bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-primary-500/30"
                    >
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showClosed ? 'rotate-180' : ''}`} />
                        <span>Ver liquidaciones cerradas ({closedFunciones.length})</span>
                    </button>

                    {showClosed && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {renderLiquidacionTable(closedFunciones, true)}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 text-center text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
                        <p className="text-lg font-medium">Cargando funciones...</p>
                    </div>
                ) : activeFunciones.length > 0 ? (
                    renderLiquidacionTable(activeFunciones)
                ) : (
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 text-center text-gray-500">
                        <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay liquidaciones pendientes</p>
                        <p className="text-sm">¡Buen trabajo! Todo está al día.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Liquidacion;
