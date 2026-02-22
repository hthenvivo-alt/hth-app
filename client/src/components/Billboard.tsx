import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Send, Trash2, MessageSquare, Loader2, Pin, CheckCircle2, Reply } from 'lucide-react';

interface Mensaje {
    id: string;
    contenido: string;
    autorId: string;
    isPinned: boolean;
    isArchived: boolean;
    parentId?: string | null;
    autor: {
        id: string;
        nombre: string;
        apellido: string;
        rol: string;
    };
    replies?: Mensaje[];
    created_at: string;
}

const Billboard: React.FC = () => {
    const [newMsg, setNewMsg] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const queryClient = useQueryClient();

    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;

    const { data: mensajes, isLoading } = useQuery<Mensaje[]>({
        queryKey: ['mensajes'],
        queryFn: async () => {
            const res = await api.get('/mensajes');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async ({ contenido, parentId }: { contenido: string, parentId?: string | null }) => {
            await api.post('/mensajes', { contenido, parentId });
        },
        onSuccess: () => {
            setNewMsg('');
            setReplyTo(null);
            setReplyContent('');
            queryClient.invalidateQueries({ queryKey: ['mensajes'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/mensajes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mensajes'] });
        }
    });

    const pinMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/mensajes/${id}/pin`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mensajes'] });
        }
    });

    const archiveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/mensajes/${id}/archive`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mensajes'] });
        }
    });

    const handleSubmit = (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault();
        const content = parentId ? replyContent : newMsg;
        if (!content.trim()) return;
        createMutation.mutate({ contenido: content, parentId });
    };

    const renderMensaje = (msg: Mensaje, isReply = false) => (
        <div
            key={msg.id}
            className={`group border transition-all ${isReply
                    ? 'ml-8 mt-2 bg-white/[0.02] border-white/5 rounded-xl p-3'
                    : `bg-white/5 rounded-2xl p-5 ${msg.isPinned ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-white/5 hover:border-white/10'}`
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary-400">
                        {msg.autor.nombre} {msg.autor.apellido}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        {msg.autor.rol}
                    </span>
                    {msg.isPinned && !isReply && (
                        <Pin size={12} className="text-amber-500 fill-amber-500" />
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">
                        {new Date(msg.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isReply && (
                            <button
                                onClick={() => setReplyTo(replyTo === msg.id ? null : msg.id)}
                                className="text-gray-500 hover:text-primary-500 transition-colors"
                                title="Responder"
                            >
                                <Reply size={14} />
                            </button>
                        )}
                        {currentUser?.rol === 'Admin' && !isReply && (
                            <>
                                <button
                                    onClick={() => pinMutation.mutate(msg.id)}
                                    className={`${msg.isPinned ? 'text-amber-500' : 'text-gray-600'} hover:text-amber-500 transition-colors`}
                                    title={msg.isPinned ? "Desfijar" : "Fijar mensaje"}
                                >
                                    <Pin size={14} className={msg.isPinned ? 'fill-amber-500' : ''} />
                                </button>
                                <button
                                    onClick={() => archiveMutation.mutate(msg.id)}
                                    className="text-gray-600 hover:text-green-500 transition-colors"
                                    title="Marcar como resuelto / Archivar"
                                >
                                    <CheckCircle2 size={14} />
                                </button>
                            </>
                        )}
                        {(currentUser?.rol === 'Admin' || currentUser?.id === msg.autorId) && (
                            <button
                                onClick={() => deleteMutation.mutate(msg.id)}
                                className="text-gray-600 hover:text-red-500 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <p className={`text-gray-300 ${isReply ? 'text-xs' : 'text-sm'} leading-relaxed`}>{msg.contenido}</p>

            {!isReply && (
                <>
                    {msg.replies?.map(reply => renderMensaje(reply, true))}

                    {replyTo === msg.id && (
                        <form onSubmit={(e) => handleSubmit(e, msg.id)} className="mt-4 pl-8">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Escribe una respuesta..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !replyContent.trim()}
                                    className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-xl transition-all disabled:opacity-50"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] flex flex-col h-[700px] shadow-2xl relative overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <MessageSquare size={20} className="text-primary-500" />
                    </div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight">Cartelera de Equipo</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                ) : mensajes?.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={32} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">No hay anuncios ni discusiones activas.</p>
                    </div>
                ) : (
                    mensajes?.map((msg) => renderMensaje(msg))
                )}
            </div>

            <form onSubmit={(e) => handleSubmit(e)} className="p-6 border-t border-white/5 bg-white/[0.02]">
                <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                    <input
                        type="text"
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Inicia una conversación con el equipo..."
                        className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={createMutation.isPending || !newMsg.trim()}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                    >
                        {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span>Enviar</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Billboard;
