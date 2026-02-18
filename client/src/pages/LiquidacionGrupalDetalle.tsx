import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    ArrowLeft,
    Calendar,
    Download,
    Info,
    Plus,
    Trash2,
    CheckCircle2,
    FileText,
    TrendingUp,
    Users,
    Layers,
    Loader2,
    Save
} from 'lucide-react';
import { generateBatchLiquidacionPDF } from '../utils/pdfGenerator';
import { evaluateArithmetic, safeEvaluate } from '../utils/evaluate';
import { formatDate } from '../utils/dateUtils';

interface Item {
    id?: string;
    tipo: 'Deduccion' | 'Gasto';
    concepto: string;
    monto: number | string | '';
    porcentaje?: number | string | '';
    isGroupLevel?: boolean;
}

interface Reparto {
    nombreArtista: string;
    monto: number;
    retencionAAA: number;
    porcentaje: number;
    base: string;
}

const LiquidacionGrupalDetalle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [items, setItems] = React.useState<Item[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);

    const { data: grupal, isLoading } = useQuery({
        queryKey: ['liquidacion-grupal', id],
        queryFn: async () => {
            const res = await api.get(`/liquidacion/grupal/${id}`);
            return res.data;
        }
    });


    // Unified Save Mutation
    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            await api.put(`/liquidacion/grupal/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liquidacion-grupal', id] });
            setIsSaving(false);
        },
        onError: () => {
            setIsSaving(false);
            alert('Error al guardar la liquidación');
        }
    });


    // Initialize state when data loads
    React.useEffect(() => {
        if (grupal) {
            if (grupal.items && grupal.items.length > 0) {
                setItems(grupal.items.map((i: any) => ({
                    ...i,
                    monto: Number(i.monto),
                    porcentaje: i.porcentaje ? Number(i.porcentaje) : ''
                })));
            } else {
                // Default deductions if none exist
                setItems([
                    { tipo: 'Deduccion', concepto: 'Argentores', porcentaje: '', monto: '' },
                    { tipo: 'Deduccion', concepto: 'Sadaic', porcentaje: '', monto: '' },
                    { tipo: 'Deduccion', concepto: 'AADET', porcentaje: 0.2, monto: '' }
                ]);
            }
        }
    }, [grupal]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
            </div>
        );
    }

    if (!grupal) return <div>No se encontró la liquidación.</div>;

    // --- 1. CONSOLIDATED CALCULATIONS (Safe because grupal is loaded) ---

    // Derived Totals for calculation
    const totalEntradasVendidas = (grupal.liquidaciones || []).reduce((acc: number, l: any) => acc + (Number(l.funcion.vendidas) || 0), 0);
    const totalCostosVenta = (grupal.liquidaciones || []).reduce((acc: number, l: any) => acc + (Number(l.costosVenta) || 0), 0);
    const totalFacturacion = (grupal.liquidaciones || []).reduce((acc: number, l: any) => acc + (Number(l.facturacionTotal) || 0), 0);

    // CRITICAL: Force calculation to be (Venta - Tarjeta) to fix cases where DB field is wrong
    const totalRecaudacionBrutaReal = totalFacturacion - totalCostosVenta;

    const S = '$';

    // Consolidate Repartos (Artists) - We gather individual show data first
    const artistData: Record<string, {
        nombreArtista: string;
        sumMonto: number;
        sumRetencion: number;
        porcentaje: number;
        base: string;
        sumBaseIndividual: number;
    }> = {};

    (grupal.liquidaciones || []).forEach((l: any) => {
        l.repartos.forEach((r: any) => {
            const artistKey = r.nombreArtista.trim().toUpperCase();
            if (!artistData[artistKey]) {
                artistData[artistKey] = {
                    nombreArtista: r.nombreArtista,
                    sumMonto: 0,
                    sumRetencion: 0,
                    porcentaje: Number(r.porcentaje),
                    base: r.base,
                    sumBaseIndividual: 0
                };
            }
            const data = artistData[artistKey];
            data.sumMonto += Number(r.monto);
            data.sumRetencion += Number(r.retencionAAA || 0);

            // Track the base value used in each individual show
            if (r.base === 'Bruta') data.sumBaseIndividual += (Number(l.facturacionTotal) - Number(l.costosVenta));
            else if (r.base === 'Neta') data.sumBaseIndividual += Number(l.recaudacionNeta);
            else if (r.base === 'Utilidad') {
                // Individual show utility before artist payout
                const showUtility = (Number(l.repartoProduccionMonto) || Number(l.resultadoFuncion) || 0) +
                    l.repartos.filter((xr: any) => xr.nombreArtista === r.nombreArtista).reduce((acc: number, xr: any) => acc + Number(xr.monto), 0);
                data.sumBaseIndividual += showUtility;
            }
        });
    });

    // Consolidate Items (Deductions and Expenses)
    const groupedDeductions: Record<string, Item> = {};
    const individualExpensesByDate: Record<string, Item> = {};
    let totalDeduccionesConsolidadas = 0;
    let totalGastosShowConsolidados = 0;

    (grupal.liquidaciones || []).forEach((l: any) => {
        const dateStr = formatDate(l.funcion.fecha);

        if (!individualExpensesByDate[dateStr]) {
            individualExpensesByDate[dateStr] = {
                tipo: 'Gasto',
                concepto: `Gastos Función ${dateStr}`,
                monto: 0,
                isGroupLevel: false
            };
        }

        // 1. Accumulate Expenses (Taxes + Cash Registered)
        const funcExpensesTotal = (Number(l.impuestoTransferencias) || 0) + (Number(l.gastosCajaSum) || 0);
        individualExpensesByDate[dateStr].monto = (Number(individualExpensesByDate[dateStr].monto) || 0) + funcExpensesTotal;
        totalGastosShowConsolidados += funcExpensesTotal;

        l.items.forEach((i: any) => {
            const monto = Number(i.monto) || 0;
            if (i.tipo === 'Deduccion') {
                const key = i.concepto.trim().toUpperCase();
                if (!groupedDeductions[key]) {
                    groupedDeductions[key] = {
                        tipo: 'Deduccion',
                        concepto: i.concepto,
                        monto: 0,
                        isGroupLevel: false
                    };
                }
                groupedDeductions[key].monto = (Number(groupedDeductions[key].monto) || 0) + monto;
                totalDeduccionesConsolidadas += monto;
            } else {
                // Skip the summary item if we are already using l.gastosCajaSum
                if (i.concepto === 'Gastos de Caja (Registro)') return;

                individualExpensesByDate[dateStr].monto = (Number(individualExpensesByDate[dateStr].monto) || 0) + monto;
                totalGastosShowConsolidados += monto;
            }
        });
    });

    const expensesList = Object.values(individualExpensesByDate).filter(e => Number(e.monto) > 0);
    const individualItems = [...Object.values(groupedDeductions), ...expensesList];

    const totalGastosGrupo = items.filter(i => i.tipo === 'Gasto').reduce((acc, i) => acc + safeEvaluate(i.monto), 0);
    const totalDeduccionesGrupo = items.filter(i => i.tipo === 'Deduccion').reduce((acc, i) => acc + safeEvaluate(i.monto), 0);

    const totalRecaudacionNetaReal = totalRecaudacionBrutaReal - (totalDeduccionesConsolidadas + totalDeduccionesGrupo);

    const totalMontoSalaReal = (grupal.liquidaciones || []).reduce((acc: number, l: any) => {
        return acc + (Number(l.recaudacionNeta) - Number(l.resultadoCompania));
    }, 0);

    const totalResultadoHthBruto = totalRecaudacionNetaReal - totalMontoSalaReal;
    const utilidadAntesDeArtistas = totalResultadoHthBruto - totalGastosShowConsolidados - totalGastosGrupo;

    // --- RECALCULATE CONSOLIDATED REPARTOS REACTIVELY ---
    const consolidatedRepartos: Record<string, Reparto> = {};
    Object.keys(artistData).forEach(key => {
        const data = artistData[key];
        let montoRecalculado = data.sumMonto;
        let retencionRecalculada = data.sumRetencion;

        if (data.base !== 'Fijo' && data.sumBaseIndividual > 0) {
            const effectivePercent = data.sumMonto / data.sumBaseIndividual;
            let groupBase = 0;
            if (data.base === 'Bruta') groupBase = totalRecaudacionBrutaReal;
            else if (data.base === 'Neta') groupBase = totalRecaudacionNetaReal;
            else if (data.base === 'Utilidad') groupBase = utilidadAntesDeArtistas;

            if (groupBase !== 0 || data.base === 'Utilidad') {
                montoRecalculado = groupBase * effectivePercent;
                // Proportional AAA retention
                if (data.sumMonto > 0) {
                    retencionRecalculada = montoRecalculado * (data.sumRetencion / data.sumMonto);
                }
            }
        }

        consolidatedRepartos[key] = {
            nombreArtista: data.nombreArtista,
            monto: montoRecalculado,
            retencionAAA: retencionRecalculada,
            porcentaje: data.porcentaje,
            base: data.base
        };
    });

    const totalRepartosMonto = Object.values(consolidatedRepartos).reduce((acc, r) => acc + r.monto, 0);

    const finalBalanceReal = utilidadAntesDeArtistas - totalRepartosMonto;

    const allItems = [...individualItems, ...items];
    const totalResultadoCompaniaReal = (grupal.liquidaciones || []).reduce((acc: number, l: any) => acc + (Number(l.resultadoCompania) || 0), 0);
    const totalResultadoFunciones = (grupal.liquidaciones || []).reduce((acc: number, l: any) => acc + (Number(l.repartoProduccionMonto) || Number(l.resultadoFuncion) || 0), 0);
    const totalHthProductora = finalBalanceReal;

    // --- 2. HANDLERS AND HELPERS ---

    const recaudacionBruta = totalRecaudacionBrutaReal;

    const handlePrint = () => {
        generateBatchLiquidacionPDF({
            grupal: {
                ...grupal,
                totalFacturacion,
                totalRecaudacionBruta: totalRecaudacionBrutaReal,
                totalRecaudacionNeta: totalRecaudacionNetaReal,
                totalResultadoFunciones,
                totalHthProductora,
                finalBalance: finalBalanceReal,
                allItems,
                consolidatedRepartos: Object.values(consolidatedRepartos)
            }
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        saveMutation.mutate({
            facturacionTotal: totalFacturacion,
            recaudacionBruta: totalRecaudacionBrutaReal,
            recaudacionNeta: totalRecaudacionNetaReal,
            costosVenta: totalCostosVenta,
            costosVentaPorcentaje: 0,
            acuerdoPorcentaje: 0,
            acuerdoSobre: 'Neta',
            items: items.map(i => ({
                tipo: i.tipo,
                concepto: i.concepto,
                porcentaje: i.porcentaje === '' ? null : Number(i.porcentaje),
                monto: Number(i.monto) || 0
            })),
            confirmada: grupal.confirmada
        });
    };

    const updateItem = (index: number, field: keyof Item, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'porcentaje') {
            item.porcentaje = value;
            const val = safeEvaluate(value);
            if (val !== 0 || value !== '') {
                item.monto = Math.round((recaudacionBruta * val / 100) * 100) / 100;
            }
        } else if (field === 'monto') {
            item.monto = value;
            item.porcentaje = '';
        } else {
            (item as any)[field] = value;
        }

        setItems(newItems);
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/liquidacion')}
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Layers size={14} className="text-primary-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-500/80">Liquidación Grupal</span>
                            </div>
                            <h1 className="text-xl font-black tracking-tight text-white uppercase">{grupal.nombre}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                            <Download size={16} />
                            Reporte
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSaving
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
                                : 'bg-transparent border border-white text-yellow-400 hover:bg-white/5 shadow-lg shadow-yellow-400/20'
                                }`}
                        >
                            <CheckCircle2 size={16} />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-10 space-y-12">
                {/* 1. Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#121212] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10 text-center md:text-left">
                            <div className="flex justify-center md:justify-start items-center gap-3 text-primary-500 font-black uppercase tracking-widest text-xs mb-4">
                                <TrendingUp size={20} />
                                <span>Recaudación Bruta Total</span>
                            </div>
                            <div className="flex items-baseline justify-center md:justify-start gap-2">
                                <span className="text-3xl font-black text-white">$</span>
                                <span className="text-6xl font-black text-white tracking-tighter">
                                    {totalRecaudacionBrutaReal.toLocaleString('es-AR')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#121212] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10 text-center md:text-left">
                            <div className="flex justify-center md:justify-start items-center gap-3 text-primary-500 font-black uppercase tracking-widest text-xs mb-4">
                                <Users size={20} />
                                <span>Total Entradas Vendidas</span>
                            </div>
                            <div className="flex items-baseline justify-center md:justify-start gap-2">
                                <span className="text-6xl font-black text-white tracking-tighter">
                                    {totalEntradasVendidas.toLocaleString('es-AR')}
                                </span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Ticket(s)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Functions List (Expanded) */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar size={20} className="text-gray-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Funciones Incluidas</h2>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5">Fecha / Obra</th>
                                    <th className="px-8 py-5">Lugar</th>
                                    <th className="px-8 py-5 text-right">Entradas</th>
                                    <th className="px-8 py-5 text-right">Venta Total</th>
                                    <th className="px-8 py-5 text-right">Desc. Tarjeta</th>
                                    <th className="px-8 py-5 text-right">Recau. Bruta</th>
                                    <th className="px-8 py-5 text-right">Compañía</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...(grupal.liquidaciones || [])]
                                    .sort((a, b) => new Date(a.funcion.fecha).getTime() - new Date(b.funcion.fecha).getTime())
                                    .map((l: any) => {
                                        const derivedRecaudacionBruta = (Number(l.facturacionTotal) || 0) - (Number(l.costosVenta) || 0);
                                        return (
                                            <tr key={l.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/liquidacion/${l.funcion.id}`)}>
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-white group-hover:text-primary-400 transition-colors uppercase text-base tracking-tight">{l.funcion.obra.nombre}</div>
                                                    <div className="text-xs text-gray-600 font-bold uppercase mt-1.5">{formatDate(l.funcion.fecha)}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm text-gray-400 font-bold uppercase">{l.funcion.ciudad}</div>
                                                    <div className="text-xs text-gray-600 font-bold uppercase mt-1">{l.funcion.salaNombre}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-base font-black text-white">{l.funcion.vendidas || 0}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-base font-black text-white">{S} {Number(l.facturacionTotal).toLocaleString('es-AR')}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-base font-black text-red-500">{S} {Number(l.costosVenta).toLocaleString('es-AR')}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-base font-black text-white">{S} {derivedRecaudacionBruta.toLocaleString('es-AR')}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-base font-black text-green-500">{S} {Number(l.resultadoCompania).toLocaleString('es-AR')}</div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                            <tfoot className="bg-white/5 border-t border-white/10">
                                <tr className="font-black text-white text-sm uppercase tracking-widest">
                                    <td className="px-8 py-6" colSpan={2}>Totales Consolidados</td>
                                    <td className="px-8 py-6 text-right">{totalEntradasVendidas.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-6 text-right">{S} {totalFacturacion.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-6 text-right text-red-500">{S} {totalCostosVenta.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-6 text-right">{S} {totalRecaudacionBrutaReal.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-6 text-right text-green-500">{S} {totalResultadoCompaniaReal.toLocaleString('es-AR')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* 3. Settlement Box (Moved from Sidebar, Expanded Layout) */}
                <section className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                    <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Info size={20} className="text-primary-500" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Liquidación Interactiva</h2>
                        </div>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Calculation Details */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white/5 px-6 py-5 rounded-2xl border border-white/5">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Recaudación Bruta (Suma)</span>
                                    <span className="text-xl font-black text-white">{S} {totalRecaudacionBrutaReal.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="flex justify-between items-center px-6">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">(-) Deducciones Consolidadas</span>
                                    <span className="text-xl font-black text-red-500">- {S} {totalDeduccionesConsolidadas.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="h-px bg-white/5 mx-6" />

                                <div className="flex justify-between items-center bg-white/5 px-6 py-5 rounded-2xl border border-white/10">
                                    <span className="text-xs font-black text-primary-500 uppercase tracking-widest">Recaudación Neta Total</span>
                                    <span className="text-xl font-black text-white">{S} {totalRecaudacionNetaReal.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="flex justify-between items-center px-6">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">(-) Acuerdo Sala (Suma)</span>
                                    <span className="text-xl font-black text-red-500">- {S} {totalMontoSalaReal.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="flex justify-between items-center bg-white/5 px-6 py-5 rounded-2xl border border-white/10">
                                    <span className="text-xs font-black text-primary-500 uppercase tracking-widest">Ingreso de Compañía</span>
                                    <span className="text-xl font-black text-white italic">{S} {totalResultadoHthBruto.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="flex justify-between items-center px-6">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">(-) Gastos y Impuestos (Funciones)</span>
                                    <span className="text-xl font-black text-red-500">- {S} {totalGastosShowConsolidados.toLocaleString('es-AR')}</span>
                                </div>

                                {(totalGastosGrupo > 0 || totalDeduccionesGrupo > 0) && (
                                    <div className="flex justify-between items-center px-6">
                                        <span className="text-xs font-black text-primary-500 uppercase tracking-widest">(-) Gastos del Período (Ajustes)</span>
                                        <span className="text-xl font-black text-red-500">- {S} {(totalGastosGrupo + totalDeduccionesGrupo).toLocaleString('es-AR')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Artist Breakdown & Final Result */}
                            <div className="flex flex-col justify-between space-y-8">
                                {Object.keys(consolidatedRepartos).length > 0 && (
                                    <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-5">
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Reparto Consolidado Artistas</div>
                                        {Object.values(consolidatedRepartos).map((r, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-white/5 last:border-0 pb-4 last:pb-0">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white uppercase">{r.nombreArtista}</span>
                                                    <span className="text-xs text-gray-500 italic">s/ {r.base}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xl font-black text-white">{S} {Math.round(r.monto).toLocaleString('es-AR')}</span>
                                                    {r.retencionAAA > 0 && <span className="text-xs text-red-500 font-bold">AAA: -{S}{Math.round(r.retencionAAA).toLocaleString('es-AR')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-primary-500/10 border-2 border-primary-500/30 p-10 rounded-[2rem] text-center space-y-4 shadow-2xl relative">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-black px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Saldo Final
                                    </div>
                                    <div className="text-sm font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Resultado Neto HTH</div>
                                    <div className="text-7xl font-black text-white tracking-tighter">
                                        {S} {finalBalanceReal.toLocaleString('es-AR')}
                                    </div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] pt-4">
                                        Utilidad Neta del Grupo de Funciones
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Group Expenses Editor */}
                <section>
                    <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <Plus size={20} className="text-gray-500" />
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Gastos y Ajustes del Período</h3>
                            </div>
                            <button
                                onClick={() => setItems([...items, { tipo: 'Gasto', concepto: '', monto: '', isGroupLevel: true }])}
                                className="px-5 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 rounded-xl text-primary-400 transition-all border border-primary-500/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                            >
                                <Plus size={16} />
                                Agregar Item
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.filter(i => i.tipo === 'Gasto').map((item, idx) => {
                                const actualIdx = items.indexOf(item);
                                return (
                                    <div key={idx} className="flex gap-4 items-center bg-white/5 p-5 rounded-2xl group border border-white/5 hover:border-white/10 transition-all">
                                        <input
                                            type="text"
                                            value={item.concepto}
                                            onChange={(e) => updateItem(actualIdx, 'concepto', e.target.value)}
                                            placeholder="Descripción"
                                            className="flex-1 bg-transparent border-none text-xs font-black text-white p-0 uppercase focus:ring-0 placeholder:text-gray-700"
                                        />
                                        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                                            <span className="text-xs text-gray-600 font-bold">$</span>
                                            <input
                                                type="text"
                                                value={item.monto}
                                                onChange={(e) => updateItem(actualIdx, 'monto', e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const result = evaluateArithmetic(String(item.monto));
                                                        if (result !== null) updateItem(actualIdx, 'monto', result);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const result = evaluateArithmetic(String(item.monto));
                                                    if (result !== null) updateItem(actualIdx, 'monto', result);
                                                }}
                                                className="w-24 bg-transparent border-none text-right text-sm font-black text-white p-0 focus:ring-0"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setItems(items.filter((_, i) => i !== actualIdx))}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 5. Desglose General (At the Bottom) */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <FileText size={20} className="text-gray-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Desglose de Gastos Acumulados</h2>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden p-10 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {individualItems.length > 0 && (
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">Ítems de Funciones</div>
                                    <div className="space-y-3">
                                        {individualItems.map((item, idx) => (
                                            <div key={`ind-${idx}`} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                                <div className="text-xs font-black text-white uppercase">{item.concepto}</div>
                                                <div className={`text-sm font-black ${item.tipo === 'Deduccion' ? 'text-red-400' : 'text-primary-500'}`}>
                                                    {item.tipo === 'Deduccion' ? '-' : ''} {S} {Number(item.monto).toLocaleString('es-AR')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(totalGastosGrupo > 0 || totalDeduccionesGrupo > 0) && (
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-6">Ajustes Globales</div>
                                    <div className="space-y-3">
                                        {totalGastosGrupo > 0 && (
                                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                <div className="text-xs font-black text-white uppercase">Gastos del Período</div>
                                                <div className="text-sm font-black text-red-500">- {S} {totalGastosGrupo.toLocaleString('es-AR')}</div>
                                            </div>
                                        )}
                                        {totalDeduccionesGrupo > 0 && (
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs font-black text-white uppercase">Deducciones del Período</div>
                                                <div className="text-sm font-black text-red-500">- {S} {totalDeduccionesGrupo.toLocaleString('es-AR')}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {allItems.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-700 text-xs uppercase font-black tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                                    Sin movimientos adicionales
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LiquidacionGrupalDetalle;
