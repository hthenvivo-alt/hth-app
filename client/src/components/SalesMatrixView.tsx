import React, { useMemo } from 'react';
import ExcelJS from 'exceljs';
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

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();

        for (const obra of data) {
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

            const sheet = workbook.addWorksheet(obra.nombre.substring(0, 31));

            // Column Config
            sheet.getColumn(1).width = 40; // Funsion
            sheet.getColumn(2).width = 12; // Capacidad
            for (let i = 0; i < oDays.length; i++) {
                sheet.getColumn(i + 3).width = 4; // User requested 3, but 4 looks better for numbers
            }

            // MONTHS ROW (Row 1)
            const monthRow = sheet.getRow(1);
            monthRow.font = { bold: true };
            monthRow.alignment = { horizontal: 'center' };

            let startIdx = 0;
            while (startIdx < oDays.length) {
                const currentMonth = oDays[startIdx].getMonth();
                const currentYear = oDays[startIdx].getFullYear();
                let endIdx = startIdx;

                while (endIdx + 1 < oDays.length &&
                    oDays[endIdx + 1].getMonth() === currentMonth &&
                    oDays[endIdx + 1].getFullYear() === currentYear) {
                    endIdx++;
                }

                const monthName = oDays[startIdx].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                const startCol = startIdx + 3;
                const endCol = endIdx + 3;

                sheet.mergeCells(1, startCol, 1, endCol);
                const cell = sheet.getCell(1, startCol);
                cell.value = monthName.toUpperCase();
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
                cell.border = {
                    left: { style: 'thick' },
                    right: { style: 'thick' },
                    top: { style: 'thin' },
                    bottom: { style: 'thin' }
                };

                startIdx = endIdx + 1;
            }

            // HEADERS ROW (Row 2: Day numbers)
            const headerRow = sheet.getRow(2);
            headerRow.getCell(1).value = 'FUNCIÓN / CIUDAD / SALA';
            headerRow.getCell(2).value = 'CAPACIDAD';
            headerRow.font = { bold: true };

            oDays.forEach((day, idx) => {
                const col = idx + 3;
                const cell = headerRow.getCell(col);
                cell.value = day.getDate();
                cell.alignment = { horizontal: 'center' };

                // Add right border if it's the last day of the month
                const isLastDayOfMonth = idx === oDays.length - 1 || oDays[idx].getMonth() !== oDays[idx + 1].getMonth();
                if (isLastDayOfMonth) {
                    cell.border = {
                        ...cell.border,
                        right: { style: 'thick' }
                    };
                }
            });

            // DATA ROWS
            obra.funciones.forEach((f, fIdx) => {
                const row = sheet.getRow(fIdx + 3);
                row.getCell(1).value = `${formatDate(f.fecha)} - ${f.ciudad} - ${f.salaNombre}`;
                row.getCell(2).value = f.capacidadSala;

                oDays.forEach((day, dIdx) => {
                    const col = dIdx + 3;
                    const cell = row.getCell(col);
                    const dayStr = day.toDateString();
                    const isFunctionDate = new Date(f.fecha).toDateString() === dayStr;

                    const daySales = f.ventas
                        .filter(v => new Date(v.fechaRegistro).toDateString() === dayStr)
                        .reduce((sum, v) => sum + v.entradasVendidas, 0);

                    if (isFunctionDate) {
                        cell.value = f.vendidas || daySales;
                        cell.font = { bold: true };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' } // Yellow for visibility
                        };
                    } else if (daySales > 0) {
                        cell.value = daySales;
                    }

                    cell.alignment = { horizontal: 'center' };

                    // Thick border between months
                    const isLastDayOfMonth = dIdx === oDays.length - 1 || oDays[dIdx].getMonth() !== oDays[dIdx + 1].getMonth();
                    if (isLastDayOfMonth) {
                        cell.border = {
                            ...cell.border,
                            right: { style: 'thick' }
                        };
                    }
                });
            });
        }

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Reporte_Matriz_Ventas_${new Date().getFullYear()}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
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
