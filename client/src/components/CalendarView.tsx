import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Ticket } from 'lucide-react';

interface Funcion {
    id: string;
    fecha: string;
    salaNombre: string;
    ciudad: string;
    obra: {
        nombre: string;
    };
    vendidas?: number;
    capacidadSala?: number;
}

interface CalendarViewProps {
    funciones: Funcion[];
    onEdit: (f: Funcion) => void;
    onNavigate: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ funciones, onEdit, onNavigate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthName = currentDate.toLocaleString('es-AR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const days = [];
    // Previous month padding
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        days.push(<div key={`prev-${i}`} className="h-32 bg-white/[0.01] border border-white/5 opacity-20" />);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayFunciones = funciones.filter(f => {
            const fDate = new Date(f.fecha);
            return fDate.getFullYear() === year &&
                fDate.getMonth() === month &&
                fDate.getDate() === day;
        });

        days.push(
            <div key={day} className="h-40 bg-[#121212] border border-white/5 p-2 flex flex-col gap-1 overflow-y-auto group hover:bg-white/[0.02] transition-colors relative">
                <span className="text-xs font-bold text-gray-500 mb-1">{day}</span>
                {dayFunciones.map(f => (
                    <div
                        key={f.id}
                        onClick={() => onNavigate(f.id)}
                        className="p-2 bg-primary-500/10 border border-primary-500/20 rounded-lg cursor-pointer hover:bg-primary-500/20 transition-all group/item"
                    >
                        <p className="text-[11px] font-black uppercase tracking-tight text-primary-400 truncate">{f.obra.nombre}</p>
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5 truncate">
                            <MapPin size={10} />
                            <span>{f.ciudad}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold mt-1">
                            <Ticket size={10} />
                            <span>{f.vendidas || 0}/{f.capacidadSala || '-'}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/5">
                <h2 className="text-lg font-black uppercase italic tracking-wider">
                    {capitalizedMonth} <span className="text-primary-500">{year}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors">Hoy</button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center border-b border-white/5 bg-white/[0.02]">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r border-white/5 last:border-0">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 animate-in fade-in duration-500">
                {days}
            </div>
        </div>
    );
};

export default CalendarView;
