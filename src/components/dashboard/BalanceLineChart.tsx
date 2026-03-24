import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import type { LedgerTransaction } from '../../types';

interface BalanceLineChartProps {
    ledger: LedgerTransaction[];
    fixedExpenses: { value: number; paid: boolean; payment_date: string | null }[];
    month: string; // 'YYYY-MM'
    initialBalance: number; // balance carried from before this month
}

const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        return (
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-[10px] text-text-secondary mb-0.5">Dia {label}</p>
                <p className={`text-xs font-bold ${val < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(val)}
                </p>
            </div>
        );
    }
    return null;
};

export function BalanceLineChart({ ledger, fixedExpenses, month, initialBalance }: BalanceLineChartProps) {
    const chartData = useMemo(() => {
        const [year, monthNum] = month.split('-').map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const today = new Date();
        const currentDay = today.getFullYear() === year && today.getMonth() + 1 === monthNum
            ? today.getDate()
            : daysInMonth;

        // Build a map of daily net cash flow from ledger transactions
        const dailyFlow: Record<number, number> = {};
        ledger
            .filter(t => t.date.startsWith(month))
            .forEach(t => {
                const day = new Date(t.date).getDate();
                const delta = t.type === 'income' ? t.value : -t.value;
                dailyFlow[day] = (dailyFlow[day] || 0) + delta;
            });

        // Include paid fixed expenses
        fixedExpenses
            .filter(f => f.paid && f.payment_date?.startsWith(month))
            .forEach(f => {
                const day = new Date(f.payment_date! + 'T12:00:00').getDate();
                dailyFlow[day] = (dailyFlow[day] || 0) - f.value;
            });

        // Accumulate running balance 
        let running = initialBalance;
        return Array.from({ length: Math.min(daysInMonth, currentDay) }, (_, i) => {
            const day = i + 1;
            running += dailyFlow[day] || 0;
            return { day, balance: running };
        });
    }, [ledger, fixedExpenses, month, initialBalance]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-40">
                <p className="text-xs text-text-secondary">Sem movimentações este mês</p>
            </div>
        );
    }

    const hasNegative = chartData.some(d => d.balance < 0);
    const strokeColor = hasNegative ? '#f43f5e' : '#10b981';

    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                {hasNegative && <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />}
                <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: strokeColor }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
