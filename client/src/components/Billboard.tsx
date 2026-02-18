import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react';

interface Mensaje {
    id: string;
    contenido: string;
    autorId: string;
    autor: {
        id: string;
        nombre: string;
        apellido: string;
        rol: string;
    };
    created_at: string;
}

const Billboard: React.FC = () => {
    const [newMsg, setNewMsg] = useState('');
    const queryClient = useQueryClient();

    // Get currentUser from local storage or context (assuming it's stored)
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
        mutationFn: async (contenido: string) => {
            await api.post('/mensajes', { contenido });
        },
        onSuccess: () => {
            setNewMsg('');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsg.trim()) return;
        createMutation.mutate(newMsg);
    };

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl flex flex-col h-[500px]">
            <div className="p-6 border-b border-white/5 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary-500" />
                <h2 className="text-xl font-bold">Cartelera / Mensajes</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : mensajes?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay mensajes aún. ¡Sé el primero!</p>
                ) : (
                    mensajes?.map((msg) => (
                        <div key={msg.id} className="group bg-white/5 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-primary-400">
                                        {msg.autor.nombre} {msg.autor.apellido}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                        {msg.autor.rol}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(msg.created_at).toLocaleString('es-AR', { hour12: false })}
                                    </span>
                                    {(currentUser?.rol === 'Admin' || currentUser?.id === msg.autorId) && (
                                        <button
                                            onClick={() => deleteMutation.mutate(msg.id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{msg.contenido}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Escribe un mensaje para el equipo..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={createMutation.isPending || !newMsg.trim()}
                        className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                    >
                        {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Billboard;
