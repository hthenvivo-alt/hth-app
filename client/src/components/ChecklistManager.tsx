import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    CheckCircle2,
    Circle,
    MessageSquare,
    Check,
    Link as LinkIcon,
    Copy,
    ExternalLink,
    Pencil,
    Loader2
} from 'lucide-react';

interface ChecklistItem {
    id: string;
    descripcionTarea: string;
    completada: boolean;
    observaciones?: string;
}

interface Props {
    funcionId: string;
}

const ChecklistManager: React.FC<Props> = ({ funcionId }) => {
    const queryClient = useQueryClient();
    const [editingObs, setEditingObs] = useState<{ id: string, text: string } | null>(null);
    const [editingLink, setEditingLink] = useState<{ field: string, taskName: string, value: string } | null>(null);

    // Fetch funcion for links (Venta/Monitoreo)
    const { data: funcion } = useQuery({
        queryKey: ['funcion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/funciones`);
            return res.data.find((f: any) => f.id === funcionId);
        }
    });

    // Fetch logistica for graphics/flyers/traslados/alojamiento
    const { data: logistica } = useQuery({
        queryKey: ['logistica', funcionId],
        queryFn: async () => {
            const res = await api.get(`/logistica/${funcionId}`);
            return res.data;
        }
    });

    // Fetch existing tasks from DB (for manual check and observations)
    const { data: dbTasks, isLoading } = useQuery<ChecklistItem[]>({
        queryKey: ['checklists', 'funcion', funcionId],
        queryFn: async () => {
            const res = await api.get(`/checklists/funcion/${funcionId}`);
            return res.data;
        }
    });

    const upsertMutation = useMutation({
        mutationFn: async ({ descripcion, completada, observaciones }: any) => {
            const existing = dbTasks?.find(t => t.descripcionTarea === descripcion);
            if (existing) {
                await api.patch(`/checklists/${existing.id}/toggle`, { completada, observaciones });
            } else {
                await api.post('/checklists', {
                    obraId: funcion?.obraId,
                    funcionId,
                    descripcionTarea: descripcion,
                    completada: completada || false,
                    observaciones,
                    responsableId: 'system'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', 'funcion', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funciones'] }); // Update counts in dashboard
        }
    });

    const logisticaMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post(`/logistica/${funcionId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistica', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funcion', funcionId] });
            queryClient.invalidateQueries({ queryKey: ['funciones'] });
            setEditingLink(null);
            alert('Link guardado correctamente');
        }
    });

    const isNonEmpty = (val: string | null | undefined) => Boolean(val && val.trim() !== '');

    const predefinedTasks = [
        {
            name: 'Gráfica para ticketera',
            type: 'auto',
            isOk: isNonEmpty(logistica?.linkGraficaTicketera),
            link: logistica?.linkGraficaTicketera,
            field: 'linkGraficaTicketera'
        },
        {
            name: 'Link de venta',
            type: 'auto',
            isOk: isNonEmpty(funcion?.linkVentaTicketera),
            link: funcion?.linkVentaTicketera
        },
        {
            name: 'Link de backend',
            type: 'auto',
            isOk: isNonEmpty(funcion?.linkMonitoreoVenta),
            link: funcion?.linkMonitoreoVenta
        },
        {
            name: 'Flyers para redes',
            type: 'auto',
            isOk: isNonEmpty(logistica?.linkFlyersRedes),
            link: logistica?.linkFlyersRedes,
            field: 'linkFlyersRedes'
        },
        { name: 'Chequeo técnico con la sala', type: 'manual', hasObs: true },
        {
            name: 'Traslados',
            type: 'auto',
            isOk: Boolean(
                isNonEmpty(logistica?.tipoTrasladoIdaArtista) ||
                isNonEmpty(logistica?.tipoTrasladoVueltaArtista) ||
                isNonEmpty(logistica?.tipoTrasladoIdaProduccion) ||
                isNonEmpty(logistica?.tipoTrasladoVueltaProduccion)
            )
        },
        {
            name: 'Alojamiento',
            type: 'auto',
            isOk: Boolean(
                isNonEmpty(logistica?.hotelNombreArtista) ||
                logistica?.alojamientoNoAplicaArtista === true ||
                isNonEmpty(logistica?.hotelNombreProduccion) ||
                logistica?.alojamientoNoAplicaProduccion === true
            )
        },
    ];

    const getTaskStatus = (taskName: string) => {
        return dbTasks?.find(t => t.descripcionTarea === taskName);
    };

    const handleToggle = (task: any) => {
        if (task.type === 'auto') return;
        const status = getTaskStatus(task.name);
        upsertMutation.mutate({
            descripcion: task.name,
            completada: !status?.completada
        });
    };

    const saveObservations = () => {
        if (!editingObs) return;
        const status = getTaskStatus(editingObs.id);
        upsertMutation.mutate({
            descripcion: editingObs.id,
            completada: status?.completada || false,
            observaciones: editingObs.text
        });
        setEditingObs(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    if (isLoading) {
        return (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black tracking-tight">Checklist de Tareas</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Producción Ejecutiva</p>
                </div>
            </div>

            <div className="space-y-2">
                {predefinedTasks.map((task) => {
                    const status = getTaskStatus(task.name);
                    const isCompleted = task.type === 'auto' ? task.isOk : status?.completada;

                    return (
                        <div
                            key={task.name}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCompleted
                                ? 'bg-green-500/5 border-green-500/10'
                                : 'bg-white/5 border-transparent hover:border-white/10'
                                }`}
                        >
                            <button
                                disabled={task.type === 'auto'}
                                onClick={() => handleToggle(task)}
                                className={`transition-colors ${isCompleted
                                    ? 'text-green-500'
                                    : 'text-gray-500 hover:text-primary-500'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-bold truncate ${isCompleted ? 'text-green-500/80' : 'text-gray-300'}`}>
                                        {task.name}
                                    </p>
                                    {task.type === 'auto' && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-primary-500/10 text-primary-400 rounded-md font-black uppercase">Auto</span>
                                    )}
                                </div>
                                {status?.observaciones && (
                                    <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                                        "{status.observaciones}"
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {task.link && (
                                    <>
                                        <button
                                            onClick={() => copyToClipboard(task.link!)}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all outline-none"
                                            title="Copiar Link"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => window.open(task.link, '_blank')}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all outline-none"
                                            title="Abrir Link"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    </>
                                )}

                                {task.field && (
                                    <button
                                        onClick={() => setEditingLink({ field: task.field!, taskName: task.name, value: task.link || '' })}
                                        className={`p-1.5 hover:bg-white/5 rounded-lg transition-all outline-none ${task.link ? 'text-gray-500 hover:text-white' : 'text-primary-500 bg-primary-500/10'}`}
                                        title="Ingresar/Editar Link"
                                    >
                                        {task.link ? <Pencil size={16} /> : <LinkIcon size={18} />}
                                    </button>
                                )}

                                {task.hasObs && (
                                    <button
                                        onClick={() => setEditingObs({ id: task.name, text: status?.observaciones || '' })}
                                        className={`p-1.5 rounded-lg transition-all outline-none ${status?.observaciones ? 'text-primary-400 bg-primary-400/10' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                                        title="Observaciones"
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Observations Modal */}
            {editingObs && (
                <div className="absolute inset-0 bg-black/95 flex flex-col p-6 z-10 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-primary-400">Observaciones: {editingObs.id}</h4>
                        <button onClick={() => setEditingObs(null)} className="text-gray-500 hover:text-white">
                            <Circle size={14} className="fill-white/10" />
                        </button>
                    </div>
                    <textarea
                        autoFocus
                        value={editingObs.text}
                        onChange={(e) => setEditingObs({ ...editingObs, text: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Escribe aquí las observaciones técnicas..."
                    />
                    <button
                        onClick={saveObservations}
                        className="mt-4 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-primary-500/20"
                    >
                        <Check size={18} />
                        Guardar Observaciones
                    </button>
                </div>
            )}

            {/* Link Edit Modal */}
            {editingLink && (
                <div className="absolute inset-0 bg-black/95 flex flex-col p-6 z-10 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-primary-400">Ingresar Link: {editingLink.taskName}</h4>
                        <button onClick={() => setEditingLink(null)} className="text-gray-500 hover:text-white">
                            <Circle size={14} className="fill-white/10" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">URL del Recurso</label>
                        <input
                            autoFocus
                            type="url"
                            value={editingLink.value}
                            onChange={(e) => setEditingLink({ ...editingLink, value: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                            placeholder="https://..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') logisticaMutation.mutate({ [editingLink.field]: editingLink.value });
                            }}
                        />
                        <p className="text-[10px] text-gray-500 mt-2">Presiona Enter para guardar el link y marcar como OK.</p>
                    </div>
                    <button
                        onClick={() => logisticaMutation.mutate({ [editingLink.field]: editingLink.value })}
                        disabled={logisticaMutation.isPending}
                        className="mt-4 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-primary-500/20"
                    >
                        {logisticaMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        Guardar Link
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChecklistManager;
