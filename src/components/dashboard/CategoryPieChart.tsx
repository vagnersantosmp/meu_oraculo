import { useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, LabelList,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface CategoryData {
    name: string;
    value: number;
    percentage: number;
}

interface CategoryPieChartProps {
    data: CategoryData[];
}

const COLORS = [
    '#f97316', '#3b82f6', '#a855f7', '#10b981', '#f43f5e',
    '#eab308', '#06b6d4', '#ec4899', '#84cc16', '#6366f1',
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: CategoryData }[] }) => {
    if (active && payload && payload.length) {
        const d = payload[0];
        return (
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs font-semibold text-text-primary">{d.name}</p>
                <p className="text-xs text-text-secondary">{formatCurrency(d.value)} — {d.payload.percentage}%</p>
            </div>
        );
    }
    return null;
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const [mode, setMode] = useState<'donut' | 'bar'>('donut');

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-xs text-text-secondary">Sem dados para exibir</p>
            </div>
        );
    }

    // Defined inside the component to close over `data` and access percentage by index
    const renderLabel = (props: {
        cx?: number | string; cy?: number | string; midAngle?: number;
        innerRadius?: number | string; outerRadius?: number | string; index?: number;
    }) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, index } = props;
        const pct = data[index ?? 0]?.percentage ?? 0;
        if (pct < 7) return null;
        const RADIAN = Math.PI / 180;
        const cxN = Number(cx); const cyN = Number(cy);
        const irN = Number(innerRadius); const orN = Number(outerRadius);
        const radius = irN + (orN - irN) * 0.5;
        const x = cxN + radius * Math.cos(-Number(midAngle ?? 0) * RADIAN);
        const y = cyN + radius * Math.sin(-Number(midAngle ?? 0) * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
                {`${Math.round(pct)}%`}
            </text>
        );
    };

    const barHeight = Math.max(data.length * 32, 160);

    return (
        <div>
            {/* Toggle buttons */}
            <div className="flex gap-1 mb-2">
                <button
                    onClick={() => setMode('donut')}
                    className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded transition-colors',
                        mode === 'donut'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-text-secondary hover:text-text-primary'
                    )}
                >
                    Donut
                </button>
                <button
                    onClick={() => setMode('bar')}
                    className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded transition-colors',
                        mode === 'bar'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-text-secondary hover:text-text-primary'
                    )}
                >
                    Barras
                </button>
            </div>

            {mode === 'donut' ? (
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={renderLabel}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                                <span style={{ fontSize: 10, color: '#9ca3af' }}>{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <ResponsiveContainer width="100%" height={barHeight}>
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                    >
                        <XAxis
                            type="number"
                            tick={false}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            <LabelList
                                dataKey="percentage"
                                position="right"
                                formatter={(v: number) => `${v}%`}
                                style={{ fontSize: 10, fill: '#9ca3af' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
