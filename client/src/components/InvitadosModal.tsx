import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Trash2, FileSpreadsheet, FileText, UserPlus } from 'lucide-react';

interface Invitado {
    id: string;
    nombre: string;
    cantidad: number;
}

interface InvitadosModalProps {
    funcionId: string;
    onClose: () => void;
}

const InvitadosModal: React.FC<InvitadosModalProps> = ({ funcionId, onClose }) => {
    const queryClient = useQueryClient();
    const [nombre, setNombre] = React.useState('');
    const [cantidad, setCantidad] = React.useState('');
    const nombreInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        nombreInputRef.current?.focus();
    }, []);

    const { data: invitados, isLoading } = useQuery<Invitado[]>({
        queryKey: ['invitados', funcionId],
        queryFn: async () => {
            const res = await api.get(`/invitados/${funcionId}`);
            return res.data;
        }
    });

    const addMutation = useMutation({
        mutationFn: async (data: { nombre: string; cantidad: number }) => {
            await api.post('/invitados', { ...data, funcionId });
        },
        onSuccess: () => {
            setNombre('');
            setCantidad('');
            queryClient.invalidateQueries({ queryKey: ['invitados', funcionId] });
            setTimeout(() => {
                nombreInputRef.current?.focus();
            }, 0);
        },
        onError: (error: any) => {
            console.error('Error adding invitado:', error);
            alert(error.response?.data?.error || 'Error al agregar invitado');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/invitados/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitados', funcionId] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !cantidad) return;
        addMutation.mutate({ nombre, cantidad: parseInt(cantidad) });
    };

    const handleExport = (type: 'excel' | 'pdf') => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        window.open(`${baseUrl}/invitados/${funcionId}/export/${type}?token=${token}`, '_blank');
    };

    const totalInvitados = invitados?.reduce((acc, inv) => acc + inv.cantidad, 0) || 0;

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex-[2] relative">
                    <input
                        ref={nombreInputRef}
                        type="text"
                        placeholder="Nombre del invitado"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary-500 outline-none"
                        required
                        autoFocus
                    />
                </div>
                <div className="flex-1 relative">
                    <input
                        type="number"
                        placeholder="Cant."
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary-500 outline-none"
                        required
                        min="1"
                    />
                </div>
                <button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="bg-primary-500 hover:bg-primary-600 p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    <UserPlus size={20} />
                </button>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : invitados && invitados.length > 0 ? (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b border-white/5">
                                <th className="py-2 px-1">Invitado</th>
                                <th className="py-2 px-1 text-center">Cant.</th>
                                <th className="py-2 px-1 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {invitados.map((inv) => (
                                <tr key={inv.id} className="group">
                                    <td className="py-3 px-1 font-medium">{inv.nombre}</td>
                                    <td className="py-3 px-1 text-center">{inv.cantidad}</td>
                                    <td className="py-3 px-1 text-right">
                                        <button
                                            onClick={() => deleteMutation.mutate(inv.id)}
                                            className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No hay invitados registrados aún.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Suma Total</span>
                    <span className="text-2xl font-black text-primary-500">{totalInvitados}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600/10 text-green-500 border border-green-600/20 rounded-lg hover:bg-green-600/20 transition-all font-bold text-sm"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Excel</span>
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/20 rounded-lg hover:bg-red-600/20 transition-all font-bold text-sm"
                    >
                        <FileText size={18} />
                        <span>PDF</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-black text-sm shadow-lg shadow-primary-500/20 ml-2"
                    >
                        LISTO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvitadosModal;
