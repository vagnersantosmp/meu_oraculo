import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface IncomeExpenseBarChartProps {
    income: number;
    expense: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs font-semibold text-text-primary">{payload[0].name}</p>
                <p className="text-xs text-text-secondary">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export function IncomeExpenseBarChart({ income, expense }: IncomeExpenseBarChartProps) {
    const data = [
        { name: 'Receitas', value: income, color: '#10b981' },
        { name: 'Despesas', value: expense, color: '#f43f5e' },
    ];

    const maxValue = Math.max(income, expense, 1);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, maxValue * 1.2]}
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    width={38}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
