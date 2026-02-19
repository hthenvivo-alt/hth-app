import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { generateLiquidacionPDF } from '../utils/pdfGenerator';
import {
    ChevronLeft,
    Save,
    Printer,
    FileSpreadsheet,
    Plus,
    Trash2,
    Info,
    CheckCircle2,
    DollarSign,
    Percent,
    Ticket,
    Camera,
    Loader2,
    Edit3,
    FileText,
    Download,
    X,
    FileImage
} from 'lucide-react';
import { evaluateArithmetic, safeEvaluate } from '../utils/evaluate';

interface LiquidacionItem {
    id?: string;
    tipo: 'Deduccion' | 'Gasto';
    concepto: string;
    monto: number | string | '';
    porcentaje?: number | string | '';
}

interface Comprobante {
    id: string;
    nombreDocumento: string;
    linkDrive: string;
    created_at: string;
}

interface LiquidacionReparto {
    id?: string;
    nombreArtista: string;
    porcentaje: number | '';
    base: 'Bruta' | 'Neta' | 'Utilidad';
    monto: number | '';
    retencionAAA?: number;
    aplicaAAA: boolean;
}

const LiquidacionDetalle: React.FC = () => {
    const { funcionId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showComprobantesModal, setShowComprobantesModal] = useState(false);
    const [uploadingComprobantes, setUploadingComprobantes] = useState(false);

    // Data Fetching
    const { data: funcion, isLoading: loadingFuncion } = useQuery({
        queryKey: ['funcion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/funciones`);
            const data = Array.isArray(res.data) ? res.data : [];
            return data.find((f: any) => f.id === funcionId);
        }
    });

    const { data: existingLiquidacion, isLoading: loadingLiq } = useQuery({
        queryKey: ['liquidacion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/liquidacion/${funcionId}`);
            return res.data;
        }
    });

    const { data: gastosRegistrados } = useQuery({
        queryKey: ['gastos', 'funcion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/gastos/funcion/${funcionId}`);
            return res.data;
        },
        enabled: !!funcionId
    });

    const { data: lastExpenses } = useQuery({
        queryKey: ['lastExpenses', funcion?.obraId],
        queryFn: async () => {
            const res = await api.get(`/liquidacion/obra/${funcion?.obraId}/last-expenses`);
            return res.data;
        },
        enabled: !!funcion?.obraId && (!existingLiquidacion || !existingLiquidacion.items)
    });

    // Financial State
    const [facturacionTotal, setFacturacionTotal] = useState<number | string | ''>('');
    const [vendidas, setVendidas] = useState<number | string | ''>('');
    const [costosVenta, setCostosVenta] = useState<number | string | ''>('');
    const [acuerdoPorcentaje, setAcuerdoPorcentaje] = useState<number | string | ''>('');
    const [acuerdoSobre, setAcuerdoSobre] = useState<'Bruta' | 'Neta'>('Neta');
    const [repartos, setRepartos] = useState<LiquidacionReparto[]>([]);
    const [repartoProduccionPorcentaje, setRepartoProduccionPorcentaje] = useState<number | string | ''>(30);
    const [items, setItems] = useState<LiquidacionItem[]>([
        { tipo: 'Deduccion', concepto: 'Argentores', porcentaje: '', monto: '' },
        { tipo: 'Deduccion', concepto: 'Sadaic', porcentaje: '', monto: '' },
        { tipo: 'Deduccion', concepto: 'AADET', porcentaje: 0.2, monto: '' }
    ]);
    const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
    const [tipoCambio, setTipoCambio] = useState<number | string | ''>(1);
    const [impuestoTransferenciaPorcentaje, setImpuestoTransferenciaPorcentaje] = useState<number | string | ''>(1.2);
    const [bordereauxImage, setBordereauxImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isEditingOverride, setIsEditingOverride] = useState(false);

    // Initial Load Logic
    useEffect(() => {
        if (!funcion) return;

        // 1. Initial Defaults or Saved Data
        if (existingLiquidacion && existingLiquidacion.id) {
            // Priority 1: Saved Data (Confirmed or existing Draft with data)
            const brute = Number(existingLiquidacion.facturacionTotal) || 0;
            const sold = Number(funcion.vendidas) || 0; // vendidas is stored on funcion

            // Special case: If it's a draft and has 0 revenue, but the function has monitoreo data, we might want to suggest it
            // However, to keep it simple and reliable: if we have a saved liquidacion, take its values.
            // UNLESS it's a fresh draft (0 revenue) and the function has data.
            if (!existingLiquidacion.confirmada && brute === 0 && Number(funcion.ultimaFacturacionBruta) > 0) {
                setFacturacionTotal(Number(funcion.ultimaFacturacionBruta));
                setVendidas(Number(funcion.vendidas));
            } else {
                setFacturacionTotal(brute);
                setVendidas(sold);
            }

            setCostosVenta(Number(existingLiquidacion.costosVenta) || 0);
            setAcuerdoPorcentaje(Number(existingLiquidacion.acuerdoPorcentaje) || 0);
            setAcuerdoSobre(existingLiquidacion.acuerdoSobre);
            setRepartoProduccionPorcentaje(Number(existingLiquidacion.repartoProduccionPorcentaje) || 30);
            setMoneda(existingLiquidacion.moneda || 'ARS');
            setTipoCambio(Number(existingLiquidacion.tipoCambio) || 1);
            setImpuestoTransferenciaPorcentaje(existingLiquidacion.impuestoTransferenciaPorcentaje !== undefined ? Number(existingLiquidacion.impuestoTransferenciaPorcentaje) : 1.2);
            setBordereauxImage(existingLiquidacion.bordereauxImage);

            // Artist Payouts
            if (funcion?.obra?.artistaPayouts) {
                const obraPayouts = (funcion?.obra?.artistaPayouts || []).map((p: any) => {
                    const savedReparto = existingLiquidacion?.repartos?.find((r: any) => r.nombreArtista === p.nombre);
                    return {
                        nombreArtista: p.nombre,
                        porcentaje: Number(p.porcentaje),
                        base: p.base || 'Utilidad',
                        monto: 0,
                        retencionAAA: Number(savedReparto?.retencionAAA) || 0,
                        aplicaAAA: savedReparto ? savedReparto.aplicaAAA : true
                    };
                });
                setRepartos(obraPayouts);
            }

            // Items (Deductions/Expenses)
            const fetchedItems = Array.isArray(existingLiquidacion.items) ? existingLiquidacion.items.map((i: any) => ({
                ...i,
                porcentaje: i.tipo === 'Gasto' ? '' : (i.porcentaje ? Number(i.porcentaje) || 0 : ''),
                monto: Number(i.monto) || 0
            })) : [];

            // Cash Expenses Integration
            if (existingLiquidacion.gastosCajaSum > 0) {
                const hasGastosCaja = fetchedItems.some((i: any) => i.concepto === 'Gastos de Caja (Registro)');
                if (!hasGastosCaja) {
                    fetchedItems.push({ tipo: 'Gasto', concepto: 'Gastos de Caja (Registro)', porcentaje: '', monto: existingLiquidacion.gastosCajaSum });
                } else {
                    const idx = fetchedItems.findIndex((i: any) => i.concepto === 'Gastos de Caja (Registro)');
                    fetchedItems[idx].monto = existingLiquidacion.gastosCajaSum;
                }
            }
            setItems(fetchedItems);
        } else if (lastExpenses) {
            // Priority 2: New Settlement (Defaults from Obra and Function Monitoreo)
            setFacturacionTotal(Number(funcion.ultimaFacturacionBruta) || 0);
            setVendidas(Number(funcion.vendidas) || 0);

            if (funcion?.obra?.artistaPayouts) {
                setRepartos((funcion?.obra?.artistaPayouts || []).map((p: any) => ({
                    nombreArtista: p.nombre,
                    porcentaje: Number(p.porcentaje),
                    base: p.base || 'Utilidad',
                    monto: 0,
                    retencionAAA: 0,
                    aplicaAAA: true
                })));
            }

            const suggestedGastos = (lastExpenses || [])
                .filter((concepto: string) => concepto !== 'Gastos de Caja (Registro)')
                .map((concepto: string) => ({
                    tipo: 'Gasto',
                    concepto,
                    porcentaje: '',
                    monto: ''
                }));

            const initialDeductions = [
                { tipo: 'Deduccion', concepto: 'Argentores', porcentaje: 10, monto: '' },
                { tipo: 'Deduccion', concepto: 'AADET', porcentaje: 0.2, monto: '' }
            ];

            const finalItems = [...initialDeductions, ...suggestedGastos];
            setItems(finalItems);
        }
    }, [funcion, existingLiquidacion, lastExpenses]);

    // Calculations
    const valFacturacionTotal = safeEvaluate(facturacionTotal);
    const valCostosVenta = safeEvaluate(costosVenta);
    const valAcuerdoPorcentaje = safeEvaluate(acuerdoPorcentaje);
    const valRepartoProduccionPorcentaje = safeEvaluate(repartoProduccionPorcentaje);
    const isConfirmada = existingLiquidacion?.confirmada === true;
    const isReadOnly = isConfirmada && !isEditingOverride;

    const recaudacionBruta = valFacturacionTotal - valCostosVenta;

    // Recalculate items with percentages when gross revenue changes
    useEffect(() => {
        setItems(prev => prev.map(item => {
            if (item.tipo !== 'Gasto' && item.porcentaje !== null && item.porcentaje !== '' && item.porcentaje !== 0) {
                const calculatedMonto = (recaudacionBruta * safeEvaluate(item.porcentaje)) / 100;
                // Round to 2 decimals to avoid floating point issues
                const roundedMonto = Math.round(calculatedMonto * 100) / 100;

                if (item.monto !== roundedMonto) {
                    return { ...item, monto: roundedMonto };
                }
            }
            return item;
        }));
    }, [recaudacionBruta]);

    // Summary of deductions
    const totalDeducciones = items
        .filter(item => item.tipo === 'Deduccion')
        .reduce((acc, item) => acc + safeEvaluate(item.monto), 0);

    const recaudacionNeta = Math.round((recaudacionBruta - totalDeducciones) * 100) / 100;

    // Agreement with Hall
    const montoAcuerdo = Math.round((acuerdoSobre === 'Bruta'
        ? (recaudacionBruta * valAcuerdoPorcentaje) / 100
        : (recaudacionNeta * valAcuerdoPorcentaje) / 100) * 100) / 100;

    const resultadoCompania = Math.round((recaudacionNeta - montoAcuerdo) * 100) / 100;

    // Fixed 1.2% Transfer Tax (Editable)
    const valImpuestoTransferenciaPorcentaje = Number(impuestoTransferenciaPorcentaje) || 0;
    const impuestoTransferencias = Math.round(((resultadoCompania * valImpuestoTransferenciaPorcentaje) / 100) * 100) / 100;

    // Expenses
    const totalGastos = items
        .filter(item => item.tipo === 'Gasto')
        .reduce((acc, item) => acc + (Number(item.monto) || 0), 0);

    const rawResultadoFuncion = Math.round((resultadoCompania - totalGastos - impuestoTransferencias) * 100) / 100;
    const isRevenueOnly = repartos.length > 0 && !repartos.some(r => r.base === 'Utilidad');

    // Artists Split Calculation
    const calculatedRepartos = repartos.map(r => {
        let monto = 0;
        const p = Number(r.porcentaje) || 0;
        if (r.base === 'Bruta') monto = (recaudacionBruta * p) / 100;
        else if (r.base === 'Neta') monto = (recaudacionNeta * p) / 100;
        else if (r.base === 'Utilidad') monto = (rawResultadoFuncion * p) / 100;

        const roundedMonto = Math.round(monto * 100) / 100;
        // Strictly use manual retention value
        const retencionAAA = Number(r.retencionAAA) || 0;

        return { ...r, monto: roundedMonto, retencionAAA };
    });

    const totalRepartoArtistas = calculatedRepartos.reduce((acc, r) => acc + (Number(r.monto) || 0), 0);

    // Final Results (Economic result for HTH)
    const resultadoFuncion = Math.round((rawResultadoFuncion - totalRepartoArtistas) * 100) / 100;
    const repartoProduccionMonto = resultadoFuncion;

    const calcRepartoProduccionPorcentaje = rawResultadoFuncion > 0
        ? Math.round((repartoProduccionMonto / rawResultadoFuncion) * 100)
        : 0;

    // --- Analytical AAA Calculation (No Loops) ---
    // Calculates the converged value of AAA retention without relying on render cycles
    const expensesExcludingAAA = items.filter(i => i.tipo === 'Gasto' && i.concepto !== 'Aporte AAA (Productora)')
        .reduce((acc, i) => acc + (Number(i.monto) || 0), 0);

    const baseForUtilityAAA = resultadoCompania - expensesExcludingAAA - impuestoTransferencias;

    // 1. AAA from Fixed Bases (Bruta/Neta)
    const aaaFromFixed = repartos.reduce((acc, r) => {
        if (!r.aplicaAAA || r.base === 'Utilidad') return acc;
        let baseMonto = 0;
        if (r.base === 'Bruta') baseMonto = recaudacionBruta;
        else if (r.base === 'Neta') baseMonto = recaudacionNeta;

        const p = Number(r.porcentaje) || 0;
        const monto = (baseMonto * p) / 100;
        return acc + (monto * 0.06);
    }, 0);

    // 2. AAA from Utility (Analytical Solution: Total = (Fixed + K * Base) / (1 + K))
    const sumUtilityShares = repartos.reduce((acc, r) => {
        if (r.aplicaAAA && r.base === 'Utilidad') return acc + (Number(r.porcentaje) || 0) / 100;
        return acc;
    }, 0);

    const K = 0.06 * sumUtilityShares;
    const totalStableAAA = (aaaFromFixed + (K * baseForUtilityAAA)) / (1 + K);
    const roundedStableAAA = Math.max(0, Math.round(totalStableAAA * 100) / 100);

    // Auto-update "Aporte AAA (Productora)" expense with STABLE value
    // useEffect(() => {
    //     setItems(prev => {
    //         const hasAAA = prev.some(i => i.concepto === 'Aporte AAA (Productora)');
    //         const currentItem = prev.find(i => i.concepto === 'Aporte AAA (Productora)');
    //         const currentVal = currentItem ? Number(currentItem.monto) : 0;
    //
    //         if (roundedStableAAA > 0) {
    //             if (!hasAAA) {
    //                 return [...prev, { tipo: 'Gasto', concepto: 'Aporte AAA (Productora)', porcentaje: '', monto: roundedStableAAA }];
    //             } else if (Math.abs(currentVal - roundedStableAAA) > 0.05) {
    //                 return prev.map(i => i.concepto === 'Aporte AAA (Productora)' ? { ...i, monto: roundedStableAAA } : i);
    //             }
    //         } else if (hasAAA && Math.abs(currentVal) > 0.05) {
    //             return prev.filter(i => i.concepto !== 'Aporte AAA (Productora)');
    //         }
    //         return prev;
    //     });
    // }, [roundedStableAAA]);

    const symbol = moneda === 'ARS' ? '$' : 'U$D';

    const handleBordereauxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!existingLiquidacion) {
            alert('Primero debes guardar la liquidación (aunque sea como borrador) antes de subir el bordereaux.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('bordereaux', file);

        try {
            const res = await api.post(`/liquidacion/${funcionId}/upload-bordereaux`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBordereauxImage(res.data.bordereauxImage);
            alert('Bordereaux subido correctamente');
        } catch (error: any) {
            console.error('Error uploading bordereaux:', error);
            alert(error.response?.data?.error || 'Error al subir el bordereaux');
        } finally {
            setUploading(false);
        }
    };

    const { data: comprobantes, refetch: refetchComprobantes } = useQuery({
        queryKey: ['comprobantes', funcionId],
        queryFn: async () => {
            const res = await api.get(`/liquidacion/${funcionId}/comprobantes`);
            return res.data;
        },
        enabled: !!existingLiquidacion
    });

    const handleComprobantesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!existingLiquidacion) {
            alert('Primero debes guardar la liquidación (aunque sea como borrador) antes de subir comprobantes.');
            return;
        }

        setUploadingComprobantes(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('comprobantes', file);
        });

        try {
            await api.post(`/liquidacion/${funcionId}/comprobantes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            refetchComprobantes();
            alert('Comprobantes subidos correctamente');
        } catch (error) {
            console.error('Error uploading comprobantes:', error);
            alert('Error al subir los comprobantes');
        } finally {
            setUploadingComprobantes(false);
            // Reset input
            e.target.value = '';
        }
    };

    // Handlers
    const updateItem = (index: number, field: keyof LiquidacionItem, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'porcentaje') {
            item.porcentaje = value;
            const val = value === '' ? 0 : parseFloat(String(value).replace(',', '.'));
            if (!isNaN(val) && value !== '') {
                item.monto = (recaudacionBruta * val) / 100;
            }
        } else if (field === 'monto') {
            item.monto = value;
            // When an amount is entered directly, we clear the percentage so it doesn't show and doesn't auto-recalculate
            item.porcentaje = '';
        } else {
            (item as any)[field] = value;
        }

        setItems(newItems);
    };

    const addItem = (tipo: 'Deduccion' | 'Gasto') => {
        setItems([...items, { tipo, concepto: '', porcentaje: '', monto: '' }]);
        setTimeout(() => {
            const placeholder = tipo === 'Deduccion' ? 'Descripción' : 'Descripción del gasto';
            const inputs = document.querySelectorAll(`input[placeholder="${placeholder}"]`);
            const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
            if (lastInput) lastInput.focus();
        }, 0);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateReparto = (index: number, field: string, value: any) => {
        const newRepartos = [...repartos];
        newRepartos[index] = { ...newRepartos[index], [field]: value };
        setRepartos(newRepartos);
    };

    const saveMutation = useMutation({
        mutationFn: async (confirmada: boolean) => {
            await api.post(`/liquidacion/${funcionId}`, {
                facturacionTotal,
                vendidas,
                costosVenta,
                recaudacionBruta,
                recaudacionNeta,
                acuerdoPorcentaje,
                acuerdoSobre,
                resultadoCompania,
                impuestoTransferencias,
                resultadoFuncion,
                repartos: calculatedRepartos,
                repartoProduccionPorcentaje,
                repartoProduccionMonto,
                items,
                confirmada,
                moneda,
                tipoCambio,
                impuestoTransferenciaPorcentaje,
                bordereauxImage
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liquidacion', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funciones-liquidacion'] });
            navigate('/liquidacion');
        },
        onError: (error: any) => {
            console.error('Error saving liquidacion:', error);
            alert('Error al guardar la liquidación. Verifica los datos.');
        }
    });

    const handlePrint = () => {
        if (!funcion) return;

        const liqData = {
            moneda,
            tipoCambio: safeEvaluate(tipoCambio),
            facturacionTotal: safeEvaluate(facturacionTotal),
            vendidas: safeEvaluate(vendidas),
            costosVenta: safeEvaluate(costosVenta),
            recaudacionBruta,
            recaudacionNeta,
            acuerdoPorcentaje: safeEvaluate(acuerdoPorcentaje),
            acuerdoSobre,
            resultadoCompania,
            impuestoTransferencias,
            impuestoTransferenciaPorcentaje: safeEvaluate(impuestoTransferenciaPorcentaje),
            resultadoFuncion,
            repartos: calculatedRepartos,
            repartoProduccionPorcentaje: safeEvaluate(repartoProduccionPorcentaje),
            repartoProduccionMonto,
            items,
            bordereauxImage
        };

        const gastos = items.filter(i => i.tipo === 'Gasto');

        generateLiquidacionPDF(funcion, liqData, gastos, comprobantes || []);
    };

    if (loadingFuncion || loadingLiq) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
    );

    if (!funcion) return (
        <div className="p-8 text-center bg-[#121212] border border-white/5 rounded-2xl">
            <h2 className="text-xl font-bold text-red-500 mb-2">Función no encontrada</h2>
            <p className="text-gray-500 mb-4">No se pudo cargar la información de la función con ID: {funcionId}</p>
            <button onClick={() => navigate('/liquidacion')} className="text-primary-500 font-bold hover:underline">
                Volver a la lista
            </button>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto text-white pb-32">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/liquidacion')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary-500">Liquidación de Función</h2>
                        <h1 className="text-3xl font-bold">{funcion?.obra?.nombre}</h1>
                        <p className="text-gray-400">{funcion?.salaNombre} — {new Date(funcion?.fecha).toLocaleDateString()}</p>
                    </div>
                </div>
                {/* PDF Button */}
                <div className="flex gap-2">
                    <input
                        type="file"
                        id="bordereaux-upload"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleBordereauxUpload}
                        disabled={uploading}
                    />
                    <button
                        onClick={() => document.getElementById('bordereaux-upload')?.click()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-bold text-sm border shadow-lg ${bordereauxImage
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20 shadow-green-500/5'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/10 shadow-white/5'
                            }`}
                        title={bordereauxImage ? "Cambiar Bordereaux" : "Adjuntar Bordereaux"}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : bordereauxImage?.toLowerCase().endsWith('.pdf') ? (
                            <FileText size={18} />
                        ) : (
                            <FileImage size={18} />
                        )}
                        <span>{bordereauxImage ? (bordereauxImage.toLowerCase().endsWith('.pdf') ? 'PDF Adjunto' : 'Imagen Adjunta') : 'Adjuntar Bordereaux'}</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm border border-white/10 shadow-lg shadow-white/5"
                        title="Exportar PDF"
                    >
                        <Download size={18} />
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Income & Deductions */}
                <div className="space-y-8">
                    {/* 1. Ingresos */}
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Ticket size={20} className="text-green-500" /> Ingresos
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Entradas Vendidas</label>
                                    <input
                                        type="text"
                                        value={vendidas}
                                        onChange={(e) => setVendidas(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const res = evaluateArithmetic(String(vendidas));
                                                if (res !== null) setVendidas(res);
                                            }
                                        }}
                                        onBlur={() => {
                                            const res = evaluateArithmetic(String(vendidas));
                                            if (res !== null) setVendidas(res);
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Costo Tarjetas / Venta</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            type="text"
                                            value={costosVenta}
                                            onChange={(e) => setCostosVenta(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const res = evaluateArithmetic(String(costosVenta));
                                                    if (res !== null) setCostosVenta(res);
                                                }
                                            }}
                                            onBlur={() => {
                                                const res = evaluateArithmetic(String(costosVenta));
                                                if (res !== null) setCostosVenta(res);
                                            }}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-4 py-2 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Venta Total Bruta</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="text"
                                        value={facturacionTotal}
                                        onChange={(e) => setFacturacionTotal(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const res = evaluateArithmetic(String(facturacionTotal));
                                                if (res !== null) setFacturacionTotal(res);
                                            }
                                        }}
                                        onBlur={() => {
                                            const res = evaluateArithmetic(String(facturacionTotal));
                                            if (res !== null) setFacturacionTotal(res);
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-4 py-2 focus:border-primary-500 outline-none font-mono text-lg"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center font-bold text-lg text-green-400">
                                <span>Recaudación Bruta</span>
                                <span>{symbol} {recaudacionBruta.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Costos y Deducciones */}
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText size={20} className="text-red-400" /> Deducciones de Sala
                            </h3>
                            <button
                                onClick={() => addItem('Deduccion')}
                                className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors uppercase font-black tracking-widest text-gray-400 hover:text-white"
                            >
                                + Agregar Deducción
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Dynamic Deductions */}
                            <div className="space-y-3">
                                {items.map((item, idx) => {
                                    if (item.tipo !== 'Deduccion') return null;
                                    return (
                                        <div key={idx} className="flex gap-3 items-center group">
                                            <button
                                                onClick={() => removeItem(idx)}
                                                className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <input
                                                type="text"
                                                className="flex-1 bg-transparent border-b border-white/5 focus:border-primary-500 outline-none py-1 text-sm font-medium"
                                                value={item.concepto}
                                                onChange={(e) => updateItem(idx, 'concepto', e.target.value)}
                                                placeholder="Descripción"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <span className="absolute right-2 top-1.5 text-gray-600 text-[10px]">%</span>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-xs outline-none focus:border-primary-500 pr-5"
                                                        value={item.porcentaje}
                                                        onChange={(e) => updateItem(idx, 'porcentaje', e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const res = evaluateArithmetic(String(item.porcentaje));
                                                                if (res !== null) updateItem(idx, 'porcentaje', res);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            const res = evaluateArithmetic(String(item.porcentaje));
                                                            if (res !== null) updateItem(idx, 'porcentaje', res);
                                                        }}
                                                    />
                                                </div>
                                                <div className="relative w-28">
                                                    <span className="absolute left-2 top-1.5 text-gray-600 text-[10px]">$</span>
                                                    <input
                                                        type="text"
                                                        placeholder="0.00"
                                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-xs pl-5 outline-none focus:border-primary-500 font-mono"
                                                        value={item.monto}
                                                        onChange={(e) => updateItem(idx, 'monto', e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const res = evaluateArithmetic(String(item.monto));
                                                                if (res !== null) updateItem(idx, 'monto', res);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            const res = evaluateArithmetic(String(item.monto));
                                                            if (res !== null) updateItem(idx, 'monto', res);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-white/5 pt-4 mt-4 space-y-2">
                                <div className="flex justify-between items-center font-bold text-lg text-primary-400">
                                    <span>Recaudación Neta</span>
                                    <span>{symbol} {recaudacionNeta.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Expenses & Result */}
                <div className="space-y-8">
                    {/* 3. Acuerdo & Company Result */}
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Acuerdo Sala</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={acuerdoPorcentaje}
                                    onChange={(e) => setAcuerdoPorcentaje(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const res = evaluateArithmetic(String(acuerdoPorcentaje));
                                            if (res !== null) setAcuerdoPorcentaje(res);
                                        }
                                    }}
                                    onBlur={() => {
                                        const res = evaluateArithmetic(String(acuerdoPorcentaje));
                                        if (res !== null) setAcuerdoPorcentaje(res);
                                    }}
                                    className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-xs outline-none focus:border-primary-500"
                                />
                                <span className="text-gray-500">% sobre</span>
                                <select
                                    value={acuerdoSobre}
                                    onChange={(e) => setAcuerdoSobre(e.target.value as any)}
                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm"
                                >
                                    <option value="Bruta">Bruta</option>
                                    <option value="Neta">Neta</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 mb-2">
                            <span>Monto Sala</span>
                            <span>{symbol} {montoAcuerdo.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-400">Compañía HTH</span>
                            <span>{symbol} {resultadoCompania.toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    {/* 4. Gastos Compañía */}
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} className="text-yellow-500" /> Gastos Función
                            </h3>
                            <button onClick={() => addItem('Gasto')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                                + Agregar Gasto
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.filter(i => i.tipo === 'Gasto').map((item, idx) => {
                                const realIdx = items.indexOf(item);
                                return (
                                    <div key={idx} className="flex gap-2 items-center group">
                                        <button onClick={() => removeItem(realIdx)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Descripción del gasto"
                                            className="flex-1 bg-transparent border-b border-white/10 focus:border-primary-500 outline-none py-1 text-sm"
                                            value={item.concepto}
                                            onChange={(e) => updateItem(realIdx, 'concepto', e.target.value)}
                                        />
                                        <div className="relative w-28">
                                            <span className="absolute left-0 top-1 text-gray-600 text-xs">$</span>
                                            <input
                                                type="text"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-primary-500 outline-none py-1 text-right text-sm pl-4"
                                                value={item.monto}
                                                onChange={(e) => updateItem(realIdx, 'monto', e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const res = evaluateArithmetic(String(item.monto));
                                                        if (res !== null) updateItem(realIdx, 'monto', res);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const res = evaluateArithmetic(String(item.monto));
                                                    if (res !== null) updateItem(realIdx, 'monto', res);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded text-sm text-gray-400">
                                <span>Impuesto Transferencias ({impuestoTransferenciaPorcentaje}%)</span>
                                <span>{symbol} {impuestoTransferencias.toLocaleString('es-AR')}</span>
                            </div>
                        </div>

                    </div>

                    {/* 5. Repartos */}
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{isRevenueOnly ? 'Porcentaje Artistas' : 'Reparto de Utilidades'}</h3>
                            {!isRevenueOnly && (
                                <div className="text-right">
                                    <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Resultado a Repartir</span>
                                    <span className="text-2xl font-black text-white">{symbol} {rawResultadoFuncion.toLocaleString('es-AR')}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            {calculatedRepartos.map((reparto, idx) => (
                                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white uppercase tracking-tight">{reparto.nombreArtista}</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">{reparto.porcentaje}% sobre {reparto.base}</span>
                                        </div>
                                        <span className="font-black text-white">{symbol} {reparto.monto.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Retención AAA</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">$</span>
                                            <input
                                                type="text"
                                                value={reparto.retencionAAA || ''}
                                                onChange={(e) => updateReparto(idx, 'retencionAAA', e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const res = evaluateArithmetic(String(reparto.retencionAAA));
                                                        if (res !== null) updateReparto(idx, 'retencionAAA', res);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    const res = evaluateArithmetic(String(reparto.retencionAAA));
                                                    if (res !== null) updateReparto(idx, 'retencionAAA', res);
                                                }}
                                                placeholder="0.00"
                                                className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-xs font-bold text-red-400 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary-400">
                                        <span>Saldo Neto</span>
                                        <span>{symbol} {(reparto.monto - safeEvaluate(reparto.retencionAAA)).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            ))}

                            {/* HTH Result Visualization */}
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white uppercase tracking-tight">HTH PRODUCCIÓN / GESTIÓN</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">{calcRepartoProduccionPorcentaje}% sobre Utilidad</span>
                                    </div>
                                    <span className="font-black text-white">{symbol} {repartoProduccionMonto.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#121212] border-t border-white/10 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="text-xs text-gray-500 hidden md:block">
                        {existingLiquidacion ? (
                            <span>Última modificación: {new Date(existingLiquidacion.updatedAt || Date.now()).toLocaleString('es-AR')}</span>
                        ) : 'Borrador no guardado'}
                    </div>
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
                            title="Exportar PDF"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={() => saveMutation.mutate(false)}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors flex items-center gap-2"
                            disabled={saveMutation.isPending}
                        >
                            <Save size={18} />
                            <span className="hidden sm:inline">Guardar Borrador</span>
                            <span className="inline sm:hidden">Guardar</span>
                        </button>
                        <button
                            onClick={() => saveMutation.mutate(true)}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary-900/20"
                            disabled={saveMutation.isPending}
                        >
                            {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                            <span className="hidden sm:inline">Finalizar Liquidación</span>
                            <span className="inline sm:hidden">Finalizar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiquidacionDetalle;
