import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Modal from '../components/Modal';
import ObraForm from '../components/ObraForm';
import {
    Clapperboard,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Calendar,
    User as UserIcon,
    HardDrive,
    RefreshCw
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface Obra {
    id: string;
    nombre: string;
    artistaPrincipal: string;
    estado: string;
    fechaEstreno: string | null;
    productorEjecutivo: {
        nombre: string;
        apellido: string;
    };
}

const Obras: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingObra, setEditingObra] = React.useState<Obra | null>(null);
    const [syncingId, setSyncingId] = React.useState<string | null>(null);

    const { data: obras, isLoading } = useQuery<Obra[]>({
        queryKey: ['obras'],
        queryFn: async () => {
            const res = await api.get('/obras');
            return res.data;
        }
    });

    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingObra(null);
        queryClient.invalidateQueries({ queryKey: ['obras'] });
    };

    const openCreateModal = () => {
        setEditingObra(null);
        setIsModalOpen(true);
    };

    const openEditModal = (obra: Obra) => {
        setEditingObra(obra);
        setIsModalOpen(true);
    };

    const handleSyncDrive = async (obraId: string) => {
        setSyncingId(obraId);
        try {
            await api.post(`/auth/google/sync-drive/${obraId}`);
            alert('¡Carpeta de Google Drive creada con éxito!');
        } catch (error: any) {
            console.error('Error syncing drive:', error);
            alert(error.response?.data?.error || 'Error al crear la carpeta. Asegúrate de haber vinculado tu cuenta en Configuración.');
        } finally {
            setSyncingId(null);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/obras/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['obras'] });
            alert('Obra eliminada correctamente');
        },
        onError: (error: any) => {
            console.error('Error deleting obra:', error);
            alert(error.response?.data?.error || 'Error al eliminar la obra');
        }
    });

    const handleDelete = (e: React.MouseEvent, obra: Obra) => {
        e.stopPropagation();
        if (window.confirm(`¿Estás seguro de que deseas eliminar la obra "${obra.nombre}"? Se borrarán también todas sus funciones, gastos y liquidaciones asociadas.`)) {
            deleteMutation.mutate(obra.id);
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'En Gira': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'En Desarrollo': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'Finalizada': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Obras</h1>
                    <p className="text-gray-500">Administra el catálogo de espectáculos de la productora.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20"
                >
                    <Plus size={20} />
                    <span>Nueva Obra</span>
                </button>
            </header>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o artista..."
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center space-x-2 px-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                        <Filter size={20} />
                        <span>Estado</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                        <Filter size={20} />
                        <span>Productor</span>
                    </button>
                </div>
            </div>

            {/* Obras Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-[#121212] rounded-2xl animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {obras?.map((obra) => (
                        <div key={obra.id} className="bg-[#121212] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group relative overflow-hidden">
                            {/* Decorative Gradient */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-all" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-white/5 group-hover:bg-primary-500/10 transition-all">
                                        <Clapperboard size={24} className="text-primary-500" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSyncDrive(obra.id)}
                                            disabled={syncingId === obra.id}
                                            className={`p-2 hover:bg-white/5 rounded-lg transition-all ${syncingId === obra.id ? 'text-primary-500 animate-spin' : 'text-gray-500 hover:text-primary-500'}`}
                                            title="Crear carpeta en Google Drive"
                                        >
                                            {syncingId === obra.id ? <RefreshCw size={18} /> : <HardDrive size={18} />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(obra)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-primary-500 transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, obra)}
                                            disabled={deleteMutation.isPending}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-500 transition-all disabled:opacity-50"
                                        >
                                            {deleteMutation.isPending && deleteMutation.variables === obra.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-1 truncate">{obra.nombre}</h3>
                                <p className="text-gray-500 text-sm mb-4">{obra.artistaPrincipal}</p>

                                <div className="space-y-2 mb-6 text-sm">
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <UserIcon size={14} />
                                        <span>{obra.productorEjecutivo.nombre} {obra.productorEjecutivo.apellido}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <Calendar size={14} />
                                        <span>Estreno: {obra.fechaEstreno ? formatDate(obra.fechaEstreno) : 'Pendiente'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-auto">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(obra.estado)}`}>
                                        {obra.estado}
                                    </span>
                                    <button className="text-primary-500 text-sm font-bold hover:underline">Ver detalles</button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State Case (if no obras yet) */}
                    {obras?.length === 0 && (
                        <div className="col-span-full py-20 bg-[#121212] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Clapperboard size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No hay obras registradas</h3>
                            <p className="text-gray-500 mb-6">Comienza creando tu primera obra para gestionarla.</p>
                            <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl border border-white/10 transition-all flex items-center space-x-2">
                                <Plus size={18} />
                                <span>Agregar Obra</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingObra ? 'Editar Obra' : 'Nueva Obra'}
            >
                <ObraForm
                    initialData={editingObra}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Obras;
