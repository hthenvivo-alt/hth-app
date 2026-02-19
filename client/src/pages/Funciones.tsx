import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Modal from '../components/Modal';
import FuncionForm from '../components/FuncionForm';
import VentaUpdateForm from '../components/VentaUpdateForm';
import InvitadosModal from '../components/InvitadosModal';
import {
    Calendar,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    MapPin,
    Clock,
    Ticket,
    ChevronRight,
    RefreshCw,
    ListTodo,
    AlertTriangle,
    Users
} from 'lucide-react';

interface Funcion {
    id: string;
    fecha: string;
    salaNombre: string;
    ciudad: string;
    obra: {
        nombre: string;
    };
    vendidas?: number;
    ultimaFacturacionBruta?: number;
    capacidadSala?: number;
    ultimaActualizacionVentas?: string;
    linkMonitoreoVenta?: string;
    userVentaTicketera?: string;
    passVentaTicketera?: string;
    checklistStats?: {
        total: number;
        completadas: number;
    };
}

const Funciones: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.rol === 'Administrador' || user?.rol === 'Admin';
    const canManage = isAdmin || user?.rol === 'Productor';

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isVentasModalOpen, setIsVentasModalOpen] = React.useState(false);
    const [isInvitadosModalOpen, setIsInvitadosModalOpen] = React.useState(false);
    const [editingFuncion, setEditingFuncion] = React.useState<Funcion | null>(null);
    const [selectedFuncionId, setSelectedFuncionId] = React.useState<string | null>(null);
    const [syncingId, setSyncingId] = React.useState<string | null>(null);
    const [showPast, setShowPast] = React.useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedObra, setSelectedObra] = React.useState('');
    const [selectedMonth, setSelectedMonth] = React.useState('');

    const { data: funciones, isLoading } = useQuery<Funcion[]>({
        queryKey: ['funciones'],
        queryFn: async () => {
            const res = await api.get('/funciones');
            return res.data;
        }
    });

    const now = new Date();

    // Unique values for filters
    const uniqueObras = Array.from(new Set(funciones?.map(f => f.obra.nombre) || [])).sort();
    const uniqueMonths = Array.from(new Set(funciones?.map(f => {
        const d = new Date(f.fecha);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }) || [])).sort().reverse();

    const filteredFunciones = funciones?.filter(f => {
        const matchesSearch =
            f.obra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.salaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.ciudad.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesObra = !selectedObra || f.obra.nombre === selectedObra;

        const matchesMonth = !selectedMonth || (() => {
            const d = new Date(f.fecha);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return m === selectedMonth;
        })();

        return matchesSearch && matchesObra && matchesMonth;
    }) || [];

    const futureFunciones = filteredFunciones.filter(f => new Date(f.fecha) >= now).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const pastFunciones = filteredFunciones.filter(f => new Date(f.fecha) < now).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingFuncion(null);
        queryClient.invalidateQueries({ queryKey: ['funciones'] });
    };

    const openCreateModal = () => {
        setEditingFuncion(null);
        setIsModalOpen(true);
    };

    const openEditModal = (funcion: Funcion) => {
        setEditingFuncion(funcion);
        setIsModalOpen(true);
    };

    const openVentasModal = (e: React.MouseEvent, funcionId: string) => {
        e.stopPropagation();
        setSelectedFuncionId(funcionId);
        setIsVentasModalOpen(true);
    };

    const handleVentaSuccess = () => {
        setIsVentasModalOpen(false);
        setSelectedFuncionId(null);
        queryClient.invalidateQueries({ queryKey: ['funciones'] });
    };

    const openInvitadosModal = (e: React.MouseEvent, funcionId: string) => {
        e.stopPropagation();
        setSelectedFuncionId(funcionId);
        setIsInvitadosModalOpen(true);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/funciones/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funciones'] });
            alert('Función eliminada correctamente');
        },
        onError: (error: any) => {
            console.error('Error deleting funcion:', error);
            alert(error.response?.data?.error || 'Error al eliminar la función');
        }
    });

    const handleDelete = (e: React.MouseEvent, funcion: Funcion) => {
        e.stopPropagation();
        const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar la función de "${funcion.obra.nombre}" en ${funcion.ciudad}? Esta acción no se puede deshacer.`);
        if (confirmDelete) {
            deleteMutation.mutate(funcion.id);
        }
    };

    const renderFuncionTable = (list: Funcion[], isPast: boolean = false) => (
        <div className={`bg-[#121212] border border-white/5 rounded-2xl overflow-hidden ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Obra y Fecha</th>
                            <th className="px-6 py-4 font-semibold">Sala / Ubicación</th>
                            <th className="px-6 py-4 font-semibold">Ventas / Capacidad</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {list.map((func) => (
                            <tr
                                key={func.id}
                                onClick={() => navigate(`/logistica/${func.id}`)}
                                className="hover:bg-white/[0.02] cursor-pointer transition-all group"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/10 group-hover:border-primary-500/30 transition-all">
                                            <span className="text-[10px] uppercase font-bold text-gray-500">{func.fecha ? new Date(func.fecha).toLocaleString('es-AR', { month: 'short' }) : '-'}</span>
                                            <span className="text-xl font-bold leading-none">{func.fecha ? new Date(func.fecha).getDate() : '-'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg group-hover:text-primary-400 transition-colors">{func.obra.nombre}</h4>
                                            <div className="flex items-center text-gray-500 text-xs mt-1">
                                                <Clock size={12} className="mr-1" />
                                                <span>{func.fecha ? new Date(func.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-300">{func.salaNombre}</span>
                                        <div className="flex items-center text-gray-500 text-xs mt-1">
                                            <MapPin size={12} className="mr-1" />
                                            <span>{func.ciudad}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                                                style={{ width: func.capacidadSala ? `${((func.vendidas || 0) / func.capacidadSala) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center text-sm font-medium">
                                                <Ticket size={14} className="mr-1 text-gray-500" />
                                                <span>{func.vendidas || 0}</span>
                                                <span className="text-gray-600 ml-1">/ {func.capacidadSala || '-'}</span>
                                            </div>
                                            {func.ultimaActualizacionVentas && (
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mt-0.5 whitespace-nowrap">
                                                    Act: {new Date(func.ultimaActualizacionVentas).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={(e) => openVentasModal(e, func.id)}
                                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 rounded-lg text-xs font-bold transition-all border border-primary-500/20"
                                                    title="Actualizar cantidad de entradas vendidas"
                                                >
                                                    <Ticket size={14} />
                                                    <span>Actualizar venta</span>
                                                </button>
                                                <button
                                                    onClick={(e) => openInvitadosModal(e, func.id)}
                                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-all border border-amber-500/20"
                                                    title="Gestionar lista de invitados"
                                                >
                                                    <Users size={14} />
                                                    <span>Invitados</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(func);
                                                    }}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-primary-500 transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, func)}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                                                        title="Eliminar Función"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <Link
                                            to={`/logistica/${func.id}`}
                                            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-primary-500 transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Ver Hoja de Ruta"
                                        >
                                            <div className="flex-shrink-0">
                                                {func.checklistStats ? (
                                                    (() => {
                                                        const pendientes = func.checklistStats.total - func.checklistStats.completadas;
                                                        return pendientes === 0 ? (
                                                            <div className="flex items-center gap-1 px-3 py-1.5 text-green-500 bg-green-500/10 rounded-xl border border-green-500/20 min-w-[64px] justify-center" title="Checklist completa">
                                                                <ListTodo size={13} className="shrink-0" />
                                                                <span className="text-[10px] font-black uppercase tracking-wider leading-none">OK</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 px-3 py-1.5 text-amber-500 bg-amber-500/10 rounded-xl border border-amber-500/20 min-w-[64px] justify-center" title={`${pendientes} tareas pendientes`}>
                                                                <AlertTriangle size={13} className="shrink-0" />
                                                                <span className="text-[10px] font-black uppercase tracking-wider leading-none">{pendientes} PEND.</span>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <ChevronRight size={18} className="text-gray-500" />
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Funciones</h1>
                    <p className="text-gray-500">Programa y monitorea las presentaciones en vivo.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={async () => {
                                setSyncingId('global-import');
                                try {
                                    const res = await api.post('/auth/google/sync-all');
                                    alert(res.data.message);
                                    queryClient.invalidateQueries({ queryKey: ['funciones'] });
                                } catch (error: any) {
                                    alert(error.response?.data?.error || 'Error al sincronizar');
                                } finally {
                                    setSyncingId(null);
                                }
                            }}
                            disabled={syncingId === 'global-import'}
                            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-semibold transition-all border border-white/10"
                        >
                            {syncingId === 'global-import' ? <RefreshCw size={20} className="animate-spin" /> : <Calendar size={20} />}
                            <span>Sincronizar con Calendar</span>
                        </button>
                    )}
                    {canManage && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20"
                        >
                            <Plus size={20} />
                            <span>Programar Función</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Past Functions Toggle */}
            {pastFunciones.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowPast(!showPast)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-primary-500 font-bold uppercase text-xs tracking-widest transition-all bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-primary-500/30"
                    >
                        {showPast ? (
                            <div className="flex items-center space-x-2">
                                <ChevronRight size={16} className="rotate-90 transition-transform" />
                                <span>Ocultar funciones pasadas ({pastFunciones.length})</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <ChevronRight size={16} />
                                <span>Ver funciones pasadas ({pastFunciones.length})</span>
                            </div>
                        )}
                    </button>

                    {showPast && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {renderFuncionTable(pastFunciones, true)}
                        </div>
                    )}
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por obra, sala o ciudad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-primary-500 pointer-events-none" size={16} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Cualquier Fecha</option>
                            {uniqueMonths.map(m => {
                                const [y, mon] = m.split('-');
                                const date = new Date(parseInt(y), parseInt(mon) - 1);
                                const label = date.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
                                return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                            })}
                        </select>
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-primary-500 pointer-events-none" size={16} />
                        <select
                            value={selectedObra}
                            onChange={(e) => setSelectedObra(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-[#121212] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Todas las Obras</option>
                            {uniqueObras.map(obra => <option key={obra} value={obra}>{obra}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Future Functions List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                        <div className="h-64 bg-white/[0.01]" />
                    </div>
                ) : futureFunciones.length > 0 ? (
                    renderFuncionTable(futureFunciones)
                ) : (
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 text-center text-gray-500">
                        <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay funciones programadas próximamente</p>
                        {canManage && (
                            <button onClick={openCreateModal} className="mt-4 text-primary-500 font-bold hover:underline">Programar una nueva función</button>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingFuncion ? 'Editar Función' : 'Programar Función'}
            >
                <FuncionForm
                    initialData={editingFuncion}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isVentasModalOpen}
                onClose={() => setIsVentasModalOpen(false)}
                title="Actualizar Ventas"
            >
                {selectedFuncionId && (
                    <VentaUpdateForm
                        funcion={funciones?.find((f: any) => f.id === selectedFuncionId)}
                        onSuccess={handleVentaSuccess}
                        onCancel={() => setIsVentasModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={isInvitadosModalOpen}
                onClose={() => setIsInvitadosModalOpen(false)}
                title="Lista de Invitados"
            >
                {selectedFuncionId && (
                    <InvitadosModal
                        funcionId={selectedFuncionId}
                        onClose={() => setIsInvitadosModalOpen(false)}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Funciones;
