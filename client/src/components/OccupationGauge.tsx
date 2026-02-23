import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface OccupationGaugeProps {
    total: number;
    capacity: number;
    title: string;
    subtitle: string;
    date?: string;
}

const OccupationGauge: React.FC<OccupationGaugeProps> = ({ total, capacity, title, subtitle, date }) => {
    const percentage = capacity > 0 ? Math.min((total / capacity) * 100, 100) : 0;

    // Data for Recharts PieChart (Gauge style)
    // We want a semi-circle from 180 to 0 degrees
    const data = [
        { value: percentage },
        { value: 100 - percentage },
    ];

    const COLORS = ['#f59e0b', '#1f2937']; // amber-500 and a dark gray

    return (
        <div className="bg-[#121212] border border-white/5 pt-2 pb-6 px-6 rounded-[2rem] hover:border-white/10 transition-all flex flex-col items-center group overflow-hidden relative">
            <div className="w-full h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="65%"
                            outerRadius="100%"
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    className="transition-all duration-1000"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <span className="text-3xl font-black text-white italic leading-none">{Math.round(percentage)}%</span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Ocupación</span>
                </div>
            </div>

            <div className="mt-4 text-center w-full">
                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate px-2 flex items-center justify-center gap-2">
                    <span className="truncate">{title}</span>
                    {date && <span className="text-sm text-primary-500/80 font-bold shrink-0">{date}</span>}
                </h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 truncate px-2">{subtitle}</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-black">
                    <span className="text-amber-500">{total}</span>
                    <span className="text-gray-700">/</span>
                    <span className="text-gray-500">{capacity}</span>
                </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className={`absolute -inset-1 bg-amber-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
        </div>
    );
};

export default OccupationGauge;
