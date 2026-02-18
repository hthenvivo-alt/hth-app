import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Ticket,
    DollarSign
} from 'lucide-react';

interface Props {
    funcionId: string;
}

const FinancialSummary: React.FC<Props> = ({ funcionId }) => {
    // Fetch function details to get total vendidas and capacidad
    const { data: funcion, isLoading: isLoadingFuncion } = useQuery({
        queryKey: ['funcion-detail', funcionId],
        queryFn: async () => {
            const res = await api.get('/funciones');
            return res.data.find((f: any) => f.id === funcionId);
        }
    });

    // Fetch ventas to calculate total revenue
    const { data: ventas, isLoading: isLoadingVentas } = useQuery({
        queryKey: ['ventas', funcionId],
        queryFn: async () => {
            const res = await api.get(`/ventas/${funcionId}`);
            return res.data;
        }
    });

    if (isLoadingFuncion || isLoadingVentas) {
        return <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4 h-32">
            <div className="bg-white/5 rounded-2xl"></div>
            <div className="bg-white/5 rounded-2xl"></div>
        </div>;
    }

    const totalRevenue = ventas?.reduce((acc: number, v: any) => acc + (parseFloat(v.facturacionBruta) || 0), 0) || 0;
    const vendidas = funcion?.vendidas || 0;
    const capacidad = funcion?.capacidadSala || 0;
    const progress = capacidad > 0 ? (vendidas / capacidad) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Entradas Vendidas */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl group hover:border-primary-500/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-primary-500/10 text-primary-500">
                        <Ticket size={24} />
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Entradas Vendidas</p>
                        <div className="flex items-center justify-end gap-2">
                            <h4 className="text-3xl font-black text-white">{vendidas.toLocaleString('es-AR')}</h4>
                            <span className="text-gray-500 font-bold">/ {capacidad || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-gray-500">PROGRESO DE VENTA</span>
                        <span className="text-primary-500">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.5)] transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Card: Ingresos Totales */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl group hover:border-green-500/20 transition-all flex flex-col justify-center">
                <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-green-500/10 text-green-500">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Ingresos Totales (Bruto)</p>
                        <h4 className="text-4xl font-black text-white">
                            <span className="text-green-500 mr-2">$</span>
                            {totalRevenue.toLocaleString('es-AR')}
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialSummary;
