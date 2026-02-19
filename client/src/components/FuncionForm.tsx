import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface FuncionFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const FuncionForm: React.FC<FuncionFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        obraId: '',
        salaNombre: '',
        salaDireccion: '',
        ciudad: '',
        pais: 'Argentina',
        capacidadSala: '',
        precioEntradaBase: '',
        linkVentaTicketera: '',
        userVentaTicketera: '',
        passVentaTicketera: '',
        linkMonitoreoVenta: '',
        notasProduccion: '',
    });

    const [fechas, setFechas] = useState<{ date: string, time: string }[]>(() => {
        const now = new Date();
        return [{
            date: now.toISOString().split('T')[0],
            time: '21:00'
        }];
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { data: obras } = useQuery({
        queryKey: ['obras'],
        queryFn: async () => {
            const res = await api.get('/obras');
            return res.data;
        }
    });

    const { data: allFunciones } = useQuery({
        queryKey: ['all-funciones'],
        queryFn: async () => {
            const res = await api.get('/funciones');
            return res.data;
        }
    });

    // Extract unique cities and salas for suggestions
    const uniqueCities = Array.from(new Set(allFunciones?.map((f: any) => f.ciudad))).filter(Boolean).sort();
    const citySalaMap = allFunciones?.reduce((acc: any, f: any) => {
        if (!f.ciudad || !f.salaNombre) return acc;
        if (!acc[f.ciudad]) acc[f.ciudad] = new Set();
        acc[f.ciudad].add(f.salaNombre);
        return acc;
    }, {}) || {};

    const uniqueSalas = Array.from(new Set(allFunciones?.map((f: any) => f.salaNombre))).filter(Boolean).sort();

    useEffect(() => {
        if (initialData) {
            setFormData({
                obraId: initialData.obraId || '',
                salaNombre: initialData.salaNombre || '',
                salaDireccion: initialData.salaDireccion || '',
                ciudad: initialData.ciudad || '',
                pais: initialData.pais || 'Argentina',
                capacidadSala: initialData.capacidadSala?.toString() || '',
                precioEntradaBase: initialData.precioEntradaBase?.toString() || '',
                linkVentaTicketera: initialData.linkVentaTicketera || '',
                userVentaTicketera: initialData.userVentaTicketera || '',
                passVentaTicketera: initialData.passVentaTicketera || '',
                linkMonitoreoVenta: initialData.linkMonitoreoVenta || '',
                notasProduccion: initialData.notasProduccion || '',
            });

            if (initialData.fecha) {
                const date = new Date(initialData.fecha);
                const dateP = date.toISOString().split('T')[0];
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0');
                setFechas([{ date: dateP, time: `${hours}:${minutes}` }]);
            }
        }
    }, [initialData]);

    // Consolidate auto-population logic
    const triggerAutoPopulate = (salaName: string, city: string) => {
        if (!allFunciones || !salaName) return;

        const typedSala = salaName.trim().toLowerCase();
        const typedCity = city?.trim().toLowerCase();

        // 1. Find matches by name
        let matches = allFunciones.filter((f: any) =>
            f.salaNombre?.trim().toLowerCase() === typedSala
        );

        // 2. If we have a city, narrow down to that city
        if (typedCity && matches.length > 0) {
            const cityMatches = matches.filter((f: any) =>
                f.ciudad?.trim().toLowerCase() === typedCity
            );
            if (cityMatches.length > 0) {
                matches = cityMatches;
            }
        }

        // 3. Find latest with data
        const matchesWithData = [...matches].reverse().find((f: any) =>
            f.linkVentaTicketera || f.linkMonitoreoVenta || f.userVentaTicketera || f.passVentaTicketera
        );

        const existingData = matchesWithData || (matches.length > 0 ? matches[matches.length - 1] : null);

        if (existingData) {
            setFormData(prev => ({
                ...prev,
                salaDireccion: existingData.salaDireccion || prev.salaDireccion,
                ciudad: existingData.ciudad || prev.ciudad,
                pais: existingData.pais || prev.pais,
                capacidadSala: existingData.capacidadSala?.toString() || prev.capacidadSala,
                linkVentaTicketera: existingData.linkVentaTicketera || prev.linkVentaTicketera,
                userVentaTicketera: existingData.userVentaTicketera || prev.userVentaTicketera,
                passVentaTicketera: existingData.passVentaTicketera || prev.passVentaTicketera,
                linkMonitoreoVenta: existingData.linkMonitoreoVenta || prev.linkMonitoreoVenta,
            }));
        }
    };

    const handleSalaChange = (salaName: string) => {
        setFormData(prev => ({ ...prev, salaNombre: salaName }));
        triggerAutoPopulate(salaName, formData.ciudad);
    };

    const handleCityChange = (city: string) => {
        setFormData(prev => ({ ...prev, ciudad: city }));
        triggerAutoPopulate(formData.salaNombre, city);
    };

    const addFecha = () => {
        const lastFecha = fechas[fechas.length - 1];
        setFechas([...fechas, { ...lastFecha }]);
    };

    const removeFecha = (index: number) => {
        if (fechas.length > 1) {
            setFechas(fechas.filter((_, i) => i !== index));
        }
    };

    const updateFecha = (index: number, field: 'date' | 'time', value: string) => {
        const newFechas = [...fechas];
        newFechas[index] = { ...newFechas[index], [field]: value };
        setFechas(newFechas);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Combine dates and times
            const isoFechas = fechas.map(f => `${f.date}T${f.time}:00`);

            const payload = {
                ...formData,
                fechas: isoFechas, // Send array
                capacidadSala: formData.capacidadSala ? parseInt(formData.capacidadSala) : null,
                precioEntradaBase: formData.precioEntradaBase ? parseFloat(formData.precioEntradaBase) : null,
            };

            if (initialData?.id) {
                // If editing, we probably only edited one, but backend handles single as array now too
                // Actually for edit we traditionally send 'fecha' but let's send 'fecha' for legacy/clarity if length is 1
                const editPayload = { ...payload, fecha: isoFechas[0] };
                delete (editPayload as any).fechas;
                await api.put(`/funciones/${initialData.id}`, editPayload);
            } else {
                await api.post('/funciones', payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al guardar la función');
        } finally {
            setLoading(false);
        }
    };

    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));


    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Obra</label>
                    <select
                        required
                        value={formData.obraId}
                        onChange={(e) => setFormData({ ...formData, obraId: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                    >
                        <option value="">Seleccionar Obra...</option>
                        {obras?.map((obra: any) => (
                            <option key={obra.id} value={obra.id}>{obra.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Fechas y Horarios</label>
                    <div className="space-y-3">
                        {fechas.map((f, idx) => {
                            const [h, m] = f.time.split(':');
                            return (
                                <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 group relative">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            value={f.date}
                                            onChange={(e) => updateFecha(idx, 'date', e.target.value)}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white text-sm"
                                        />
                                    </div>
                                    <div className="sm:w-48">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Hora (24HS)</label>
                                        <div className="flex gap-1.5">
                                            <select
                                                value={h}
                                                onChange={(e) => updateFecha(idx, 'time', `${e.target.value}:${m}`)}
                                                className="flex-1 px-2 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white text-sm appearance-none text-center"
                                            >
                                                {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
                                            </select>
                                            <span className="flex items-center font-bold text-gray-500">:</span>
                                            <select
                                                value={m}
                                                onChange={(e) => updateFecha(idx, 'time', `${h}:${e.target.value}`)}
                                                className="flex-1 px-2 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white text-sm appearance-none text-center"
                                            >
                                                {minutes.map(min => <option key={min} value={min}>{min}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {fechas.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeFecha(idx)}
                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!initialData && (
                        <button
                            type="button"
                            onClick={addFecha}
                            className="w-full py-2.5 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-primary-500 hover:border-primary-500/30 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Plus size={14} />
                            Agregar otra función
                        </button>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Ciudad</label>
                    <input
                        type="text"
                        list="funcion-cities-list"
                        required
                        value={formData.ciudad}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: CABA"
                    />
                    <datalist id="funcion-cities-list">
                        {uniqueCities.map(city => <option key={city as string} value={city as string} />)}
                    </datalist>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Sala / Teatro</label>
                    <input
                        type="text"
                        list="funcion-salas-list"
                        required
                        value={formData.salaNombre}
                        onChange={(e) => handleSalaChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: Teatro Astral"
                    />
                    <datalist id="funcion-salas-list">
                        {(formData.ciudad && citySalaMap[formData.ciudad])
                            ? Array.from(citySalaMap[formData.ciudad]).map((sala: any) => <option key={sala} value={sala} />)
                            : uniqueSalas.map(sala => <option key={sala as string} value={sala as string} />)
                        }
                    </datalist>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Dirección de la Sala</label>
                    <input
                        type="text"
                        value={formData.salaDireccion}
                        onChange={(e) => setFormData({ ...formData, salaDireccion: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: Av. Corrientes 1639"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Capacidad Sala</label>
                    <input
                        type="number"
                        value={formData.capacidadSala}
                        onChange={(e) => setFormData({ ...formData, capacidadSala: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: 500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Precio Base (ARS)</label>
                    <input
                        type="number"
                        value={formData.precioEntradaBase}
                        onChange={(e) => setFormData({ ...formData, precioEntradaBase: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: 25000"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Link Ticketera (Venta)</label>
                    <input
                        type="url"
                        value={formData.linkVentaTicketera}
                        onChange={(e) => setFormData({ ...formData, linkVentaTicketera: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-xs"
                        placeholder="https://..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Link Monitoreo / Backend (Producción)</label>
                    <input
                        type="url"
                        value={formData.linkMonitoreoVenta}
                        onChange={(e) => setFormData({ ...formData, linkMonitoreoVenta: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-xs"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Usuario Ticketera</label>
                    <input
                        type="text"
                        value={formData.userVentaTicketera}
                        onChange={(e) => setFormData({ ...formData, userVentaTicketera: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Usuario"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Password Ticketera</label>
                    <input
                        type="text"
                        value={formData.passVentaTicketera}
                        onChange={(e) => setFormData({ ...formData, passVentaTicketera: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                        placeholder="Contraseña"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Notas de Producción</label>
                    <textarea
                        rows={3}
                        value={formData.notasProduccion}
                        onChange={(e) => setFormData({ ...formData, notasProduccion: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Detalles logísticos o técnicos..."
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5 bg-[#1a1a1a] sticky bottom-0">
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
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Guardar Función</span>}
                </button>
            </div>
        </form>
    );
};

export default FuncionForm;
