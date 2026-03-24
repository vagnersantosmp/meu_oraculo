import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui';
import { AccessibilityMenu } from '../components/AccessibilityMenu';
import { formatCurrency, cn } from '../lib/utils';
import { useFinancialSummary } from '../hooks/useFinancialSummary';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { IncomeExpenseBarChart } from '../components/dashboard/IncomeExpenseBarChart';
import { BalanceLineChart } from '../components/dashboard/BalanceLineChart';
import {
    TrendingUp, TrendingDown, BarChart2, ChevronDown,
    ArrowDown, Bell, Flame, ArrowRight, ChevronRight, CalendarDays, Check
} from 'lucide-react';

export function Dashboard() {
    const { getCarAlerts, ledger, fixedExpenses, creditTransactions, monthlyGoals, currentMonth, changeMonth, formatMonthDisplay } = useApp();
    const navigate = useNavigate();
    const carAlert = getCarAlerts();

    // ── Collapsible Reports Section ──
    const [reportsOpen, setReportsOpen] = useState<boolean>(() => {
        try { return localStorage.getItem('reportsOpen') !== 'false'; } catch { return true; }
    });
    const toggleReports = () => setReportsOpen(prev => {
        const next = !prev;
        try { localStorage.setItem('reportsOpen', String(next)); } catch { /* ignore */ }
        return next;
    });
    // ── Canonical financial calculations via shared hook ──
    const summary = useFinancialSummary({ month: currentMonth, ledger, fixedExpenses, monthlyGoals });

    // ── Display-only data (not used in balance calculations) ──
    const monthData = useMemo(() => {
        const monthStr = currentMonth;

        // All ledger transactions this month (for recent expenses list / top categories)
        const transactions = ledger.filter(t => t.date.startsWith(monthStr));

        // Fixed expenses visible this month (for UI card)
        const fixed = fixedExpenses.filter(f => {
            if (!f.id.startsWith('virtual-invoice') && f.due_date.startsWith(monthStr)) return true;
            // Virtual (credit card) invoices: show if due this month or already overdue — NOT future months
            if (f.id.startsWith('virtual-invoice') && !f.paid && f.due_date.substring(0, 7) <= monthStr) return true;
            if (f.id.startsWith('virtual-invoice') && f.paid && f.payment_date?.startsWith(monthStr)) return true;
            return false;
        });

        // Credit card individual purchases this month (for display only)
        const creditTxns = creditTransactions.filter(t => t.date.startsWith(monthStr));

        return { transactions, fixed, creditTxns };
    }, [currentMonth, ledger, fixedExpenses, creditTransactions]);



    // Derived Lists for UI
    // Shared category totals (ledger + fixed expenses paid + credit invoices)
    const catTotals = useMemo(() => {
        const expenses = monthData.transactions.filter(t => t.type === 'expense');
        const totals: Record<string, number> = {};
        expenses.forEach(t => {
            totals[t.category] = (totals[t.category] || 0) + t.value;
        });
        const paidInvoiceTotal = monthData.fixed
            .filter(f => f.id.startsWith('virtual-invoice') && f.paid)
            .reduce((s, f) => s + f.value, 0);
        if (paidInvoiceTotal > 0) {
            totals['Cartão de Crédito'] = (totals['Cartão de Crédito'] || 0) + paidInvoiceTotal;
        }
        monthData.fixed
            .filter(f => !f.id.startsWith('virtual-invoice') && f.paid)
            .forEach(f => {
                const cat = f.category || 'Contas Fixas';
                totals[cat] = (totals[cat] || 0) + f.value;
            });
        return totals;
    }, [monthData.transactions, monthData.fixed]);

    // Top 5 for ranking list widget
    const top5Categories = useMemo(() => {
        const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
        return Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 }));
    }, [catTotals]);

    // All categories for pie chart (full expense overview)
    const allCategories = useMemo(() => {
        const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
        return Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 }));
    }, [catTotals]);


    const recentExpenses = useMemo(() => {
        // Merge Ledger expenses with Paid Fixed Expenses for unified history
        const ledgerExpenses = monthData.transactions.filter(t => t.type === 'expense').map(t => ({
            id: t.id,
            description: t.description,
            date: t.date,
            value: t.value,
            category: t.category
        }));

        // Fixed expenses paid this month
        const fixedExpensesPaid = monthData.fixed.filter(f => f.paid && f.payment_date).map(f => ({
            id: f.id,
            description: f.description,
            date: f.payment_date + 'T12:00:00',
            value: f.value,
            category: f.category
        }));

        // Credit card individual purchases this month
        const cardExpenses = (monthData.creditTxns ?? []).map(t => ({
            id: t.id,
            description: t.description,
            date: t.date,
            value: t.value,
            category: t.category ?? 'Cartão de Crédito'
        }));

        return [...ledgerExpenses, ...fixedExpensesPaid, ...cardExpenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8);
    }, [monthData.transactions, monthData.fixed, monthData.creditTxns]);

    const recentIncome = useMemo(() => {
        return [...monthData.transactions]
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4);
    }, [monthData.transactions]);

    const pendingBills = useMemo(() => {
        // Filter from monthData.fixed
        return monthData.fixed
            .filter(f => !f.paid)
            .sort((a, b) => new Date(a.due_date + 'T12:00:00').getTime() - new Date(b.due_date + 'T12:00:00').getTime());
    }, [monthData.fixed]);

    const paidBillsCount = monthData.fixed.filter(f => f.paid).length;

    // Alerts
    const alerts = useMemo(() => {
        const list: { color: string; msg: string; go: string }[] = [];
        const now = new Date();

        // Car Alert (Global)
        if (carAlert && carAlert.status !== 'OK') {
            list.push({
                color: carAlert.status === 'URGENTE' ? 'text-red-500' : 'text-yellow-500',
                msg: `🚗 ${carAlert.type} em ${carAlert.remainingKm}km`,
                go: '/car'
            });
        }

        // Month Balance Alert
        if (summary.currentBalance < 0) {
            const monthName = new Date(currentMonth + '-15').toLocaleDateString('pt-BR', { month: 'long' });
            list.push({ color: 'text-red-500', msg: `💰 Saldo negativo em ${monthName}: ${formatCurrency(summary.currentBalance)}`, go: '/ledger' });
        } else if (summary.projectedBalance < 0 && summary.fixedPending > 0) {
            list.push({ color: 'text-yellow-600 dark:text-yellow-500', msg: `⚠️ Déficit Projetado: As contas fixas vão consumir todo o saldo e faltarão ${formatCurrency(Math.abs(summary.projectedBalance))}`, go: '/bills' });
        }

        // Income vs Expense
        const totalExpense = summary.monthLedgerExpense + summary.monthFixedPaid;
        if (summary.monthIncome > 0 && totalExpense >= summary.monthIncome) {
            list.push({ color: 'text-red-500', msg: `📊 Despesas superaram receitas!`, go: '/ledger' });
        } else if (summary.monthIncome > 0 && totalExpense > summary.monthIncome * 0.8) {
            list.push({ color: 'text-yellow-500', msg: `⚠️ Comprometido 80%+ da receita`, go: '/ledger' });
        }

        if (top5Categories.length > 0 && top5Categories[0].percentage > 40) {
            list.push({ color: 'text-yellow-500', msg: `🔥 "${top5Categories[0].name}" = ${top5Categories[0].percentage}% dos gastos`, go: '/ledger' });
        }

        // Pending Bills Overdue (relative to real time)
        if (pendingBills.length > 0) {
            const overdue = pendingBills.filter(b => new Date(b.due_date + 'T12:00:00') <= now);
            if (overdue.length > 0) {
                list.push({ color: 'text-red-500', msg: `📅 ${overdue.length} conta(s) vencida(s)!`, go: '/bills' });
            }
        }

        return list;
    }, [carAlert, summary, top5Categories, pendingBills, currentMonth]);

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 overflow-x-hidden">
            {/* Header with Month Selector */}
            <header className="flex justify-between items-center mb-1">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Meu Oráculo</h1>
                    <p className="text-xs text-text-secondary">Visão geral financeira</p>
                </div>

                {/* Month Selector and Accessibility */}
                <div className="flex items-center gap-3">
                    <AccessibilityMenu />

                    <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-muted rounded-l-lg text-text-secondary">
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-text-primary capitalize min-w-[100px] text-center">
                            {formatMonthDisplay(currentMonth)}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-muted rounded-r-lg text-text-secondary">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Balance + Income/Expense in one row */}
            <div className="grid grid-cols-3 gap-2">
                {/* ── Saldo Atual com detalhamento ── */}
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none dark:from-black dark:to-gray-900 py-2.5 px-3 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase">Saldo Atual</p>
                        <p className="text-lg sm:text-xl font-bold mt-0.5 leading-none">{formatCurrency(summary.currentBalance)}</p>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-gray-700/50 space-y-0.5">
                        {summary.openingBalance !== 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-500">Mês anterior</span>
                                <span className={cn("text-[9px] font-medium", summary.openingBalance >= 0 ? "text-gray-300" : "text-red-400")}>
                                    {summary.openingBalance >= 0 ? '+' : ''}{formatCurrency(summary.openingBalance)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-500">Receitas</span>
                            <span className="text-[9px] font-medium text-green-400">+{formatCurrency(summary.monthIncome)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-500">Despesas</span>
                            <span className="text-[9px] font-medium text-red-400">-{formatCurrency(summary.monthLedgerExpense + summary.monthFixedPaid)}</span>
                        </div>
                        {summary.fixedPending > 0 && (
                            <div className="flex justify-between items-center pt-0.5 border-t border-gray-700/50">
                                <span className="text-[9px] text-gray-500">Livre Projetado</span>
                                <span className={cn("text-[9px] font-semibold", summary.projectedBalance < 0 ? "text-red-400" : "text-gray-300")}>
                                    {formatCurrency(summary.projectedBalance)}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── Receitas ── */}
                <Card className="bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30 py-3 px-3">
                    <div className="flex items-center gap-1 mb-0.5">
                        <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
                        <p className="text-[10px] text-green-700 dark:text-green-400 uppercase">Receitas</p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.monthIncome)}</p>
                </Card>

                {/* ── Despesas ── */}
                <Card className="bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 py-3 px-3">
                    <div className="flex items-center gap-1 mb-0.5">
                        <TrendingDown size={12} className="text-red-600 dark:text-red-400" />
                        <p className="text-[10px] text-red-700 dark:text-red-400 uppercase">Despesas</p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.monthLedgerExpense + summary.monthFixedPaid)}</p>
                </Card>
            </div>

            {/* Alerts bar — compact horizontal strip */}
            {alerts.length > 0 && (
                <Card className="py-2 px-3 space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Bell size={12} className="text-text-secondary" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Avisos ({alerts.length})</span>
                    </div>
                    {alerts.map((a, i) => (
                        <div key={i} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1" onClick={() => navigate(a.go)}>
                            <span className={cn("text-xs font-medium", a.color)}>{a.msg}</span>
                            <ChevronRight size={12} className="text-text-secondary flex-shrink-0" />
                        </div>
                    ))}
                </Card>
            )}

            {/* ── Reports Section (collapsible) ──────────────────────────── */}
            <Card className="py-2.5 px-3">
                {/* Header / toggle button */}
                <button
                    onClick={toggleReports}
                    className="w-full flex items-center justify-between group"
                    aria-expanded={reportsOpen}
                    aria-label="Relatórios do Mês"
                >
                    <div className="flex items-center gap-1.5">
                        <BarChart2 size={12} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Relatórios do Mês</span>
                    </div>
                    <ChevronDown
                        size={14}
                        className={cn(
                            'text-text-secondary transition-transform duration-300',
                            reportsOpen ? 'rotate-180' : 'rotate-0'
                        )}
                    />
                </button>

                {/* Collapsible content */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        reportsOpen ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
                    )}
                >
                    {/* Pie + Bar side by side on md+ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Category Pie Chart */}
                        <div>
                            <p className="text-[10px] font-semibold text-text-secondary uppercase mb-1">Despesas por Categoria</p>
                            <CategoryPieChart data={allCategories} />
                        </div>

                        {/* Income vs Expense Bar Chart */}
                        <div>
                            <p className="text-[10px] font-semibold text-text-secondary uppercase mb-1">Receitas vs Despesas</p>
                            <IncomeExpenseBarChart
                                income={summary.monthIncome}
                                expense={summary.monthLedgerExpense + summary.monthFixedPaid}
                            />
                        </div>
                    </div>

                    {/* Balance Line Chart — full width */}
                    <div>
                        <p className="text-[10px] font-semibold text-text-secondary uppercase mb-1">Evolução do Saldo</p>
                        <BalanceLineChart
                            ledger={ledger}
                            fixedExpenses={monthData.fixed.map(f => ({ value: f.value, paid: f.paid, payment_date: f.payment_date ?? null }))}
                            month={currentMonth}
                            initialBalance={0}
                        />
                    </div>
                </div>
            </Card>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Top 5 categories */}
                {top5Categories.length > 0 ? (
                    <Card className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Flame size={12} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Top 5 despesas</span>
                        </div>
                        <div className="space-y-1.5">
                            {top5Categories.map((cat, i) => (
                                <div key={cat.name} className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-bold w-4 text-center flex-shrink-0",
                                        i === 0 ? "text-orange-500" : "text-text-secondary"
                                    )}>{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-medium text-text-primary truncate">{cat.name}</span>
                                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                <span className="text-[10px] text-text-secondary">{cat.percentage}%</span>
                                                <span className="text-xs font-bold text-text-primary">{formatCurrency(cat.value)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full">
                                            <div className={cn("h-full rounded-full", i === 0 ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-blue-400/60 dark:bg-blue-500/40")} style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card className="py-2.5 px-3 flex items-center justify-center">
                        <p className="text-xs text-text-secondary">Sem despesas este mês</p>
                    </Card>
                )}

                {/* Recent expenses — compact list */}
                <Card className="py-2 px-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Despesas recentes</span>
                        <button onClick={() => navigate('/ledger')} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                            Ver tudo <ArrowRight size={10} />
                        </button>
                    </div>
                    {recentExpenses.length > 0 ? (
                        <div className="space-y-1">
                            {recentExpenses.map(t => (
                                <div key={t.id} className="flex items-center gap-2 py-1">
                                    <ArrowDown size={10} className="text-red-500 flex-shrink-0" />
                                    <span className="text-xs text-text-primary truncate flex-1">{t.description}</span>
                                    <span className="text-[10px] text-text-secondary whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                        -{formatCurrency(t.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary text-center py-2">Nenhuma despesa</p>
                    )}
                </Card>
            </div>

            {/* Fixed Expenses & Recent Income Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Fixed Expenses widget */}
                <Card className="py-2.5 px-3 h-full">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Contas Fixas</span>
                        </div>
                        <button onClick={() => navigate('/bills')} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                            Ver tudo <ArrowRight size={10} />
                        </button>
                    </div>
                    {monthData.fixed.length > 0 ? (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-[10px] text-text-secondary">{pendingBills.length} pendente(s)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-[10px] text-text-secondary">{paidBillsCount} paga(s)</span>
                                </div>
                            </div>
                            {pendingBills.length > 0 ? (
                                <div className="space-y-1">
                                    {pendingBills.slice(0, 3).map(f => (
                                        <div key={f.id} className="flex items-center gap-2 py-0.5">
                                            <span className={cn("text-[10px] font-bold flex-shrink-0",
                                                new Date(f.due_date + 'T12:00:00') <= new Date() ? "text-red-500" : "text-text-secondary"
                                            )}>{new Date(f.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                            <span className="text-xs text-text-primary truncate flex-1">{f.description}</span>
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">{formatCurrency(f.value)}</span>
                                        </div>
                                    ))}
                                    {pendingBills.length > 3 && (
                                        <p className="text-[10px] text-text-secondary text-center">+{pendingBills.length - 3} mais</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 py-1">
                                    <Check size={12} className="text-green-500" />
                                    <span className="text-xs text-green-600 dark:text-green-400">Todas as contas pagas!</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-text-secondary text-center py-4">Nenhuma conta fixa para {formatMonthDisplay(currentMonth)}</p>
                    )}
                </Card>

                {/* Recent Income widget */}
                <Card className="py-2.5 px-3 h-full">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-green-500" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Últimas Receitas</span>
                        </div>
                        <button onClick={() => navigate('/ledger')} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                            Ver tudo <ArrowRight size={10} />
                        </button>
                    </div>
                    {recentIncome.length > 0 ? (
                        <div className="space-y-1">
                            {recentIncome.map(t => (
                                <div key={t.id} className="flex items-center gap-2 py-1">
                                    <TrendingUp size={10} className="text-green-500 flex-shrink-0" />
                                    <span className="text-xs text-text-primary truncate flex-1">{t.description}</span>
                                    <span className="text-[10px] text-text-secondary whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                        +{formatCurrency(t.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary text-center py-4">Nenhuma receita recente</p>
                    )}
                </Card>
            </div>


        </div>
    );
}
