import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
    CalendarRange, Plus, Pencil, Trash2, CheckCircle2,
    XCircle, MapPin, ChevronRight, Building2, Phone, Mail,
    User, FileText, Percent, DollarSign, Calendar, X, ChevronDown,
    ArrowRight
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type EstadoProspecto = 'idea' | 'en_contacto' | 'negociando' | 'oferta_enviada' | 'confirmada' | 'descartada';
type AcuerdoTipo = 'porcentaje' | 'monto_fijo' | '';

interface FechaProspecto {
    id: string;
    obraId: string;
    ciudad: string;
    pais: string;
    fechaTentativa: string | null;
    salaNombre: string | null;
    contactoNombre: string | null;
    contactoEmail: string | null;
    contactoTel: string | null;
    acuerdoTipo: string | null;
    acuerdoPorcentaje: number | null;
    acuerdoSobre: string | null;
    acuerdoMonto: number | null;
    estado: EstadoProspecto;
    notas: string | null;
    funcionId: string | null;
    funcion?: { id: string; fecha: string; salaNombre: string | null; ciudad: string } | null;
}

interface FuncionConfirmada {
    id: string;
    fecha: string;
    salaNombre: string | null;
    ciudad: string;
    pais: string;
}

interface ObraConProspectos {
    id: string;
    nombre: string;
    artistaPrincipal: string;
    estado: string;
    prospectos: FechaProspecto[];
    funciones: FuncionConfirmada[];
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const ESTADOS: { value: EstadoProspecto; label: string; color: string; dot: string }[] = [
    { value: 'idea',           label: 'Idea',           color: 'bg-gray-500/15 text-gray-400 border-gray-500/20',   dot: 'bg-gray-400' },
    { value: 'en_contacto',    label: 'En contacto',    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' },
    { value: 'negociando',     label: 'Negociando',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
    { value: 'oferta_enviada', label: 'Oferta enviada', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',   dot: 'bg-blue-400' },
    { value: 'confirmada',     label: 'Confirmada',     color: 'bg-green-500/15 text-green-400 border-green-500/20', dot: 'bg-green-400' },
    { value: 'descartada',     label: 'Descartada',     color: 'bg-red-500/15 text-red-400 border-red-500/20',      dot: 'bg-red-400' },
];

const getEstado = (v: EstadoProspecto) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0];

const formatAcuerdo = (p: FechaProspecto) => {
    if (!p.acuerdoTipo) return null;
    if (p.acuerdoTipo === 'porcentaje' && p.acuerdoPorcentaje != null)
        return `${p.acuerdoPorcentaje}% sobre ${p.acuerdoSobre || 'Neta'}`;
    if (p.acuerdoTipo === 'monto_fijo' && p.acuerdoMonto != null)
        return `$ ${Number(p.acuerdoMonto).toLocaleString('es-AR')} fijo`;
    return null;
};

const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

// ─────────────────────────────────────────────────────────────
// ProspectoForm (slide-over form)
// ─────────────────────────────────────────────────────────────

interface ProspectoFormProps {
    obraId: string;
    initial?: FechaProspecto | null;
    onClose: () => void;
    onSuccess: () => void;
}

const ProspectoForm: React.FC<ProspectoFormProps> = ({ obraId, initial, onClose, onSuccess }) => {
    const [ciudad, setCiudad] = useState(initial?.ciudad ?? '');
    const [pais, setPais] = useState(initial?.pais ?? 'Argentina');
    const [fechaTentativa, setFechaTentativa] = useState(
        initial?.fechaTentativa ? initial.fechaTentativa.substring(0, 10) : ''
    );
    const [salaNombre, setSalaNombre] = useState(initial?.salaNombre ?? '');
    const [contactoNombre, setContactoNombre] = useState(initial?.contactoNombre ?? '');
    const [contactoEmail, setContactoEmail] = useState(initial?.contactoEmail ?? '');
    const [contactoTel, setContactoTel] = useState(initial?.contactoTel ?? '');
    const [acuerdoTipo, setAcuerdoTipo] = useState<AcuerdoTipo>((initial?.acuerdoTipo as AcuerdoTipo) ?? '');
    const [acuerdoPorcentaje, setAcuerdoPorcentaje] = useState<string>(
        initial?.acuerdoPorcentaje != null ? String(initial.acuerdoPorcentaje) : ''
    );
    const [acuerdoSobre, setAcuerdoSobre] = useState(initial?.acuerdoSobre ?? 'Neta');
    const [acuerdoMonto, setAcuerdoMonto] = useState<string>(
        initial?.acuerdoMonto != null ? String(initial.acuerdoMonto) : ''
    );
    const [estado, setEstado] = useState<EstadoProspecto>(initial?.estado ?? 'idea');
    const [notas, setNotas] = useState(initial?.notas ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ciudad.trim()) { setError('La ciudad es requerida'); return; }
        setSaving(true); setError('');
        try {
            const body = {
                obraId, ciudad, pais, estado, notas: notas || null,
                fechaTentativa: fechaTentativa || null,
                salaNombre: salaNombre || null,
                contactoNombre: contactoNombre || null,
                contactoEmail: contactoEmail || null,
                contactoTel: contactoTel || null,
                acuerdoTipo: acuerdoTipo || null,
                acuerdoPorcentaje: acuerdoTipo === 'porcentaje' && acuerdoPorcentaje ? Number(acuerdoPorcentaje) : null,
                acuerdoSobre: acuerdoTipo === 'porcentaje' ? acuerdoSobre : null,
                acuerdoMonto: acuerdoTipo === 'monto_fijo' && acuerdoMonto ? Number(acuerdoMonto) : null,
            };
            if (initial?.id) {
                await api.put(`/programacion/${initial.id}`, body);
            } else {
                await api.post('/programacion', body);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder:text-gray-600";
    const labelClass = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-[#141414] border-l border-white/5 h-full overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">{initial ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Fecha candidata en pipeline de programación</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Datos básicos */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Datos básicos</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Ciudad *</label>
                                    <input value={ciudad} onChange={e => setCiudad(e.target.value)} className={inputClass} placeholder="Ej: Córdoba" />
                                </div>
                                <div>
                                    <label className={labelClass}>País</label>
                                    <input value={pais} onChange={e => setPais(e.target.value)} className={inputClass} placeholder="Argentina" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Fecha tentativa</label>
                                <input type="date" value={fechaTentativa} onChange={e => setFechaTentativa(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Estado</label>
                                <select value={estado} onChange={e => setEstado(e.target.value as EstadoProspecto)} className={inputClass + ' cursor-pointer'}>
                                    {ESTADOS.filter(e => e.value !== 'confirmada').map(e => (
                                        <option key={e.value} value={e.value}>{e.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sala candidata */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sala candidata</p>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>Nombre de la sala</label>
                                <input value={salaNombre} onChange={e => setSalaNombre(e.target.value)} className={inputClass} placeholder="Ej: Teatro Gran Rex" />
                            </div>
                            <div>
                                <label className={labelClass}>Contacto (nombre)</label>
                                <input value={contactoNombre} onChange={e => setContactoNombre(e.target.value)} className={inputClass} placeholder="Nombre de la persona de contacto" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input type="email" value={contactoEmail} onChange={e => setContactoEmail(e.target.value)} className={inputClass} placeholder="contacto@sala.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>Teléfono</label>
                                    <input value={contactoTel} onChange={e => setContactoTel(e.target.value)} className={inputClass} placeholder="+54 11 ..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Acuerdo económico */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Acuerdo económico con la sala</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: '', label: 'Sin acuerdo' },
                                    { value: 'porcentaje', label: '% Recaudación' },
                                    { value: 'monto_fijo', label: 'Monto fijo' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setAcuerdoTipo(opt.value as AcuerdoTipo)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            acuerdoTipo === opt.value
                                                ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {acuerdoTipo === 'porcentaje' && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                    <div>
                                        <label className={labelClass}>Porcentaje %</label>
                                        <div className="relative">
                                            <input
                                                type="number" min="0" max="100" step="0.01"
                                                value={acuerdoPorcentaje}
                                                onChange={e => setAcuerdoPorcentaje(e.target.value)}
                                                className={inputClass + ' pr-8'}
                                                placeholder="30"
                                            />
                                            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sobre</label>
                                        <div className="flex gap-2">
                                            {['Bruta', 'Neta'].map(v => (
                                                <button
                                                    key={v} type="button"
                                                    onClick={() => setAcuerdoSobre(v)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                        acuerdoSobre === v
                                                            ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                                                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {acuerdoTipo === 'monto_fijo' && (
                                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                    <label className={labelClass}>Monto fijo $</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="number" min="0"
                                            value={acuerdoMonto}
                                            onChange={e => setAcuerdoMonto(e.target.value)}
                                            className={inputClass + ' pl-8'}
                                            placeholder="50000"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className={labelClass}>Notas de negociación</label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={4}
                            className={inputClass + ' resize-none'}
                            placeholder="Detalles de la negociación, condiciones especiales, seguimiento..."
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold text-sm transition-all border border-white/10">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear prospecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// ConfirmarModal
// ─────────────────────────────────────────────────────────────

interface ConfirmarModalProps {
    prospecto: FechaProspecto;
    onClose: () => void;
    onSuccess: (funcionId: string) => void;
}

const ConfirmarModal: React.FC<ConfirmarModalProps> = ({ prospecto, onClose, onSuccess }) => {
    const [fecha, setFecha] = useState(
        prospecto.fechaTentativa ? prospecto.fechaTentativa.substring(0, 10) : ''
    );
    const [hora, setHora] = useState('21:00');
    const [capacidadSala, setCapacidadSala] = useState('');
    const [precioEntrada, setPrecioEntrada] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const acuerdo = formatAcuerdo(prospecto);

    const handleConfirm = async () => {
        if (!fecha) { setError('La fecha exacta es requerida'); return; }
        setSaving(true); setError('');
        try {
            const fechaISO = new Date(`${fecha}T${hora}:00`).toISOString();
            const res = await api.post(`/programacion/${prospecto.id}/confirmar`, {
                fecha: fechaISO,
                capacidadSala: capacidadSala ? Number(capacidadSala) : undefined,
                precioEntradaBase: precioEntrada ? Number(precioEntrada) : undefined,
            });
            onSuccess(res.data.funcion.id);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al confirmar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-green-400" /> Confirmar Función
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        {prospecto.ciudad}{prospecto.salaNombre ? ` — ${prospecto.salaNombre}` : ''}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {acuerdo && (
                        <div className="flex items-center gap-2 p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                            <Percent size={14} className="text-primary-400 shrink-0" />
                            <p className="text-sm text-primary-300 font-medium">
                                Acuerdo con sala: <span className="font-bold">{acuerdo}</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fecha exacta *</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Hora</label>
                            <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Capacidad sala</label>
                            <input type="number" value={capacidadSala} onChange={e => setCapacidadSala(e.target.value)} placeholder="Opcional"
                                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Precio base $</label>
                            <input type="number" value={precioEntrada} onChange={e => setPrecioEntrada(e.target.value)} placeholder="Opcional"
                                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold text-sm transition-all border border-white/10">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} disabled={saving}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <CheckCircle2 size={16} />
                        {saving ? 'Creando función...' : 'Confirmar y crear función'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// ProspectoCard
// ─────────────────────────────────────────────────────────────

interface ProspectoCardProps {
    prospecto: FechaProspecto;
    onEdit: (p: FechaProspecto) => void;
    onConfirmar: (p: FechaProspecto) => void;
    onDescartar: (p: FechaProspecto) => void;
    onDelete: (p: FechaProspecto) => void;
    onEstadoChange: (p: FechaProspecto, estado: EstadoProspecto) => void;
}

const ProspectoCard: React.FC<ProspectoCardProps> = ({ prospecto, onEdit, onConfirmar, onDescartar, onDelete, onEstadoChange }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [showEstados, setShowEstados] = useState(false);
    const estadoInfo = getEstado(prospecto.estado);
    const acuerdo = formatAcuerdo(prospecto);
    const isArchived = prospecto.estado === 'confirmada' || prospecto.estado === 'descartada';

    return (
        <div className={`bg-[#121212] border rounded-2xl p-4 transition-all group ${
            isArchived ? 'border-white/5 opacity-60' : 'border-white/[0.07] hover:border-white/15'
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Ciudad + sala */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-500 shrink-0" />
                            <span className="font-bold text-white">{prospecto.ciudad}</span>
                            {prospecto.pais !== 'Argentina' && (
                                <span className="text-gray-500 text-xs">, {prospecto.pais}</span>
                            )}
                        </div>
                        {prospecto.salaNombre && (
                            <>
                                <span className="text-gray-600">·</span>
                                <div className="flex items-center gap-1 text-gray-400 text-sm">
                                    <Building2 size={12} className="shrink-0" />
                                    <span className="truncate">{prospecto.salaNombre}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Fecha tentativa */}
                    {prospecto.fechaTentativa && (
                        <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                            <Calendar size={11} />
                            <span>Tentativa: {formatDateShort(prospecto.fechaTentativa)}</span>
                        </div>
                    )}

                    {/* Contacto */}
                    {prospecto.contactoNombre && (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User size={11} /><span>{prospecto.contactoNombre}</span>
                            </div>
                            {prospecto.contactoEmail && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Mail size={11} /><span>{prospecto.contactoEmail}</span>
                                </div>
                            )}
                            {prospecto.contactoTel && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Phone size={11} /><span>{prospecto.contactoTel}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Acuerdo */}
                    {acuerdo && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400 text-xs font-semibold">
                                <Percent size={10} />{acuerdo}
                            </div>
                        </div>
                    )}

                    {/* Notas toggle */}
                    {prospecto.notas && (
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-300 transition-all"
                        >
                            <FileText size={11} />
                            <span>{showNotes ? 'Ocultar notas' : 'Ver notas'}</span>
                            <ChevronDown size={11} className={`transition-transform ${showNotes ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                    {showNotes && prospecto.notas && (
                        <p className="mt-2 text-xs text-gray-400 bg-white/[0.03] border border-white/5 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                            {prospecto.notas}
                        </p>
                    )}

                    {/* Confirmada: link a función */}
                    {prospecto.estado === 'confirmada' && prospecto.funcion && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 size={12} />
                            <span>Función creada: {formatDateShort(prospecto.funcion.fecha)}</span>
                        </div>
                    )}
                </div>

                {/* Right: estado badge + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Estado badge / selector */}
                    <div className="relative">
                        <button
                            onClick={() => !isArchived && setShowEstados(!showEstados)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all ${estadoInfo.color} ${!isArchived ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${estadoInfo.dot}`} />
                            {estadoInfo.label}
                            {!isArchived && <ChevronDown size={10} />}
                        </button>
                        {showEstados && !isArchived && (
                            <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl min-w-[160px]">
                                {ESTADOS.filter(e => e.value !== 'confirmada' && e.value !== 'descartada').map(e => (
                                    <button
                                        key={e.value}
                                        onClick={() => { onEstadoChange(prospecto, e.value); setShowEstados(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-white/5 transition-all text-left"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${e.dot}`} />
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isArchived && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => onEdit(prospecto)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Editar">
                                <Pencil size={13} />
                            </button>
                            <button onClick={() => onConfirmar(prospecto)}
                                className="p-1.5 hover:bg-green-500/10 rounded-lg text-gray-500 hover:text-green-400 transition-all" title="Confirmar → crear función">
                                <CheckCircle2 size={13} />
                            </button>
                            <button onClick={() => onDescartar(prospecto)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all" title="Descartar">
                                <XCircle size={13} />
                            </button>
                            <button onClick={() => onDelete(prospecto)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all" title="Eliminar">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

const Programacion: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProspecto, setEditingProspecto] = useState<FechaProspecto | null>(null);
    const [confirmingProspecto, setConfirmingProspecto] = useState<FechaProspecto | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const { data: obras = [], isLoading } = useQuery<ObraConProspectos[]>({
        queryKey: ['programacion'],
        queryFn: async () => {
            const res = await api.get('/programacion');
            return res.data;
        }
    });

    const selectedObra = obras.find(o => o.id === selectedObraId);

    // Auto-select first obra
    React.useEffect(() => {
        if (obras.length > 0 && !selectedObraId) {
            setSelectedObraId(obras[0].id);
        }
    }, [obras, selectedObraId]);

    const updateEstadoMutation = useMutation({
        mutationFn: async ({ id, estado }: { id: string; estado: EstadoProspecto }) => {
            await api.put(`/programacion/${id}`, { estado });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programacion'] })
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/programacion/${id}`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programacion'] })
    });

    const handleDescartar = (p: FechaProspecto) => {
        if (window.confirm(`¿Descartar el prospecto en ${p.ciudad}?`)) {
            updateEstadoMutation.mutate({ id: p.id, estado: 'descartada' });
        }
    };

    const handleDelete = (p: FechaProspecto) => {
        if (window.confirm(`¿Eliminar el prospecto en ${p.ciudad}? Esta acción no se puede deshacer.`)) {
            deleteMutation.mutate(p.id);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProspecto(null);
        queryClient.invalidateQueries({ queryKey: ['programacion'] });
    };

    const handleConfirmSuccess = (funcionId: string) => {
        setConfirmingProspecto(null);
        queryClient.invalidateQueries({ queryKey: ['programacion'] });
        // Navigate to funciones
        navigate('/funciones');
    };

    const activeProspectos = selectedObra?.prospectos.filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada') ?? [];
    const archivedProspectos = selectedObra?.prospectos.filter(p => p.estado === 'confirmada' || p.estado === 'descartada') ?? [];

    // Group active prospectos by estado order
    const estadoOrder: EstadoProspecto[] = ['oferta_enviada', 'negociando', 'en_contacto', 'idea'];
    const groupedActive = estadoOrder.map(e => ({
        estado: e,
        label: getEstado(e).label,
        items: activeProspectos.filter(p => p.estado === e)
    })).filter(g => g.items.length > 0);

    // Stats for sidebar badges
    const getObraStats = (obra: ObraConProspectos) => {
        const active = obra.prospectos.filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada').length;
        const confirmed = obra.funciones.length;
        return { active, confirmed };
    };

    return (
        <div className="h-[calc(100vh-0px)] flex overflow-hidden">
            {/* ── Sidebar: Lista de obras ── */}
            <div className="w-72 shrink-0 border-r border-white/5 overflow-y-auto bg-[#0f0f0f]">
                <div className="p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-500/15 rounded-xl">
                            <CalendarRange size={22} className="text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Programación</h1>
                            <p className="text-xs text-gray-500">Pipeline de fechas por obra</p>
                        </div>
                    </div>
                </div>

                <div className="p-3">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                        </div>
                    ) : obras.length === 0 ? (
                        <p className="text-gray-600 text-xs text-center py-8">No hay obras activas</p>
                    ) : (
                        <div className="space-y-1">
                            {obras.map(obra => {
                                const { active, confirmed } = getObraStats(obra);
                                const isSelected = obra.id === selectedObraId;
                                return (
                                    <button
                                        key={obra.id}
                                        onClick={() => setSelectedObraId(obra.id)}
                                        className={`w-full text-left p-3.5 rounded-xl transition-all ${
                                            isSelected
                                                ? 'bg-primary-500/15 border border-primary-500/25'
                                                : 'hover:bg-white/[0.04] border border-transparent'
                                        }`}
                                    >
                                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                            {obra.nombre}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{obra.artistaPrincipal}</p>
                                        <div className="flex gap-2 mt-2">
                                            {confirmed > 0 && (
                                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded border border-green-500/20">
                                                    ✓ {confirmed} func.
                                                </span>
                                            )}
                                            {active > 0 && (
                                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20">
                                                    {active} en pipeline
                                                </span>
                                            )}
                                            {active === 0 && confirmed === 0 && (
                                                <span className="px-1.5 py-0.5 bg-white/5 text-gray-600 text-[10px] font-bold rounded">
                                                    Sin prospectos
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main: Pipeline de la obra seleccionada ── */}
            <div className="flex-1 overflow-y-auto">
                {!selectedObra ? (
                    <div className="flex items-center justify-center h-full text-gray-600">
                        <div className="text-center">
                            <CalendarRange size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Seleccioná una obra</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 max-w-3xl mx-auto">
                        {/* Header obra */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedObra.nombre}</h2>
                                <p className="text-gray-500 text-sm">{selectedObra.artistaPrincipal}</p>
                            </div>
                            <button
                                onClick={() => { setEditingProspecto(null); setShowForm(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20"
                            >
                                <Plus size={16} /> Agregar prospecto
                            </button>
                        </div>

                        {/* Funciones confirmadas */}
                        {selectedObra.funciones.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={13} className="text-green-500" /> Funciones confirmadas
                                </h3>
                                <div className="space-y-1.5">
                                    {selectedObra.funciones.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => navigate('/funciones')}
                                            className="flex items-center gap-3 px-4 py-2.5 bg-green-500/5 border border-green-500/10 rounded-xl hover:border-green-500/25 transition-all cursor-pointer group"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-green-400 text-sm font-semibold">{formatDateShort(f.fecha)}</span>
                                            <span className="text-gray-500 text-sm flex items-center gap-1">
                                                <Building2 size={12} />{f.salaNombre || 'Sala a confirmar'}
                                            </span>
                                            <span className="text-gray-600 text-xs flex items-center gap-1">
                                                <MapPin size={11} />{f.ciudad}
                                            </span>
                                            <ArrowRight size={13} className="ml-auto text-gray-600 group-hover:text-green-400 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pipeline activo */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                Pipeline de negociación
                            </h3>

                            {activeProspectos.length === 0 ? (
                                <div className="bg-[#121212] border border-white/5 rounded-2xl p-12 text-center">
                                    <CalendarRange size={40} className="mx-auto mb-3 text-gray-700" />
                                    <p className="text-gray-500 font-medium">No hay fechas en el pipeline</p>
                                    <p className="text-gray-600 text-sm mt-1">Agregá un prospecto para empezar a trackear negociaciones</p>
                                    <button
                                        onClick={() => { setEditingProspecto(null); setShowForm(true); }}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl text-sm font-semibold mx-auto hover:bg-primary-500/20 transition-all"
                                    >
                                        <Plus size={14} /> Agregar prospecto
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {groupedActive.map(group => (
                                        <div key={group.estado}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${getEstado(group.estado).dot}`} />
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</span>
                                                <span className="text-xs text-gray-600">({group.items.length})</span>
                                            </div>
                                            <div className="space-y-2 pl-4 border-l border-white/[0.06]">
                                                {group.items.map(p => (
                                                    <ProspectoCard
                                                        key={p.id}
                                                        prospecto={p}
                                                        onEdit={p => { setEditingProspecto(p); setShowForm(true); }}
                                                        onConfirmar={setConfirmingProspecto}
                                                        onDescartar={handleDescartar}
                                                        onDelete={handleDelete}
                                                        onEstadoChange={(p, estado) => updateEstadoMutation.mutate({ id: p.id, estado })}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Archivados (confirmados/descartados) */}
                        {archivedProspectos.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 font-semibold uppercase tracking-wider transition-all mb-3"
                                >
                                    <ChevronRight size={14} className={`transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                                    Archivados ({archivedProspectos.length})
                                </button>
                                {showArchived && (
                                    <div className="space-y-2">
                                        {archivedProspectos.map(p => (
                                            <ProspectoCard
                                                key={p.id}
                                                prospecto={p}
                                                onEdit={() => {}}
                                                onConfirmar={() => {}}
                                                onDescartar={() => {}}
                                                onDelete={handleDelete}
                                                onEstadoChange={() => {}}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-over form */}
            {showForm && selectedObraId && (
                <ProspectoForm
                    obraId={selectedObraId}
                    initial={editingProspecto}
                    onClose={() => { setShowForm(false); setEditingProspecto(null); }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Confirmar modal */}
            {confirmingProspecto && (
                <ConfirmarModal
                    prospecto={confirmingProspecto}
                    onClose={() => setConfirmingProspecto(null)}
                    onSuccess={handleConfirmSuccess}
                />
            )}
        </div>
    );
};

export default Programacion;
