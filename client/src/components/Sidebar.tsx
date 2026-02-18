import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Clapperboard,
    Calendar,
    FileText,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import ChangePasswordForm from './ChangePasswordForm';

const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    let navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Funciones', path: '/funciones' },
        { icon: FileText, label: 'Documentos', path: '/documentos' },
    ];

    const isArtist = user?.rol === 'Artista';
    const isAdmin = user?.rol === 'Administrador' || user?.rol === 'Admin';

    if (isArtist) {
        navItems = [
            { icon: BarChart3, label: 'Reportes', path: '/reportes' },
        ];
    } else if (isAdmin) {
        navItems.splice(2, 0, { icon: Clapperboard, label: 'Obras', path: '/obras' });
        navItems.splice(3, 0, { icon: BarChart3, label: 'Reportes', path: '/reportes' });
        navItems.push({ icon: BarChart3, label: 'Liquidación', path: '/liquidacion' });
        navItems.push({ icon: Users, label: 'Usuarios', path: '/usuarios' });
        navItems.push({ icon: Settings, label: 'Configuración', path: '/settings' });
    }

    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-[#121212] border-r border-white/5 flex flex-col z-50">
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-10">
                    <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <span className="text-white font-bold text-xl">H</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">HTH App</span>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                                    ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-white/5">
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-3">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/30 text-primary-500 font-black">
                            {user?.nombre?.[0]}{user?.apellido?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black uppercase tracking-tight truncate leading-none mb-1">{user?.nombre} {user?.apellido}</p>
                            <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-primary-500/20">
                                {user?.rol}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest group"
                    >
                        <Lock size={12} className="group-hover:text-primary-500" />
                        <span>Cambiar Clave</span>
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Cambiar Mi Contraseña"
            >
                <div className="pt-4">
                    <ChangePasswordForm onSuccess={() => setIsPasswordModalOpen(false)} />
                </div>
            </Modal>
        </div>
    );
};

export default Sidebar;
