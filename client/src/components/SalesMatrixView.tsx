import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface Venta {
    fechaRegistro: string;
    entradasVendidas: number;
}

interface Funcion {
    id: string;
    fecha: string;
    salaNombre: string;
    ciudad: string;
    capacidadSala: number;
    vendidas: number;
    ventas: Venta[];
}

interface Obra {
    id: string;
    nombre: string;
    funciones: Funcion[];
}

interface SalesMatrixViewProps {
    data: Obra[];
    selectedObraId: string;
}

const SalesMatrixView: React.FC<SalesMatrixViewProps> = ({ data, selectedObraId }) => {
    const selectedObra = useMemo(() => {
        return data.find(o => o.id === selectedObraId) || data[0];
    }, [data, selectedObraId]);

    const matrixData = useMemo(() => {
        if (!selectedObra) return null;

        // Find date range
        let minDate = new Date();
        let maxDate = new Date();

        selectedObra.funciones.forEach(f => {
            const fDate = new Date(f.fecha);
            if (fDate < minDate) minDate = fDate;
            if (fDate > maxDate) maxDate = fDate;

            f.ventas.forEach(v => {
                const vDate = new Date(v.fechaRegistro);
                if (vDate < minDate) minDate = vDate;
            });
        });

        // Add padding to range
        minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

        const days: Date[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { selectedObra, days };
    }, [selectedObra]);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        data.forEach(obra => {
            // Find date range for this obra
            let oMinDate = new Date();
            let oMaxDate = new Date();
            obra.funciones.forEach(f => {
                const fDate = new Date(f.fecha);
                if (fDate < oMinDate) oMinDate = fDate;
                if (fDate > oMaxDate) oMaxDate = fDate;
                f.ventas.forEach(v => {
                    const vDate = new Date(v.fechaRegistro);
                    if (vDate < oMinDate) oMinDate = vDate;
                });
            });
            oMinDate = new Date(oMinDate.getFullYear(), oMinDate.getMonth(), 1);
            oMaxDate = new Date(oMaxDate.getFullYear(), oMaxDate.getMonth() + 1, 0);

            const oDays: Date[] = [];
            let cur = new Date(oMinDate);
            while (cur <= oMaxDate) {
                oDays.push(new Date(cur));
                cur.setDate(cur.getDate() + 1);
            }

            // Create headers
            const headers = ['FUNCION', 'CAPACIDAD', ...oDays.map(d => formatDate(d.toISOString()))];
            const rows = obra.funciones.map(f => {
                const row: any = [
                    `${formatDate(f.fecha)} ${f.ciudad} - ${f.salaNombre}`,
                    f.capacidadSala
                ];

                oDays.forEach(day => {
                    const dayStr = day.toDateString();
                    const isFunctionDate = new Date(f.fecha).toDateString() === dayStr;

                    const daySales = f.ventas
                        .filter(v => new Date(v.fechaRegistro).toDateString() === dayStr)
                        .reduce((sum, v) => sum + v.entradasVendidas, 0);

                    if (isFunctionDate) {
                        row.push(f.vendidas || daySales); // Show total on function date
                    } else if (daySales > 0) {
                        row.push(daySales);
                    } else {
                        row.push('');
                    }
                });
                return row;
            });

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, obra.nombre.substring(0, 31));
        });

        XLSX.writeFile(wb, `Reporte_Matriz_Ventas_${new Date().getFullYear()}.xlsx`);
    };

    if (!matrixData) return null;

    const { days } = matrixData;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
                >
                    <Download size={16} />
                    Exportar Excel (Todas las Obras)
                </button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-[#121212] shadow-2xl custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="sticky left-0 z-20 bg-[#1a1a1a] p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-r border-white/5 min-w-[250px]">
                                Función / Plaza
                            </th>
                            <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5">
                                Cap.
                            </th>
                            {days.map((day, idx) => (
                                <th key={idx} className="p-2 text-center text-[8px] font-black text-gray-500 uppercase tracking-tighter border-b border-white/5 min-w-[40px]">
                                    <div>{day.toLocaleDateString('es-ES', { month: 'short' })}</div>
                                    <div className="text-white text-[10px]">{day.getDate()}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedObra.funciones.map((f) => (
                            <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="sticky left-0 z-10 bg-[#121212] p-4 text-[11px] font-bold text-white border-r border-b border-white/5 truncate">
                                    <div className="text-primary-500 text-[9px] mb-0.5">{formatDate(f.fecha)}</div>
                                    {f.ciudad} - {f.salaNombre}
                                </td>
                                <td className="p-4 text-center text-[10px] font-bold text-gray-500 border-b border-white/5 bg-black/20">
                                    {f.capacidadSala}
                                </td>
                                {days.map((day, idx) => {
                                    const dayStr = day.toDateString();
                                    const isFunctionDate = new Date(f.fecha).toDateString() === dayStr;
                                    const sales = f.ventas
                                        .filter(v => new Date(v.fechaRegistro).toDateString() === dayStr)
                                        .reduce((sum, v) => sum + v.entradasVendidas, 0);

                                    return (
                                        <td
                                            key={idx}
                                            className={`p-2 text-center text-[10px] border-b border-white/5 font-black ${isFunctionDate ? 'bg-primary-500/20 text-primary-500 border-x border-primary-500/30' : 'text-gray-400'
                                                }`}
                                        >
                                            {isFunctionDate ? (f.vendidas || sales) : (sales > 0 ? sales : '')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesMatrixView;
