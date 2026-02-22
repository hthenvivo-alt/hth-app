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

import OccupationGauge from '../components/OccupationGauge';

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
    const funcionesSemana = dashboardData?.funcionesSemana || [];

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#121212] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <stat.icon size={80} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                                <stat.icon size={22} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">{stat.label}</p>
                                <h3 className="text-3xl font-black text-white leading-none">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top 5 Upcoming Occupation Gauges */}
            {proximasFunciones.length > 0 && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black flex items-center space-x-3 italic uppercase">
                            <TrendingUpIcon size={24} className="text-amber-500" />
                            <span>Ventas Próximas Funciones</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {proximasFunciones.slice(0, 5).map((func: any) => (
                            <OccupationGauge
                                key={func.id}
                                total={func.vendidas || 0}
                                capacity={func.capacidadSala || 0}
                                title={func.obra.nombre}
                                subtitle={`${func.salaNombre}, ${func.ciudad}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-12">
                <Billboard />
            </div>
        </div>
    );
};

export default Dashboard;
