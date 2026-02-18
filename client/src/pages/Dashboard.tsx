import React from 'react';
import {
    Calendar,
    TrendingUp as TrendingUpIcon,
    DollarSign,
    Ticket,
    ListTodo,
    AlertTriangle,
    MapPin,
    TrendingUp,
    ArrowRight,
    User,
    Plus,
    ChevronRight
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import Billboard from '../components/Billboard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/stats');
            return res.data;
        }
    });

    const stats = [
        {
            label: 'Funciones esta semana',
            value: dashboardData?.stats?.semana || 0,
            icon: Calendar,
            color: 'text-primary-500',
            bgColor: 'bg-primary-500/10'
        },
        {
            label: 'Funciones este mes',
            value: dashboardData?.stats?.mes || 0,
            icon: Ticket,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: 'Funciones en el año',
            value: dashboardData?.stats?.anio || 0,
            icon: ListTodo,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
    ];

    const proximasFunciones = dashboardData?.funciones || [];

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Panel de Control</h1>
                    <p className="text-gray-500 font-medium">Gestión estratégica de producciones HTH.</p>
                </div>
                <button
                    onClick={() => navigate('/funciones')}
                    className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 active:scale-95 text-sm uppercase tracking-wider"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Programar Función</span>
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#121212] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <stat.icon size={120} />
                        </div>
                        <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} className={stat.color} />
                        </div>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-5xl font-black text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-12">
                {/* Próximas Funciones - Scrollable Section */}
                <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <h2 className="text-2xl font-black flex items-center space-x-3 italic uppercase">
                            <Calendar size={24} className="text-primary-500" />
                            <span>Próximas Funciones</span>
                        </h2>
                        <button onClick={() => navigate('/funciones')} className="text-primary-500 text-sm font-black hover:text-primary-400 transition-colors uppercase tracking-widest bg-primary-500/5 px-4 py-2 rounded-xl border border-primary-500/10">Ver todas</button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                        {proximasFunciones.map((func: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/logistica/${func.id}`)}
                                className="p-8 hover:bg-white/[0.02] transition-all flex items-center group cursor-pointer border-l-4 border-transparent hover:border-primary-500"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20">
                                            {formatDate(func.fecha)} • {new Date(func.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                        <h4 className="text-xl font-black text-white group-hover:text-primary-400 transition-colors truncate">{func.obra.nombre}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium italic">
                                        <MapPin size={14} />
                                        <span>{func.salaNombre}, {func.ciudad}</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-end mr-12 min-w-[150px]">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-sm font-black text-white">{func.vendidas || 0}</span>
                                        <span className="text-gray-600 font-bold">/ {func.capacidadSala || '-'}</span>
                                        <Ticket size={14} className="text-gray-600" />
                                    </div>
                                    <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary-500 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.3)] transition-all duration-1000"
                                            style={{ width: `${func.capacidadSala ? ((func.vendidas || 0) / func.capacidadSala) * 100 : 0}%` }}
                                        />
                                    </div>
                                    {func.ultimaActualizacionVentas && (
                                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-tighter mt-1">
                                            Act: {formatDate(func.ultimaActualizacionVentas)} {new Date(func.ultimaActualizacionVentas).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                    )}
                                </div>

                                <div className="ml-4">
                                    {func.checklistStats ? (
                                        (() => {
                                            const pendientes = func.checklistStats.total - func.checklistStats.completadas;
                                            return pendientes === 0 ? (
                                                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-2xl border border-green-500/20 shadow-lg shadow-green-500/5">
                                                    <ListTodo size={16} className="font-bold" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">OK</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                                                    <AlertTriangle size={16} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{pendientes} PEND.</span>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {proximasFunciones.length === 0 && !isLoading && (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-gray-600">
                                <Calendar size={64} className="mb-4 opacity-10" />
                                <p className="text-xl font-bold italic uppercase tracking-widest">No hay funciones próximas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Billboard Section */}
                <Billboard />
            </div>
        </div>
    );
};

export default Dashboard;
