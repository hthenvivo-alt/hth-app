import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Plane,
    Clock,
    Hotel,
    Utensils,
    Phone,
    Save,
    Loader2,
    Users,
    Star
} from 'lucide-react';

interface LogisticaFormData {
    tipoTrasladoIdaArtista: string;
    detalleTrasladoIdaArtista: string;
    tipoTrasladoVueltaArtista: string;
    detalleTrasladoVueltaArtista: string;
    tipoTrasladoIdaProduccion: string;
    detalleTrasladoIdaProduccion: string;
    tipoTrasladoVueltaProduccion: string;
    detalleTrasladoVueltaProduccion: string;
    hotelNombreArtista: string;
    hotelDireccionArtista: string;
    alojamientoNoAplicaArtista: boolean;
    hotelNombreProduccion: string;
    hotelDireccionProduccion: string;
    alojamientoNoAplicaProduccion: boolean;
    linkGraficaTicketera: string;
    linkFlyersRedes: string;
    horarioEntradaSala: string;
    horarioCitacionArtista: string;
    comidasDetalle: string;
    contactosLocales: string;
    telProductorEjecutivo: string;
    telProductorAsociado: string;
    telTraslados: string;
    telHoteles: string;
    fechaEnvioRuta: string;
}

interface Props {
    initialData?: any;
    ciudad: string;
    onSubmit: (data: LogisticaFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const LogisticaForm: React.FC<Props> = ({ initialData, ciudad, onSubmit, onCancel, isLoading }) => {
    const { register, handleSubmit, reset, watch, setValue } = useForm<LogisticaFormData>();

    const noAplicaArtista = watch('alojamientoNoAplicaArtista');
    const noAplicaProd = watch('alojamientoNoAplicaProduccion');

    useEffect(() => {
        if (noAplicaArtista) {
            setValue('hotelNombreArtista', '');
            setValue('hotelDireccionArtista', '');
        }
    }, [noAplicaArtista, setValue]);

    useEffect(() => {
        if (noAplicaProd) {
            setValue('hotelNombreProduccion', '');
            setValue('hotelDireccionProduccion', '');
        }
    }, [noAplicaProd, setValue]);

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else if (ciudad && (ciudad.toUpperCase() === 'CABA' || ciudad.toUpperCase() === 'BUENOS AIRES' || ciudad.toUpperCase() === 'CIUDAD AUTÓNOMA DE BUENOS AIRES')) {
            // Defaults for CABA if it's a new logistics record
            reset({
                tipoTrasladoIdaArtista: 'Auto Propio',
                tipoTrasladoVueltaArtista: 'Auto Propio',
                tipoTrasladoIdaProduccion: 'Auto Propio',
                tipoTrasladoVueltaProduccion: 'Auto Propio',
                alojamientoNoAplicaArtista: true,
                alojamientoNoAplicaProduccion: true,
            } as any);
        }
    }, [initialData, ciudad, reset]);

    const transportOptions = [
        { value: '', label: 'Seleccionar...' },
        { value: 'Aéreo', label: 'Aéreo' },
        { value: 'Remise', label: 'Remise' },
        { value: 'Auto Propio', label: 'Auto Propio' },
        { value: 'Bus', label: 'Bus' },
        { value: 'Buque', label: 'Buque' },
        { value: 'No Aplica', label: 'No Aplica' },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

                {/* SECTION: ARTISTA */}
                <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Star size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary-500/20 text-primary-400 rounded-xl">
                            <Star size={24} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Logística ARTISTA</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plane size={14} /> Traslado IDA (Artista)
                            </h4>
                            <select
                                {...register('tipoTrasladoIdaArtista')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                {transportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <textarea
                                {...register('detalleTrasladoIdaArtista')}
                                rows={2}
                                placeholder="Vuelo, horario, etc."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plane size={14} className="rotate-180" /> Traslado VUELTA (Artista)
                            </h4>
                            <select
                                {...register('tipoTrasladoVueltaArtista')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                {transportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <textarea
                                {...register('detalleTrasladoVueltaArtista')}
                                rows={2}
                                placeholder="Vuelo, horario, etc."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="col-span-full space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hotel size={14} /> Alojamiento (Artista)
                                </h4>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" {...register('alojamientoNoAplicaArtista')} className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-0 focus:ring-offset-0" />
                                    NO APLICA
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    {...register('hotelNombreArtista')}
                                    disabled={watch('alojamientoNoAplicaArtista')}
                                    placeholder={watch('alojamientoNoAplicaArtista') ? 'NO APLICA' : 'Nombre del Hotel'}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm disabled:opacity-30"
                                />
                                <input
                                    {...register('hotelDireccionArtista')}
                                    disabled={watch('alojamientoNoAplicaArtista')}
                                    placeholder="Dirección"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm disabled:opacity-30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION: PRODUCCIÓN */}
                <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Users size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                            <Users size={24} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Logística PRODUCCIÓN</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plane size={14} /> Traslado IDA (Prod)
                            </h4>
                            <select
                                {...register('tipoTrasladoIdaProduccion')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                {transportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <textarea
                                {...register('detalleTrasladoIdaProduccion')}
                                rows={2}
                                placeholder="Vuelo, horario, etc."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plane size={14} className="rotate-180" /> Traslado VUELTA (Prod)
                            </h4>
                            <select
                                {...register('tipoTrasladoVueltaProduccion')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                {transportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <textarea
                                {...register('detalleTrasladoVueltaProduccion')}
                                rows={2}
                                placeholder="Vuelo, horario, etc."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="col-span-full space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hotel size={14} /> Alojamiento (Producción)
                                </h4>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" {...register('alojamientoNoAplicaProduccion')} className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-0 focus:ring-offset-0" />
                                    NO APLICA
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    {...register('hotelNombreProduccion')}
                                    disabled={watch('alojamientoNoAplicaProduccion')}
                                    placeholder={watch('alojamientoNoAplicaProduccion') ? 'NO APLICA' : 'Nombre del Hotel'}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm disabled:opacity-30"
                                />
                                <input
                                    {...register('hotelDireccionProduccion')}
                                    disabled={watch('alojamientoNoAplicaProduccion')}
                                    placeholder="Dirección"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm disabled:opacity-30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SHARED: TIMING, CATERING & CONTACTS */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Clock className="text-primary-500" size={24} />
                            <h3 className="text-xl font-bold">Horarios de Citación</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Entrada en Sala (24HS)</label>
                                <input
                                    {...register('horarioEntradaSala')}
                                    placeholder="Ej: 14:00"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Citación Artista (24HS)</label>
                                <input
                                    {...register('horarioCitacionArtista')}
                                    placeholder="Ej: 20:30"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Utensils className="text-primary-500" size={24} />
                                <h3 className="text-xl font-bold">Comidas & Catering</h3>
                            </div>
                            <textarea
                                {...register('comidasDetalle')}
                                rows={4}
                                placeholder="Detalles sobre viandas, camarines, cenas, etc."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Phone className="text-primary-500" size={24} />
                            <h3 className="text-xl font-bold">Contactos Clave</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Prod. Ejecutivo</label>
                                <input {...register('telProductorEjecutivo')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Prod. Asociado</label>
                                <input {...register('telProductorAsociado')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Traslados</label>
                                <input {...register('telTraslados')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Hoteles</label>
                                <input {...register('telHoteles')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Contacto Local / Sala</label>
                                <textarea {...register('contactosLocales')} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center gap-6 pt-12 border-t border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest text-xs"
                >
                    Descartar Cambios
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-primary-500 hover:bg-primary-600 px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50 group"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
                    GUARDAR HOJA DE RUTA
                </button>
            </div>
        </form>
    );
};

export default LogisticaForm;
