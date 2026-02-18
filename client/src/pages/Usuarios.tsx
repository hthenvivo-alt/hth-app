import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    UserPlus,
    Mail,
    Shield,
    Trash2,
    Loader2,
    Search,
    CheckCircle2,
    XCircle,
    Edit2,
    Phone
} from 'lucide-react';
import Modal from '../components/Modal';

interface User {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: 'Administrador' | 'Productor' | 'Invitado' | 'Artista';
    telefono?: string;
    activo: boolean;
    created_at: string;
}

const Usuarios: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        nombre: '',
        apellido: '',
        rol: 'Productor',
        telefono: '',
        password: '',
        activo: true
    });

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsAddModalOpen(false);
            setNewUser({
                email: '',
                nombre: '',
                apellido: '',
                rol: 'Productor',
                telefono: '',
                password: '',
                activo: true
            });
            alert('Usuario creado correctamente');
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Error al crear usuario');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Error al eliminar usuario');
        }
    });

    const filteredUsers = users?.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        const passwordToSend = newUser.password || Math.random().toString(36).slice(-8);
        createMutation.mutate({ ...newUser, password: passwordToSend });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase italic">Gestión de Usuarios</h1>
                    <p className="text-gray-500 font-medium">Administra los accesos y roles de tu equipo.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 active:scale-95 text-sm uppercase tracking-wider"
                >
                    <UserPlus size={20} strokeWidth={3} />
                    <span>Nuevo Usuario</span>
                </button>
            </header>

            {/* Filters and Search */}
            <div className="mb-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-white shadow-xl placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-500">Usuario</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-500">Rol</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-500">Estado</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center">
                                    <Loader2 className="animate-spin inline-block text-primary-500 mb-4" size={40} />
                                    <p className="text-gray-500 font-black uppercase tracking-widest">Cargando equipo...</p>
                                </td>
                            </tr>
                        ) : filteredUsers?.map((user) => (
                            <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 text-primary-500 group-hover:scale-110 transition-transform">
                                            <span className="text-xl font-black">{user.nombre[0]}{user.apellido[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-lg leading-tight uppercase italic">{user.nombre} {user.apellido}</p>
                                            <p className="text-gray-500 text-xs font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.rol === 'Administrador'
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : user.rol === 'Productor'
                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            : user.rol === 'Artista'
                                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {user.activo ? (
                                            <CheckCircle2 className="text-green-500" size={16} />
                                        ) : (
                                            <XCircle className="text-gray-600" size={16} />
                                        )}
                                        <span className={`text-xs font-black uppercase tracking-widest ${user.activo ? 'text-green-500' : 'text-gray-600'}`}>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
                                                deleteMutation.mutate(user.id);
                                            }
                                        }}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && filteredUsers?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-500 font-bold uppercase italic">
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Crear Nuevo Usuario"
            >
                <form onSubmit={handleCreateUser} className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
                            <input
                                required
                                type="text"
                                value={newUser.nombre}
                                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                                placeholder="Ej: Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Apellido</label>
                            <input
                                required
                                type="text"
                                value={newUser.apellido}
                                onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                                placeholder="Ej: Perez"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                required
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Rol</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <select
                                value={newUser.rol}
                                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as any })}
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-white shadow-xl appearance-none cursor-pointer"
                            >
                                <option value="Productor">Productor</option>
                                <option value="Artista">Artista</option>
                                <option value="Invitado">Invitado</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Contraseña Temporal</label>
                        <input
                            required
                            type="text"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono font-bold text-white shadow-xl"
                            placeholder="Dejar vacío para generar automáticamente"
                        />
                        <p className="mt-2 text-[9px] text-gray-500 uppercase font-black italic">Se debe comunicar esta contraseña al usuario.</p>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black transition-all text-sm uppercase tracking-widest border border-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 rounded-2xl font-black transition-all text-sm uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 group"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <UserPlus size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                    <span>Crear Usuario</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Usuarios;
