import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    ChevronLeft, Save, Plus, Trash2, Info, TrendingUp, DollarSign,
    Users, FlaskConical, Layers, ArrowRight, Target, AlertCircle
} from 'lucide-react';
import { safeEvaluate } from '../utils/evaluate';

interface SimulacionData {
    id: string;
    nombre: string;
    moneda: string;
    notas: string | null;
    obra: {
        id: string;
        nombre: string;
    };
    escenarios: Escenario[];
}

interface Escenario {
    id: string;
    nombre: string;
    ocupacionPorcentaje: number;
    costoTarjetaPorcentaje: number;
    acuerdoPorcentaje: number;
    acuerdoSobre: 'Bruta' | 'Neta';
    impuestoTransferenciaPorcentaje: number;
    categorias: Categoria[];
    gastos: Gasto[];
    deducciones: Deduccion[];
    repartos: Reparto[];
}

interface Categoria {
    id?: string;
    nombre: string;
    precio: number | '';
    aforo: number | '';
}

interface Gasto {
    id?: string;
    concepto: string;
    monto: number | '';
}

interface Deduccion {
    id?: string;
    concepto: string;
    porcentaje: number | '';
    monto: number | '';
    deduceAntesDeSala: boolean;
}

interface Reparto {
    id?: string;
    nombreArtista: string;
    porcentaje: number | '';
    base: 'Bruta' | 'Neta' | 'Utilidad';
    aplicaAAA: boolean;
}

const SimulacionDetalle: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [activeEscenarioIndex, setActiveEscenarioIndex] = useState(0);
    const [localEscenarios, setLocalEscenarios] = useState<Escenario[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    const { data: simulacion, isLoading } = useQuery<SimulacionData>({
        queryKey: ['simulacion', id],
        queryFn: async () => {
            const res = await api.get(`/simulacion/${id}`);
            return res.data;
        }
    });

    useEffect(() => {
        if (simulacion) {
            setLocalEscenarios(simulacion.escenarios.map(esc => ({
                ...esc,
                categorias: esc.categorias.map(c => ({ ...c, precio: Number(c.precio), aforo: Number(c.aforo) })),
                gastos: esc.gastos.map(g => ({ ...g, monto: Number(g.monto) })),
                deducciones: esc.deducciones.map(d => ({ ...d, porcentaje: d.porcentaje ? Number(d.porcentaje) : '', monto: d.monto ? Number(d.monto) : '' })),
                repartos: esc.repartos.map(r => ({ ...r, porcentaje: Number(r.porcentaje) })),
                costoTarjetaPorcentaje: Number(esc.costoTarjetaPorcentaje)
            })));
        }
    }, [simulacion]);

    const activeEscenario = localEscenarios[activeEscenarioIndex];

    const saveMutation = useMutation({
        mutationFn: async (esc: Escenario) => {
            await api.put(`/simulacion/escenario/${esc.id}`, esc);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulacion', id] });
            setIsDirty(false);
        }
    });

    const addEscenarioMutation = useMutation({
        mutationFn: async (nombre: string) => {
            const res = await api.post(`/simulacion/${id}/escenario`, { 
                nombre, 
                clonarDeId: activeEscenario?.id 
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulacion', id] });
        }
    });

    const deleteEscenarioMutation = useMutation({
        mutationFn: async (escId: string) => {
            await api.delete(`/simulacion/escenario/${escId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulacion', id] });
            setActiveEscenarioIndex(0);
        }
    });

    // Calculations for the ACTIVE scenario
    const calculations = useMemo(() => {
        if (!activeEscenario) return null;

        const ocupacion = activeEscenario.ocupacionPorcentaje / 100;
        
        // Income
        const aforoTotal = activeEscenario.categorias.reduce((acc, c) => acc + (Number(c.aforo) || 0), 0);
        const vendidasTotal = Math.round(aforoTotal * ocupacion);
        
        const recaudacionBrutaPotencial = activeEscenario.categorias.reduce((acc, c) => {
            return acc + (Number(c.precio) || 0) * (Number(c.aforo) || 0);
        }, 0);
        
        const ventaTotal = recaudacionBrutaPotencial * ocupacion;
        const costoTarjetas = (ventaTotal * (activeEscenario.costoTarjetaPorcentaje || 0)) / 100;
        const recaudacionBrutaReal = ventaTotal - costoTarjetas;

        // Deductions
        const deduccionesMonto = activeEscenario.deducciones.map(d => {
            if (d.porcentaje !== '') {
                return (recaudacionBrutaReal * Number(d.porcentaje)) / 100;
            }
            return Number(d.monto) || 0;
        });
        
        const totalDeducciones = deduccionesMonto.reduce((acc, m) => acc + m, 0);
        const totalDeduccionesAntes = activeEscenario.deducciones
            .filter(d => d.deduceAntesDeSala)
            .reduce((acc, d, i) => acc + deduccionesMonto[activeEscenario.deducciones.indexOf(d)], 0);
            
        const totalDeduccionesDespues = activeEscenario.deducciones
            .filter(d => !d.deduceAntesDeSala)
            .reduce((acc, d, i) => acc + deduccionesMonto[activeEscenario.deducciones.indexOf(d)], 0);

        const recaudacionNeta = recaudacionBrutaReal - totalDeducciones;
        
        const netoBaseSala = recaudacionBrutaReal - totalDeduccionesAntes;
        const montoAcuerdoSala = activeEscenario.acuerdoSobre === 'Bruta' 
            ? (recaudacionBrutaReal * activeEscenario.acuerdoPorcentaje) / 100
            : (netoBaseSala * activeEscenario.acuerdoPorcentaje) / 100;

        const resultadoCompania = recaudacionNeta - montoAcuerdoSala;
        
        const impuestoTransf = (resultadoCompania * activeEscenario.impuestoTransferenciaPorcentaje) / 100;
        const totalGastos = activeEscenario.gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
        
        const resultadoAntesDeReparto = resultadoCompania - totalGastos - impuestoTransf;

        // Artists split
        const repartosCalculados = activeEscenario.repartos.map(r => {
            let baseMonto = 0;
            if (r.base === 'Bruta') baseMonto = recaudacionBrutaReal;
            else if (r.base === 'Neta') baseMonto = recaudacionNeta;
            else baseMonto = resultadoAntesDeReparto;
            
            const monto = (baseMonto * (Number(r.porcentaje) || 0)) / 100;
            return { ...r, montoCalculado: Math.max(0, monto) };
        });

        const totalRepartoArtistas = repartosCalculados.reduce((acc, r) => acc + r.montoCalculado, 0);
        const resultadoHTH = resultadoAntesDeReparto - totalRepartoArtistas;

        // Break-even calculation
        const grossRevenuePerTicket = aforoTotal > 0 ? recaudacionBrutaPotencial / aforoTotal : 0;
        
        // Variable rate = (Sum of % deductions + hall % if based on gross + cards %)
        const hallRate = activeEscenario.acuerdoSobre === 'Bruta' ? activeEscenario.acuerdoPorcentaje / 100 : 0;
        const cardRate = (activeEscenario.costoTarjetaPorcentaje || 0) / 100;
        const deductionsRate = activeEscenario.deducciones.reduce((acc, d) => acc + (Number(d.porcentaje) || 0) / 100, 0);
        const hallRateOnNet = activeEscenario.acuerdoSobre === 'Neta' ? activeEscenario.acuerdoPorcentaje / 100 : 0;
        
        const totalVariableRate = cardRate + deductionsRate + hallRate + (hallRateOnNet * (1 - deductionsRate));
        const contributionMarginPerTicket = grossRevenuePerTicket * (1 - totalVariableRate);
        
        const fixedCosts = totalGastos + activeEscenario.deducciones.reduce((acc, d) => acc + (Number(d.monto) || 0), 0);
        
        const breakEvenTickets = contributionMarginPerTicket > 0 ? Math.ceil(fixedCosts / contributionMarginPerTicket) : 0;
        const breakEvenOccupation = aforoTotal > 0 ? (breakEvenTickets / aforoTotal) * 100 : 0;

        return {
            vendidasTotal,
            aforoTotal,
            ventaTotal,
            costoTarjetas,
            recaudacionBrutaReal,
            recaudacionNeta,
            totalDeduccionesAntes,
            totalDeduccionesDespues,
            totalDeducciones,
            deduccionesMonto,
            montoAcuerdoSala,
            resultadoCompania,
            totalGastos,
            impuestoTransf,
            resultadoAntesDeReparto,
            repartosCalculados,
            totalRepartoArtistas,
            resultadoHTH,
            breakEvenTickets,
            breakEvenOccupation
        };
    }, [activeEscenario]);

    if (isLoading || !activeEscenario) return <div className="p-20 text-center animate-pulse">Cargando simulación...</div>;

    const updateEscenario = (updater: (prev: Escenario) => Escenario) => {
        setLocalEscenarios(prev => {
            const next = [...prev];
            next[activeEscenarioIndex] = updater(next[activeEscenarioIndex]);
            return next;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        saveMutation.mutate(activeEscenario);
    };

    const symbol = simulacion?.moneda === 'ARS' ? '$' : (simulacion?.moneda === 'USD' ? 'U$D' : '€');

    return (
        <div className="p-6 max-w-7xl mx-auto pb-32">
            <header className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/simulacion')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FlaskConical size={18} className="text-violet-400" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-violet-400">Laboratorio de Simulación</h2>
                        </div>
                        <h1 className="text-3xl font-bold">{simulacion?.nombre}</h1>
                        <p className="text-gray-400">{simulacion?.obra.nombre} — {simulacion?.moneda}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isDirty && (
                        <button 
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/20 transition-all"
                        >
                            <Save size={18} />
                            {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
            </header>

            {/* Escenarios Tabs */}
            <div className="flex items-center gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit border border-white/5">
                {localEscenarios.map((esc, idx) => (
                    <button
                        key={esc.id}
                        onClick={() => setActiveEscenarioIndex(idx)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeEscenarioIndex === idx ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {esc.nombre}
                    </button>
                ))}
                <button 
                    onClick={() => {
                        const name = prompt('Nombre del nuevo escenario:');
                        if (name) addEscenarioMutation.mutate(name);
                    }}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="Agregar Escenario"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* 1. Categorías y Precios */}
                    <section className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} className="text-violet-400" /> Categorías de Entradas
                            </h3>
                            <button 
                                onClick={() => updateEscenario(esc => ({
                                    ...esc, 
                                    categorias: [...esc.categorias, { nombre: 'Nueva Categoría', precio: '', aforo: '' }]
                                }))}
                                className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-white transition-colors"
                            >
                                + Agregar Categoría
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {activeEscenario.categorias.map((cat, idx) => (
                                <div key={idx} className="flex gap-4 items-end">
                                    <div className="flex-[2]">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nombre</label>
                                        <input 
                                            type="text" 
                                            value={cat.nombre}
                                            onChange={e => updateEscenario(esc => {
                                                const cats = [...esc.categorias];
                                                cats[idx].nombre = e.target.value;
                                                return { ...esc, categorias: cats };
                                            })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Precio</label>
                                        <input 
                                            type="number" 
                                            value={cat.precio}
                                            onChange={e => updateEscenario(esc => {
                                                const cats = [...esc.categorias];
                                                cats[idx].precio = e.target.value === '' ? '' : Number(e.target.value);
                                                return { ...esc, categorias: cats };
                                            })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Aforo</label>
                                        <input 
                                            type="number" 
                                            value={cat.aforo}
                                            onChange={e => updateEscenario(esc => {
                                                const cats = [...esc.categorias];
                                                cats[idx].aforo = e.target.value === '' ? '' : Number(e.target.value);
                                                return { ...esc, categorias: cats };
                                            })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-violet-500 outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => updateEscenario(esc => ({
                                            ...esc, 
                                            categorias: esc.categorias.filter((_, i) => i !== idx)
                                        }))}
                                        className="p-2 text-gray-600 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Ocupación Slider */}
                        <div className="mt-10 pt-8 border-t border-white/5">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Porcentaje de Ocupación</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aforo Total: {calculations?.aforoTotal} butacas</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-violet-400">{activeEscenario.ocupacionPorcentaje}%</span>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">~ {calculations?.vendidasTotal} entradas</p>
                                </div>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={activeEscenario.ocupacionPorcentaje}
                                onChange={e => updateEscenario(esc => ({ ...esc, ocupacionPorcentaje: Number(e.target.value) }))}
                                className="w-full h-2 bg-violet-900/30 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                            <div className="flex justify-between mt-2 text-[10px] font-black text-gray-600 uppercase">
                                <span>0% (Vacío)</span>
                                <span>50%</span>
                                <span>100% (Sold Out)</span>
                            </div>
                        </div>

                        {/* Costo Tarjetas */}
                        <div className="mt-10 pt-8 border-t border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-white">Costo de Tarjetas / Service Charge</h4>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        value={activeEscenario.costoTarjetaPorcentaje}
                                        onChange={e => updateEscenario(esc => ({ ...esc, costoTarjetaPorcentaje: Number(e.target.value) }))}
                                        className="w-20 bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-right text-sm font-black text-violet-400 outline-none focus:border-violet-500"
                                    />
                                    <span className="text-sm font-bold text-gray-600">%</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                Se deduce directamente de la venta total para obtener la Recaudación Bruta.
                            </p>
                        </div>
                    </section>

                    {/* 2. Deducciones y Gastos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                <AlertCircle size={14} /> Deducciones
                            </h3>
                            <div className="space-y-4">
                                {activeEscenario.deducciones.map((ded, idx) => (
                                    <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/5 group/ded">
                                        <div className="flex justify-between mb-3">
                                            <input 
                                                type="text"
                                                value={ded.concepto}
                                                onChange={e => updateEscenario(esc => {
                                                    const ds = [...esc.deducciones];
                                                    ds[idx].concepto = e.target.value;
                                                    return { ...esc, deducciones: ds };
                                                })}
                                                className="bg-transparent text-xs font-black uppercase tracking-widest text-violet-400 focus:text-white outline-none w-full border-b border-transparent focus:border-violet-500/30 transition-all mr-4"
                                            />
                                            <button 
                                                onClick={() => updateEscenario(esc => ({ ...esc, deducciones: esc.deducciones.filter((_, i) => i !== idx) }))}
                                                className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-[1.5] relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="%"
                                                    value={ded.porcentaje}
                                                    onChange={e => updateEscenario(esc => {
                                                        const ds = [...esc.deducciones];
                                                        ds[idx].porcentaje = e.target.value === '' ? '' : Number(e.target.value);
                                                        if (e.target.value !== '') ds[idx].monto = '';
                                                        return { ...esc, deducciones: ds };
                                                    })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-all pr-8"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600">%</span>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col items-center">
                                                <div className="h-[1px] w-4 bg-white/10 mb-1" />
                                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">O</span>
                                                <div className="h-[1px] w-4 bg-white/10 mt-1" />
                                            </div>

                                            <div className="flex-[2]">
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Monto fijo"
                                                        value={ded.monto}
                                                        onChange={e => updateEscenario(esc => {
                                                            const ds = [...esc.deducciones];
                                                            ds[idx].monto = e.target.value === '' ? '' : Number(e.target.value);
                                                            if (e.target.value !== '') ds[idx].porcentaje = '';
                                                            return { ...esc, deducciones: ds };
                                                        })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-all"
                                                    />
                                                    {ded.porcentaje !== '' && (
                                                        <div className="absolute -bottom-5 left-0 text-[9px] font-black text-violet-400 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-200">
                                                            = {symbol} {calculations?.deduccionesMonto[idx].toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => updateEscenario(esc => ({ ...esc, deducciones: [...esc.deducciones, { concepto: 'Nueva Deducción', porcentaje: '', monto: '', deduceAntesDeSala: true }] }))}
                                    className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    + Agregar Deducción
                                </button>
                            </div>
                        </section>

                        <section className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                <TrendingUp size={14} /> Gastos Estimados
                            </h3>
                            <div className="space-y-4">
                                {activeEscenario.gastos.map((gas, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={gas.concepto}
                                            onChange={e => updateEscenario(esc => {
                                                const gs = [...esc.gastos];
                                                gs[idx].concepto = e.target.value;
                                                return { ...esc, gastos: gs };
                                            })}
                                            className="flex-[2] bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500"
                                        />
                                        <input 
                                            type="number" 
                                            value={gas.monto}
                                            onChange={e => updateEscenario(esc => {
                                                const gs = [...esc.gastos];
                                                gs[idx].monto = e.target.value === '' ? '' : Number(e.target.value);
                                                return { ...esc, gastos: gs };
                                            })}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-violet-500"
                                        />
                                        <button 
                                            onClick={() => updateEscenario(esc => ({ ...esc, gastos: esc.gastos.filter((_, i) => i !== idx) }))}
                                            className="text-gray-600 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => updateEscenario(esc => ({ ...esc, gastos: [...esc.gastos, { concepto: 'Nuevo Gasto', monto: '' }] }))}
                                    className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    + Agregar Gasto
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* 3. Acuerdo Sala */}
                    <section className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Acuerdo con la Sala</h3>
                        <div className="flex flex-wrap gap-8">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Porcentaje Sala</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        value={activeEscenario.acuerdoPorcentaje}
                                        onChange={e => updateEscenario(esc => ({ ...esc, acuerdoPorcentaje: Number(e.target.value) }))}
                                        className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-lg font-black text-violet-400 outline-none focus:border-violet-500"
                                    />
                                    <span className="text-xl font-bold text-gray-600">%</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Se calcula sobre</label>
                                <div className="flex gap-2">
                                    {['Bruta', 'Neta'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => updateEscenario(esc => ({ ...esc, acuerdoSobre: opt as any }))}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeEscenario.acuerdoSobre === opt ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-violet-500/30 rounded-3xl p-8 sticky top-6 shadow-2xl shadow-black">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-violet-400 mb-8 flex items-center justify-between">
                            Resultado Proyectado
                            <FlaskConical size={16} />
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-gray-400 text-sm">
                                <span className="font-bold uppercase tracking-tight">Venta Total</span>
                                <span className="font-black">{symbol} {calculations?.ventaTotal.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <span>(-) Costo Tarjetas ({activeEscenario.costoTarjetaPorcentaje}%)</span>
                                <span>{symbol} {calculations?.costoTarjetas.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-violet-400/80 font-bold border-y border-white/5 py-2 my-2">
                                <span className="text-xs uppercase tracking-widest">Recaudación Bruta</span>
                                <span>{symbol} {calculations?.recaudacionBrutaReal.toLocaleString('es-AR')}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <span>(-) Deducciones</span>
                                <span>{symbol} {calculations?.totalDeducciones.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-violet-300 font-bold border-b border-white/5 pb-2">
                                <span className="text-xs uppercase tracking-widest">Recaudación Neta</span>
                                <span>{symbol} {calculations?.recaudacionNeta.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <span>(-) Comisión Sala ({activeEscenario.acuerdoPorcentaje}% sobre {activeEscenario.acuerdoSobre})</span>
                                <span>{symbol} {calculations?.montoAcuerdoSala.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-400 font-bold">
                                <span className="text-xs uppercase tracking-widest">Rtdo. Compañía</span>
                                <span>{symbol} {calculations?.resultadoCompania.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <span>(-) Gastos</span>
                                <span>{symbol} {calculations?.totalGastos.toLocaleString('es-AR')}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-400 font-bold border-t border-white/5 pt-2">
                                <span className="text-xs uppercase tracking-widest">Rtdo. Función</span>
                                <span>{symbol} {calculations?.resultadoAntesDeReparto.toLocaleString('es-AR')}</span>
                            </div>

                            {calculations?.repartosCalculados.map((rep, idx) => (
                                <div key={idx} className="flex justify-between items-start text-violet-400/60 text-[10px] font-bold uppercase tracking-widest">
                                    <div className="flex flex-col">
                                        <span>(-) Pago {rep.nombreArtista}</span>
                                        <span className="text-[8px] opacity-60">({rep.porcentaje}% sobre {rep.base})</span>
                                    </div>
                                    <span className="mt-0.5">{symbol} {rep.montoCalculado.toLocaleString('es-AR')}</span>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-white/10">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">Resultado HTH</span>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-4xl font-black tracking-tight ${calculations!.resultadoHTH >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {symbol} {calculations?.resultadoHTH.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    <span>Rentabilidad final</span>
                                    <span>{calculations!.ventaTotal > 0 ? ((calculations!.resultadoHTH / calculations!.ventaTotal) * 100).toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Break-Even Callout */}
                        <div className="mt-10 p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                                    <Target size={16} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-violet-300">Punto de Equilibrio</h4>
                                    <p className="text-[8px] text-violet-400/60 font-bold uppercase tracking-widest">Para cubrir costos</p>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <span className="text-xl font-black text-white">{calculations?.breakEvenTickets}</span>
                                    <span className="text-[10px] font-bold text-gray-500 ml-1 uppercase">Entradas</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{calculations?.breakEvenOccupation.toFixed(1)}% Ocupación</span>
                                </div>
                            </div>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-3 leading-relaxed">
                                * Se requieren vender al menos esta cantidad para que la productora no tenga pérdidas.
                            </p>
                        </div>
                    </div>

                    {/* Scenario Management */}
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                        <button 
                            onClick={() => {
                                if (confirm('¿Eliminar este escenario?')) deleteEscenarioMutation.mutate(activeEscenario.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-red-400 transition-all"
                        >
                            <Trash2 size={14} /> Eliminar Escenario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulacionDetalle;
