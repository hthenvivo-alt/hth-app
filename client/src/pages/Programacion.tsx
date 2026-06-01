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

type EstadoProyecto = 'idea' | 'en_contacto' | 'negociando' | 'oferta_enviada' | 'confirmada' | 'descartada';
type AcuerdoTipo = 'porcentaje' | 'monto_fijo' | '';

interface FechaProyecto {
    id: string;
    obraId: string;
    ciudad: string;
    pais: string;
    fechaTentativa: string | null;
    fechasTentativas: string | null; // Array JSON de fechas tentativas
    salaNombre: string | null;
    contactoNombre: string | null;
    contactoEmail: string | null;
    contactoTel: string | null;
    acuerdoTipo: string | null;
    acuerdoPorcentaje: number | null;
    acuerdoSobre: string | null;
    acuerdoMonto: number | null;
    estado: EstadoProyecto;
    notes?: string | null;
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

interface ObraConProyectos {
    id: string;
    nombre: string;
    artistaPrincipal: string;
    estado: string;
    prospectos: FechaProyecto[]; // Matches API response structure
    funciones: FuncionConfirmada[];
}

// ─────────────────────────────────────────────────────────────
// Conflict Detection Utility
// ─────────────────────────────────────────────────────────────

const getLocalDateString = (d: string) => {
    if (!d) return '';
    try {
        const date = new Date(d);
        const year = date.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });
        const month = date.toLocaleDateString('en-US', { month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
        const day = date.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
        return `${year}-${month}-${day}`;
    } catch (e) {
        return d.substring(0, 10);
    }
};

const obtenerConflictosParaFecha = (
    fechaStr: string, // format: "YYYY-MM-DD"
    proyectoId: string | undefined,
    ciudad: string,
    salaNombre: string | undefined,
    obraId: string,
    allFunciones: any[],
    obras: ObraConProyectos[]
): string[] => {
    if (!fechaStr) return [];
    const targetDayStr = fechaStr.substring(0, 10);
    const conflicts: string[] = [];

    // 1. Check against confirmed functions
    for (const f of allFunciones) {
        if (!f.fecha) continue;
        const fDayStr = getLocalDateString(f.fecha);
        if (fDayStr === targetDayStr) {
            // Check same Obra
            if (f.obraId === obraId) {
                conflicts.push(`La obra ya tiene una función confirmada este día.`);
            }
            // Check same Sala/Ciudad
            if (
                salaNombre && f.salaNombre &&
                salaNombre.trim().toLowerCase() === f.salaNombre.trim().toLowerCase() &&
                ciudad.trim().toLowerCase() === f.ciudad.trim().toLowerCase()
            ) {
                conflicts.push(`La sala "${f.salaNombre}" ya tiene una función confirmada este día.`);
            }
        }
    }

    // 2. Check against other active projects
    for (const o of obras) {
        if (!o.prospectos) continue;
        for (const p of o.prospectos) {
            // Skip current project
            if (p.id === proyectoId) continue;
            // Skip archived/inactive projects
            if (p.estado === 'confirmada' || p.estado === 'descartada') continue;

            // Parse dates of the active project
            let dates: string[] = [];
            if (p.fechasTentativas) {
                try {
                    const parsed = JSON.parse(p.fechasTentativas);
                    if (Array.isArray(parsed)) dates = parsed;
                } catch (e) { dates = []; }
            }
            if (dates.length === 0 && p.fechaTentativa) {
                dates = [p.fechaTentativa];
            }

            for (const d of dates) {
                const dDayStr = d.substring(0, 10);
                if (dDayStr === targetDayStr) {
                    // Check same Obra
                    if (p.obraId === obraId) {
                        conflicts.push(`Ya existe otro proyecto para esta obra este día (en ${p.ciudad}).`);
                    }
                    // Check same Sala/Ciudad
                    if (
                        salaNombre && p.salaNombre &&
                        salaNombre.trim().toLowerCase() === p.salaNombre.trim().toLowerCase() &&
                        ciudad.trim().toLowerCase() === p.ciudad.trim().toLowerCase()
                    ) {
                        conflicts.push(`Ya existe otro proyecto para la sala "${p.salaNombre}" este día.`);
                    }
                }
            }
        }
    }

    return Array.from(new Set(conflicts)); // Deduplicate
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const ESTADOS: { value: EstadoProyecto; label: string; color: string; dot: string }[] = [
    { value: 'idea',           label: 'Idea',           color: 'bg-gray-500/15 text-gray-400 border-gray-500/20',   dot: 'bg-gray-400' },
    { value: 'en_contacto',    label: 'En contacto',    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' },
    { value: 'negociando',     label: 'Negociando',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
    { value: 'oferta_enviada', label: 'Oferta enviada', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',   dot: 'bg-blue-400' },
    { value: 'confirmada',     label: 'Confirmada',     color: 'bg-green-500/15 text-green-400 border-green-500/20', dot: 'bg-green-400' },
    { value: 'descartada',     label: 'Descartada',     color: 'bg-red-500/15 text-red-400 border-red-500/20',      dot: 'bg-red-400' },
];

const getEstado = (v: EstadoProyecto) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0];

const formatAcuerdo = (p: FechaProyecto) => {
    if (!p.acuerdoTipo) return null;
    if (p.acuerdoTipo === 'porcentaje' && p.acuerdoPorcentaje != null)
        return `${p.acuerdoPorcentaje}% sobre ${p.acuerdoSobre || 'Neta'}`;
    if (p.acuerdoTipo === 'monto_fijo' && p.acuerdoMonto != null)
        return `$ ${Number(p.acuerdoMonto).toLocaleString('es-AR')} fijo`;
    return null;
};

const formatDateShort = (d: string) => {
    if (!d) return '';
    // If it's a date-only string (YYYY-MM-DD), parse timezone-safely without shifting
    if (d.length <= 10 && !d.includes('T') && !d.includes(':')) {
        const parts = d.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    // Otherwise, parse as ISO datetime in Argentina timezone
    return new Date(d).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
};

// ─────────────────────────────────────────────────────────────
// ProyectoForm (slide-over form)
// ─────────────────────────────────────────────────────────────

interface ProyectoFormProps {
    obraId: string;
    initial?: FechaProyecto | null;
    onClose: () => void;
    onSuccess: () => void;
    allFunciones: any[];
    obras: ObraConProyectos[];
}

const ProyectoForm: React.FC<ProyectoFormProps> = ({ obraId, initial, onClose, onSuccess, allFunciones, obras }) => {
    const [formObraId, setFormObraId] = useState(obraId || initial?.obraId || '');
    const [ciudad, setCiudad] = useState(initial?.ciudad ?? '');
    const [pais, setPais] = useState(initial?.pais ?? 'Argentina');
    
    // Manage multiple tentative dates
    const [fechasTentativas, setFechasTentativas] = useState<string[]>(() => {
        if (initial?.fechasTentativas) {
            try {
                const parsed = JSON.parse(initial.fechasTentativas);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((d: string) => d.substring(0, 10));
                }
            } catch (e) {}
        }
        if (initial?.fechaTentativa) {
            return [initial.fechaTentativa.substring(0, 10)];
        }
        return [''];
    });

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
    const [estado, setEstado] = useState<EstadoProyecto>(initial?.estado ?? 'idea');
    const [notas, setNotas] = useState(initial?.notas ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Autocomplete list processing
    const uniqueCities = Array.from(new Set(allFunciones?.map((f: any) => f.ciudad))).filter(Boolean).sort();
    const citySalaMap = allFunciones?.reduce((acc: any, f: any) => {
        if (!f.ciudad || !f.salaNombre) return acc;
        if (!acc[f.ciudad]) acc[f.ciudad] = new Set();
        acc[f.ciudad].add(f.salaNombre);
        return acc;
    }, {}) || {};
    const uniqueSalas = Array.from(new Set(allFunciones?.map((f: any) => f.salaNombre))).filter(Boolean).sort();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formObraId) { setError('La obra es requerida'); return; }
        if (!ciudad.trim()) { setError('La ciudad es requerida'); return; }
        
        // Clean empty dates
        const cleanDates = fechasTentativas.map(d => d.trim()).filter(Boolean);

        setSaving(true); setError('');
        try {
            const body = {
                obraId: formObraId, ciudad, pais, estado, notas: notas || null,
                fechasTentativas: cleanDates,
                fechaTentativa: cleanDates.length > 0 ? cleanDates[0] : null, // Duplicated for safety compatibility
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
                        <h3 className="text-lg font-bold">{initial ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Proyecto de fecha en pipeline de programación</p>
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
                            {!obraId && (
                                <div>
                                    <label className={labelClass}>Obra *</label>
                                    <select
                                        value={formObraId}
                                        onChange={e => setFormObraId(e.target.value)}
                                        className={inputClass + ' cursor-pointer'}
                                        disabled={!!initial}
                                    >
                                        <option value="">Seleccionar obra...</option>
                                        {obras.map(o => (
                                            <option key={o.id} value={o.id}>{o.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Ciudad *</label>
                                    <input
                                        type="text"
                                        list="proyecto-cities-list"
                                        value={ciudad}
                                        onChange={e => setCiudad(e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej: Córdoba"
                                    />
                                    <datalist id="proyecto-cities-list">
                                        {uniqueCities.map(city => <option key={city} value={city} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className={labelClass}>País</label>
                                    <input value={pais} onChange={e => setPais(e.target.value)} className={inputClass} placeholder="Argentina" />
                                </div>
                            </div>
                            
                            {/* Multiple Tentative Dates list */}
                            <div>
                                <label className={labelClass}>Fechas Tentativas</label>
                                <div className="space-y-3">
                                    {fechasTentativas.map((fecha, idx) => {
                                        const conflicts = ciudad ? obtenerConflictosParaFecha(
                                            fecha,
                                            initial?.id,
                                            ciudad,
                                            salaNombre,
                                            obraId,
                                            allFunciones,
                                            obras
                                        ) : [];

                                        return (
                                            <div key={idx} className="space-y-1 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="date"
                                                        value={fecha}
                                                        onChange={e => {
                                                            const newFechas = [...fechasTentativas];
                                                            newFechas[idx] = e.target.value;
                                                            setFechasTentativas(newFechas);
                                                        }}
                                                        className={inputClass + " flex-1"}
                                                    />
                                                    {fechasTentativas.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFechasTentativas(fechasTentativas.filter((_, i) => i !== idx))}
                                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                {conflicts.length > 0 && (
                                                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-1 space-y-1">
                                                        {conflicts.map((conf, ci) => (
                                                            <p key={ci} className="flex items-start gap-1 font-semibold">
                                                                ⚠️ {conf}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFechasTentativas([...fechasTentativas, ''])}
                                    className="mt-3 w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={14} /> Agregar otra fecha tentativa
                                </button>
                            </div>

                            <div>
                                <label className={labelClass}>Estado</label>
                                <select value={estado} onChange={e => setEstado(e.target.value as EstadoProyecto)} className={inputClass + ' cursor-pointer'}>
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
                                <input
                                    type="text"
                                    list="proyecto-salas-list"
                                    value={salaNombre}
                                    onChange={e => setSalaNombre(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ej: Teatro Gran Rex"
                                />
                                <datalist id="proyecto-salas-list">
                                    {(ciudad && citySalaMap[ciudad])
                                        ? Array.from(citySalaMap[ciudad]).map((sala: any) => <option key={sala} value={sala} />)
                                        : uniqueSalas.map(sala => <option key={sala as string} value={sala as string} />)
                                    }
                                </datalist>
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
                            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear proyecto'}
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
    proyecto: FechaProyecto;
    onClose: () => void;
    onSuccess: (funcionId: string) => void;
    allFunciones: any[];
}

const ConfirmarModal: React.FC<ConfirmarModalProps> = ({ proyecto, onClose, onSuccess, allFunciones }) => {
    // Parse list of tentative dates to suggest
    let tentativeDatesList: string[] = [];
    if (proyecto.fechasTentativas) {
        try {
            const parsed = JSON.parse(proyecto.fechasTentativas);
            if (Array.isArray(parsed) && parsed.length > 0) {
                tentativeDatesList = parsed.map((d: string) => d.substring(0, 10));
            }
        } catch (e) {}
    }
    if (tentativeDatesList.length === 0 && proyecto.fechaTentativa) {
        tentativeDatesList = [proyecto.fechaTentativa.substring(0, 10)];
    }

    const [fecha, setFecha] = useState(
        tentativeDatesList.length > 0 ? tentativeDatesList[0] : ''
    );
    const [hora, setHora] = useState('21:00');
    
    // Auto-populate capacity from similar venue if available in history
    const knownCapacity = proyecto.salaNombre
        ? allFunciones?.find((f: any) => f.salaNombre?.trim().toLowerCase() === proyecto.salaNombre?.trim().toLowerCase() && f.capacidadSala)?.capacidadSala
        : undefined;

    const [capacidadSala, setCapacidadSala] = useState(knownCapacity ? String(knownCapacity) : '');
    const [precioEntrada, setPrecioEntrada] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const acuerdo = formatAcuerdo(proyecto);

    const handleConfirm = async () => {
        if (!fecha) { setError('La fecha exacta es requerida'); return; }
        setSaving(true); setError('');
        try {
            const fechaISO = new Date(`${fecha}T${hora}:00`).toISOString();
            const res = await api.post(`/programacion/${proyecto.id}/confirmar`, {
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
                        {proyecto.ciudad}{proyecto.salaNombre ? ` — ${proyecto.salaNombre}` : ''}
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

                    {/* Quick select tentantive dates */}
                    {tentativeDatesList.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest">Sugerencias de fecha tentativa</label>
                            <div className="flex flex-wrap gap-2">
                                {tentativeDatesList.map((d, di) => (
                                    <button
                                        key={di}
                                        type="button"
                                        onClick={() => setFecha(d)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                            fecha === d
                                                ? 'bg-primary-500/20 text-primary-400 border-primary-500/40 font-bold'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        {new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </button>
                                ))}
                            </div>
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
// ProyectoCard
// ─────────────────────────────────────────────────────────────

interface ProyectoCardProps {
    proyecto: FechaProyecto;
    onEdit: (p: FechaProyecto) => void;
    onConfirmar: (p: FechaProyecto) => void;
    onDescartar: (p: FechaProyecto) => void;
    onDelete: (p: FechaProyecto) => void;
    onEstadoChange: (p: FechaProyecto, estado: EstadoProyecto) => void;
    allFunciones: any[];
    obras: ObraConProyectos[];
}

const ProyectoCard: React.FC<ProyectoCardProps> = ({ proyecto, onEdit, onConfirmar, onDescartar, onDelete, onEstadoChange, allFunciones, obras }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [showEstados, setShowEstados] = useState(false);
    const estadoInfo = getEstado(proyecto.estado);
    const acuerdo = formatAcuerdo(proyecto);
    const isArchived = proyecto.estado === 'confirmada' || proyecto.estado === 'descartada';

    // Parse list of tentative dates
    let tentativeDatesList: string[] = [];
    if (proyecto.fechasTentativas) {
        try {
            const parsed = JSON.parse(proyecto.fechasTentativas);
            if (Array.isArray(parsed) && parsed.length > 0) {
                tentativeDatesList = parsed;
            }
        } catch (e) {}
    }
    if (tentativeDatesList.length === 0 && proyecto.fechaTentativa) {
        tentativeDatesList = [proyecto.fechaTentativa];
    }

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
                            <span className="font-bold text-white">{proyecto.ciudad}</span>
                            {proyecto.pais !== 'Argentina' && (
                                <span className="text-gray-500 text-xs">, {proyecto.pais}</span>
                            )}
                        </div>
                        {proyecto.salaNombre && (
                            <>
                                <span className="text-gray-600">·</span>
                                <div className="flex items-center gap-1 text-gray-400 text-sm">
                                    <Building2 size={12} className="shrink-0" />
                                    <span className="truncate">{proyecto.salaNombre}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tentative Dates list with Conflict indicator */}
                    {tentativeDatesList.length > 0 ? (
                        <div className="mt-2.5 space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Fechas tentativas:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {tentativeDatesList.map((d, di) => {
                                    const formatted = formatDateShort(d);
                                    const conflicts = obtenerConflictosParaFecha(
                                        d.substring(0, 10),
                                        proyecto.id,
                                        proyecto.ciudad,
                                        proyecto.salaNombre || undefined,
                                        proyecto.obraId,
                                        allFunciones,
                                        obras
                                    );
                                    const hasConflict = conflicts.length > 0;

                                    return (
                                        <div
                                            key={di}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${
                                                hasConflict
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-white/5 text-gray-400 border-white/10'
                                            }`}
                                            title={hasConflict ? conflicts.join('\n') : undefined}
                                        >
                                            <Calendar size={10} className="shrink-0" />
                                            <span>{formatted}</span>
                                            {hasConflict && (
                                                <span className="text-red-400 font-bold shrink-0 ml-0.5" title={conflicts.join(', ')}>⚠️</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2.5 flex items-center gap-1 text-[11px] text-gray-500 font-semibold italic">
                            <Calendar size={11} className="shrink-0 text-gray-600" />
                            <span>Sin fechas tentativas cargadas</span>
                        </div>
                    )}

                    {/* Contacto */}
                    {proyecto.contactoNombre && (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User size={11} /><span>{proyecto.contactoNombre}</span>
                            </div>
                            {proyecto.contactoEmail && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Mail size={11} /><span>{proyecto.contactoEmail}</span>
                                </div>
                            )}
                            {proyecto.contactoTel && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Phone size={11} /><span>{proyecto.contactoTel}</span>
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
                    {proyecto.notas && (
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-300 transition-all"
                        >
                            <FileText size={11} />
                            <span>{showNotes ? 'Ocultar notas' : 'Ver notas'}</span>
                            <ChevronDown size={11} className={`transition-transform ${showNotes ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                    {showNotes && proyecto.notas && (
                        <p className="mt-2 text-xs text-gray-400 bg-white/[0.03] border border-white/5 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                            {proyecto.notas}
                        </p>
                    )}

                    {/* Confirmada: link a función */}
                    {proyecto.estado === 'confirmada' && proyecto.funcion && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 size={12} />
                            <span>Función creada: {formatDateShort(proyecto.funcion.fecha)}</span>
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
                                        onClick={() => { onEstadoChange(proyecto, e.value); setShowEstados(false); }}
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
                            <button onClick={() => onEdit(proyecto)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Editar">
                                <Pencil size={13} />
                            </button>
                            <button onClick={() => onConfirmar(proyecto)}
                                className="p-1.5 hover:bg-green-500/10 rounded-lg text-gray-500 hover:text-green-400 transition-all" title="Confirmar → crear función">
                                <CheckCircle2 size={13} />
                            </button>
                            <button onClick={() => onDescartar(proyecto)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all" title="Descartar">
                                <XCircle size={13} />
                            </button>
                            <button onClick={() => onDelete(proyecto)}
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

// Helper to extract the earliest tentative timestamp for sorting
const getProyectoFechaTimestamp = (p: FechaProyecto): number => {
    let dates: string[] = [];
    if (p.fechasTentativas) {
        try {
            const parsed = JSON.parse(p.fechasTentativas);
            if (Array.isArray(parsed) && parsed.length > 0) {
                dates = parsed;
            }
        } catch (e) {}
    }
    if (dates.length === 0 && p.fechaTentativa) {
        dates = [p.fechaTentativa];
    }
    if (dates.length === 0) return Infinity; // No dates = put at the end

    const times = dates.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
    return times.length > 0 ? Math.min(...times) : Infinity;
};

// Helper to extract the earliest active project date for an Obra
const getObraEarliestTimestamp = (o: ObraConProyectos): number => {
    const active = o.prospectos.filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada');
    if (active.length === 0) return Infinity;
    const times = active.map(getProyectoFechaTimestamp);
    return Math.min(...times);
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

const Programacion: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedObraId, setSelectedObraId] = useState<string | null>('all'); // Consolidate view by default
    const [showForm, setShowForm] = useState(false);
    const [editingProyecto, setEditingProyecto] = useState<FechaProyecto | null>(null);
    const [confirmingProyecto, setConfirmingProyecto] = useState<FechaProyecto | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [showConfirmed, setShowConfirmed] = useState(false); // Collapsible group for confirmed functions
    const [showOnlyActiveObras, setShowOnlyActiveObras] = useState(false);

    const { data: obras = [], isLoading } = useQuery<ObraConProyectos[]>({
        queryKey: ['programacion'],
        queryFn: async () => {
            const res = await api.get('/programacion');
            return res.data;
        }
    });

    // Query all functions to provide autocomplete suggestion data and conflict detection
    const { data: allFunciones = [] } = useQuery<any[]>({
        queryKey: ['all-funciones'],
        queryFn: async () => {
            const res = await api.get('/funciones');
            return res.data;
        }
    });

    const selectedObra = obras.find(o => o.id === selectedObraId);

    const updateEstadoMutation = useMutation({
        mutationFn: async ({ id, estado }: { id: string; estado: EstadoProyecto }) => {
            await api.put(`/programacion/${id}`, { estado });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programacion'] })
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/programacion/${id}`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programacion'] })
    });

    const handleDescartar = (p: FechaProyecto) => {
        if (window.confirm(`¿Descartar el proyecto en ${p.ciudad}?`)) {
            updateEstadoMutation.mutate({ id: p.id, estado: 'descartada' });
        }
    };

    const handleDelete = (p: FechaProyecto) => {
        if (window.confirm(`¿Eliminar el proyecto en ${p.ciudad}? Esta acción no se puede deshacer.`)) {
            deleteMutation.mutate(p.id);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProyecto(null);
        queryClient.invalidateQueries({ queryKey: ['programacion'] });
    };

    const handleConfirmSuccess = (funcionId: string) => {
        setConfirmingProyecto(null);
        queryClient.invalidateQueries({ queryKey: ['programacion'] });
        // Navigate to funciones
        navigate('/funciones');
    };

    const activeProyectos = selectedObra?.prospectos.filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada') ?? [];
    const archivedProyectos = selectedObra?.prospectos.filter(p => p.estado === 'confirmada' || p.estado === 'descartada') ?? [];

    // Group active projects by estado order (for kanban view)
    const estadoOrder: EstadoProyecto[] = ['oferta_enviada', 'negociando', 'en_contacto', 'idea'];
    const groupedActive = estadoOrder.map(e => ({
        estado: e,
        label: getEstado(e).label,
        items: activeProyectos
            .filter(p => p.estado === e)
            .sort((a, b) => getProyectoFechaTimestamp(a) - getProyectoFechaTimestamp(b))
    })).filter(g => g.items.length > 0);

    // Calculate total active projects across all obras
    const totalActiveCount = obras.reduce((acc, o) => {
        return acc + o.prospectos.filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada').length;
    }, 0);

    // Stats for sidebar badges
    const getObraStats = (obra: ObraConProyectos) => {
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
                            <p className="text-xs text-gray-500">Pipeline de proyectos por obra</p>
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
                            {/* "Todos los proyectos" button */}
                            <button
                                onClick={() => setSelectedObraId('all')}
                                className={`w-full text-left p-3.5 rounded-xl transition-all ${
                                    selectedObraId === 'all'
                                        ? 'bg-primary-500/15 border border-primary-500/25'
                                        : 'hover:bg-white/[0.04] border border-transparent'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className={`font-bold text-sm ${selectedObraId === 'all' ? 'text-white' : 'text-gray-300'}`}>
                                        Todos los proyectos
                                    </p>
                                    {totalActiveCount > 0 && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20">
                                            {totalActiveCount} activos
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">Vista consolidada de negociación</p>
                            </button>

                            {/* Separator */}
                            <div className="h-px bg-white/5 my-2" />

                            {/* Filter Active Obras checkbox */}
                            <div className="flex items-center justify-between px-3.5 py-2 mb-2 bg-white/[0.02] border border-white/5 rounded-xl">
                                <label htmlFor="active-filter" className="text-xs text-gray-400 font-semibold cursor-pointer select-none">
                                    Solo obras activas
                                </label>
                                <input
                                    id="active-filter"
                                    type="checkbox"
                                    checked={showOnlyActiveObras}
                                    onChange={e => setShowOnlyActiveObras(e.target.checked)}
                                    className="w-4 h-4 bg-[#0d0d0d] border border-white/10 rounded-lg accent-primary-500 cursor-pointer"
                                />
                            </div>

                            {obras
                                .filter(obra => !showOnlyActiveObras || obra.prospectos.some(p => p.estado !== 'confirmada' && p.estado !== 'descartada'))
                                .map(obra => {
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
                                                    Sin proyectos
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

            {/* ── Main: Pipeline de la obra seleccionada o Vista Consolidada ── */}
            <div className="flex-1 overflow-y-auto">
                {selectedObraId === 'all' ? (
                    // ── VISTA GLOBAL CONSOLIDADA (PREDETERMINADA) ──
                    <div className="p-6 max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold">Todos los proyectos activos</h2>
                                <p className="text-gray-500 text-sm">Vista consolidada de negociaciones agrupadas por obra</p>
                            </div>
                            <button
                                onClick={() => { setEditingProyecto(null); setShowForm(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20"
                            >
                                <Plus size={16} /> Agregar proyecto
                            </button>
                        </div>

                        {totalActiveCount === 0 ? (
                            <div className="bg-[#121212] border border-white/5 rounded-2xl p-12 text-center">
                                <CalendarRange size={40} className="mx-auto mb-3 text-gray-700" />
                                <p className="text-gray-500 font-medium">No hay proyectos activos en el pipeline</p>
                                <p className="text-gray-600 text-sm mt-1">Hacé clic en una obra en la barra lateral para agregar proyectos.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {obras
                                    .filter(o => o.prospectos.some(p => p.estado !== 'confirmada' && p.estado !== 'descartada'))
                                    .sort((a, b) => getObraEarliestTimestamp(a) - getObraEarliestTimestamp(b))
                                    .map(o => {
                                        const activeInObra = o.prospectos
                                            .filter(p => p.estado !== 'confirmada' && p.estado !== 'descartada')
                                            .sort((a, b) => getProyectoFechaTimestamp(a) - getProyectoFechaTimestamp(b));
                                        return (
                                            <div key={o.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                                    <div>
                                                        <h3
                                                            onClick={() => setSelectedObraId(o.id)}
                                                            className="font-bold text-base text-white hover:text-primary-400 transition-all cursor-pointer flex items-center gap-1.5 group"
                                                        >
                                                            {o.nombre}
                                                            <ChevronRight size={14} className="text-gray-500 group-hover:text-primary-400 transition-all" />
                                                        </h3>
                                                        <p className="text-xs text-gray-500">{o.artistaPrincipal}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                                                        {activeInObra.length} activos
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {activeInObra.map(p => (
                                                        <ProyectoCard
                                                            key={p.id}
                                                            proyecto={p}
                                                            onEdit={p => { setEditingProyecto(p); setShowForm(true); }}
                                                            onConfirmar={setConfirmingProyecto}
                                                            onDescartar={handleDescartar}
                                                            onDelete={handleDelete}
                                                            onEstadoChange={(p, estado) => updateEstadoMutation.mutate({ id: p.id, estado })}
                                                            allFunciones={allFunciones}
                                                            obras={obras}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                ) : !selectedObra ? (
                    // ── ESTADO INCOMPLETO/VACÍO ──
                    <div className="flex items-center justify-center h-full text-gray-600">
                        <div className="text-center">
                            <CalendarRange size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Seleccioná una obra</p>
                        </div>
                    </div>
                ) : (
                    // ── VISTA DETALLE KANBAN INDIVIDUAL POR OBRA ──
                    <div className="p-6 max-w-3xl mx-auto">
                        {/* Header obra */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedObra.nombre}</h2>
                                <p className="text-gray-500 text-sm">{selectedObra.artistaPrincipal}</p>
                            </div>
                            <button
                                onClick={() => { setEditingProyecto(null); setShowForm(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20"
                            >
                                <Plus size={16} /> Agregar proyecto
                            </button>
                        </div>

                        {/* Collapsible: Funciones confirmadas */}
                        {selectedObra.funciones.length > 0 && (
                            <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setShowConfirmed(!showConfirmed)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-all text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                        <span className="text-sm font-bold text-gray-300">Funciones ya confirmadas</span>
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
                                            {selectedObra.funciones.length}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={`text-gray-500 transition-transform duration-200 shrink-0 ${showConfirmed ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {showConfirmed && (
                                    <div className="p-4 pt-0 border-t border-white/5 divide-y divide-white/5 space-y-1">
                                        {selectedObra.funciones.map(f => (
                                            <div
                                                key={f.id}
                                                onClick={() => navigate('/funciones')}
                                                className="flex items-center gap-3 py-2.5 hover:text-green-400 transition-all cursor-pointer group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                <span className="text-green-400 text-sm font-semibold shrink-0">{formatDateShort(f.fecha)}</span>
                                                <span className="text-gray-400 text-sm flex items-center gap-1 truncate">
                                                    <Building2 size={12} className="shrink-0" />
                                                    {f.salaNombre || 'Sala a confirmar'}
                                                </span>
                                                <span className="text-gray-500 text-xs flex items-center gap-1 shrink-0">
                                                    <MapPin size={11} className="shrink-0" />
                                                    {f.ciudad}
                                                </span>
                                                <ArrowRight size={13} className="ml-auto text-gray-600 group-hover:text-green-400 transition-all shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pipeline activo */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                Pipeline de negociación
                            </h3>

                            {activeProyectos.length === 0 ? (
                                <div className="bg-[#121212] border border-white/5 rounded-2xl p-12 text-center">
                                    <CalendarRange size={40} className="mx-auto mb-3 text-gray-700" />
                                    <p className="text-gray-500 font-medium">No hay proyectos en el pipeline</p>
                                    <p className="text-gray-600 text-sm mt-1">Agregá un proyecto para empezar a trackear negociaciones</p>
                                    <button
                                        onClick={() => { setEditingProyecto(null); setShowForm(true); }}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl text-sm font-semibold mx-auto hover:bg-primary-500/20 transition-all"
                                    >
                                        <Plus size={14} /> Agregar proyecto
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
                                                    <ProyectoCard
                                                        key={p.id}
                                                        proyecto={p}
                                                        onEdit={p => { setEditingProyecto(p); setShowForm(true); }}
                                                        onConfirmar={setConfirmingProyecto}
                                                        onDescartar={handleDescartar}
                                                        onDelete={handleDelete}
                                                        onEstadoChange={(p, estado) => updateEstadoMutation.mutate({ id: p.id, estado })}
                                                        allFunciones={allFunciones}
                                                        obras={obras}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Archivados (confirmados/descartados) */}
                        {archivedProyectos.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 font-semibold uppercase tracking-wider transition-all mb-3"
                                >
                                    <ChevronRight size={14} className={`transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                                    Archivados ({archivedProyectos.length})
                                </button>
                                {showArchived && (
                                    <div className="space-y-2">
                                        {archivedProyectos.map(p => (
                                            <ProyectoCard
                                                key={p.id}
                                                proyecto={p}
                                                onEdit={() => {}}
                                                onConfirmar={() => {}}
                                                onDescartar={() => {}}
                                                onDelete={handleDelete}
                                                onEstadoChange={() => {}}
                                                allFunciones={allFunciones}
                                                obras={obras}
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
                <ProyectoForm
                    obraId={selectedObraId === 'all' ? (editingProyecto?.obraId || '') : selectedObraId}
                    initial={editingProyecto}
                    onClose={() => { setShowForm(false); setEditingProyecto(null); }}
                    onSuccess={handleFormSuccess}
                    allFunciones={allFunciones}
                    obras={obras}
                />
            )}

            {/* Confirmar modal */}
            {confirmingProyecto && (
                <ConfirmarModal
                    proyecto={confirmingProyecto}
                    onClose={() => setConfirmingProyecto(null)}
                    onSuccess={handleConfirmSuccess}
                    allFunciones={allFunciones}
                />
            )}
        </div>
    );
};

export default Programacion;
