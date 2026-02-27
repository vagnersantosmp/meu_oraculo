import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Modal, Header } from '../../components/ui';
import { formatCurrency, cn } from '../../lib/utils';
import { Plus, Trash2, Check, Pencil, BookOpen, CalendarDays, TrendingDown, TrendingUp, ToggleLeft, ToggleRight, CreditCard } from 'lucide-react';
import type { FixedExpense, RecurringBill } from '../../types';
import { CurrencyInput } from '../../components/CurrencyInput';

const FIXED_CATEGORIES = [
    'Moradia', 'Energia', 'Água', 'Internet', 'Telefone',
    'Seguro', 'Transporte', 'Educação', 'Saúde', 'Assinatura', 'Outros'
];

type Tab = 'month' | 'registry';

export function FixedExpenses() {
    const {
        fixedExpenses, updateFixedExpense, deleteFixedExpense, toggleFixedExpensePaid,
        recurringBills, addRecurringBill, updateRecurringBill, deleteRecurringBill, generateMonthlyBills,
        currentMonth, changeMonth, formatMonthDisplay
    } = useApp();

    const [tab, setTab] = useState<Tab>('month');
    const [showBillForm, setShowBillForm] = useState(false);
    const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
    const [editingInstance, setEditingInstance] = useState<FixedExpense | null>(null);

    // Real calendar month (today) — used to determine true overdue state
    const realCurrentMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    // Generate bills for the current real month and next month on load / when recurring bills change.
    // We intentionally do NOT include currentMonth here to avoid cascade on month navigation.
    useEffect(() => {
        generateMonthlyBills(realCurrentMonth);
        // Also generate next month so user can pre-fill upcoming bills
        const now = new Date();
        const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
        generateMonthlyBills(nextMonth);
    }, [generateMonthlyBills, realCurrentMonth]);

    // ── Month tab data ────────────────────────────────────────────────────────

    // Physical fixed expense instances for this month
    const monthInstances = useMemo(() => {
        return fixedExpenses.filter(f => {
            if (f.id.startsWith('virtual-invoice')) return false;

            // Always show bills due in the selected month
            if (f.due_date.startsWith(currentMonth)) return true;

            // Carry-over VENCIDA: ONLY when viewing the REAL current month
            // (not when browsing future or past months)
            if (currentMonth === realCurrentMonth) {
                const billMonth = f.due_date.substring(0, 7);
                if (billMonth < realCurrentMonth && !f.paid) return true;
            }

            return false;
        }).sort((a, b) => {
            const aOverdue = !a.paid && a.due_date.substring(0, 7) < realCurrentMonth;
            const bOverdue = !b.paid && b.due_date.substring(0, 7) < realCurrentMonth;
            // Overdue unpaid first, then current unpaid, then paid last
            if (a.paid !== b.paid) return a.paid ? 1 : -1;
            if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
            return new Date(a.due_date + 'T12:00:00').getTime() - new Date(b.due_date + 'T12:00:00').getTime();
        });
    }, [fixedExpenses, currentMonth, realCurrentMonth]);

    // Credit card invoices visible this month
    const creditInvoices = useMemo(() => {
        return fixedExpenses.filter(f => {
            if (!f.id.startsWith('virtual-invoice')) return false;
            if (!f.paid) return true;
            if (f.due_date.startsWith(currentMonth)) return true;
            // Also show in the closing month (ID encodes closing month as last two segments)
            const parts = f.id.split('-');
            const closingMonth0 = parseInt(parts[parts.length - 1]);
            const closingYear = parseInt(parts[parts.length - 2]);
            const closingMonthStr = `${closingYear}-${String(closingMonth0 + 1).padStart(2, '0')}`;
            return closingMonthStr === currentMonth;
        });
    }, [fixedExpenses, currentMonth]);

    // Summary for Fixed Expenses
    const totalEstimated = monthInstances.reduce((s, f) => s + (f.estimated_value ?? f.value), 0);
    const totalPaid = monthInstances.filter(f => f.paid).reduce((s, f) => s + f.value, 0);
    const totalPending = monthInstances.filter(f => !f.paid).reduce((s, f) => s + f.value, 0);

    // Summary for Credit Cards
    const totalCardInvoices = creditInvoices.reduce((s, inv) => s + inv.value, 0);
    const totalCardPaid = creditInvoices.filter(inv => inv.paid).reduce((s, inv) => s + inv.value, 0);
    const totalCardPending = creditInvoices.filter(inv => !inv.paid).reduce((s, inv) => s + inv.value, 0);

    const efficiencyPct = useMemo(() => {
        // Only variable bills matter — fixed ones always have the same value, variance = 0 always
        const variablePaid = monthInstances.filter(f => {
            if (!f.paid || !f.estimated_value || f.estimated_value <= 0) return false;
            const parentBill = recurringBills.find(b => b.id === f.recurring_bill_id);
            return parentBill?.is_variable === true;
        });
        if (variablePaid.length === 0) return null;
        const est = variablePaid.reduce((s, f) => s + (f.estimated_value ?? 0), 0);
        const real = variablePaid.reduce((s, f) => s + f.value, 0);
        return ((real - est) / est) * 100;
    }, [monthInstances, recurringBills]);

    const handleTogglePaid = (f: FixedExpense) => {
        toggleFixedExpensePaid(f.id, !f.paid, f.paid ? null : new Date().toISOString().split('T')[0]);
    };

    const handleRealValueChange = (id: string, value: number) => {
        updateFixedExpense(id, { value });
    };

    const monthLabel = formatMonthDisplay(currentMonth);
    const now = new Date();
    const realMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isFutureMonth = currentMonth > realMonth;

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 overflow-x-hidden">
            <Header
                title="Despesas Fixas"
                subtitle="Contas regulares e recorrentes"
                action={
                    <div className="flex items-center gap-2">
                        {tab === 'registry' && (
                            <button
                                onClick={() => { setEditingBill(null); setShowBillForm(true); }}
                                className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                                title="Nova conta"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>
                }
            />

            {/* Tab selector */}
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                <button
                    onClick={() => setTab('month')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
                        tab === 'month'
                            ? "bg-card text-text-primary shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                    )}
                >
                    <CalendarDays size={15} />
                    {monthLabel.split(' ')[0].charAt(0).toUpperCase() + monthLabel.split(' ')[0].slice(1)}
                </button>
                <button
                    onClick={() => setTab('registry')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
                        tab === 'registry'
                            ? "bg-card text-text-primary shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                    )}
                >
                    <BookOpen size={15} />
                    Cadastradas
                    {recurringBills.length > 0 && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{recurringBills.length}</span>
                    )}
                </button>
            </div>

            {/* ── TAB: MONTH VIEW ─────────────────────────────────────────── */}
            {tab === 'month' && (
                <div className="space-y-3">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-muted text-text-secondary transition-colors">◀</button>
                        <span className="text-sm font-semibold text-text-primary capitalize">{monthLabel}</span>
                        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-muted text-text-secondary transition-colors">▶</button>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-2">
                        <Card className="py-2 px-3 text-center">
                            <p className="text-[10px] text-text-secondary uppercase">Estimado</p>
                            <p className="text-sm font-bold text-text-primary">{formatCurrency(totalEstimated)}</p>
                        </Card>
                        <Card className="py-2 px-3 text-center bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30">
                            <p className="text-[10px] text-green-700 dark:text-green-400 uppercase">Pago</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-300">{formatCurrency(totalPaid)}</p>
                        </Card>
                        <Card className="py-2 px-3 text-center bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
                            <p className="text-[10px] text-red-700 dark:text-red-400 uppercase">Pendente</p>
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">{formatCurrency(totalPending)}</p>
                        </Card>
                    </div>

                    {/* Efficiency score */}
                    {efficiencyPct !== null && (
                        <Card className={cn(
                            "py-2 px-3 flex items-center gap-2",
                            efficiencyPct <= 0
                                ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-900/30"
                                : "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-900/30"
                        )}>
                            {efficiencyPct <= 0
                                ? <TrendingDown size={16} className="text-green-500 flex-shrink-0" />
                                : <TrendingUp size={16} className="text-red-500 flex-shrink-0" />
                            }
                            <p className="text-xs">
                                <span className={cn("font-bold", efficiencyPct <= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                    {efficiencyPct <= 0 ? '' : '+'}{efficiencyPct.toFixed(0)}%
                                </span>
                                {' '}{efficiencyPct <= 0 ? 'abaixo' : 'acima'} das estimativas nas contas pagas
                            </p>
                        </Card>
                    )}

                    {/* Month table */}
                    {monthInstances.length > 0 ? (
                        <Card className="overflow-hidden p-0">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-3 py-2 bg-muted border-b border-border">
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Conta</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase text-right w-20">Estimado</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase text-right w-24">Real</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase w-14"></span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase w-6"></span>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-border">
                                {monthInstances.map(f => {
                                    const parentBill = recurringBills.find(b => b.id === f.recurring_bill_id);
                                    const isVariable = parentBill?.is_variable ?? true;
                                    const estimated = f.estimated_value ?? f.value;
                                    const variance = estimated > 0 ? ((f.value - estimated) / estimated) * 100 : null;
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const isOverdue = !f.paid && f.due_date < todayStr;
                                    const isDueToday = !f.paid && !isOverdue && f.due_date === todayStr;
                                    const isUpcoming = !f.paid && !isOverdue && !isDueToday;

                                    return (
                                        <div
                                            key={f.id}
                                            className={cn(
                                                "grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-3 py-2.5 transition-colors",
                                                f.paid && "bg-muted/40",
                                                isOverdue && "border-l-4 border-red-500 bg-red-500/5 dark:bg-red-900/15",
                                                isDueToday && "border-l-4 border-amber-400 bg-amber-400/8 dark:bg-amber-900/15",
                                                isUpcoming && "border-l-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-900/10"
                                            )}
                                        >
                                            {/* Name + meta */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className={cn("text-sm font-medium text-text-primary truncate", f.paid && "line-through opacity-60")}>{f.description}</p>
                                                    {isOverdue && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold flex-shrink-0 animate-pulse">
                                                            VENCIDA
                                                        </span>
                                                    )}
                                                    {isDueToday && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold flex-shrink-0 animate-pulse">
                                                            HOJE
                                                        </span>
                                                    )}
                                                    {isUpcoming && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold flex-shrink-0">
                                                            NO PRAZO
                                                        </span>
                                                    )}
                                                    {!isVariable && !isOverdue && !isDueToday && !isUpcoming && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex-shrink-0">Fixa</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={cn("text-[10px]",
                                                        isOverdue ? "text-red-500 font-semibold" :
                                                            isDueToday ? "text-amber-600 dark:text-amber-400 font-semibold" :
                                                                isUpcoming ? "text-emerald-600 dark:text-emerald-400" :
                                                                    "text-text-secondary"
                                                    )}>
                                                        {isOverdue
                                                            ? `Venceu ${new Date(f.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                                                            : isDueToday
                                                                ? 'Vence hoje'
                                                                : `Vence ${new Date(f.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                                                        }
                                                    </span>
                                                    {/* Variance display */}
                                                    {variance !== null && f.paid && Math.abs(variance) > 0.5 && (
                                                        <span className={cn("text-[10px] font-semibold",
                                                            variance <= 0 ? "text-green-500" : variance <= 10 ? "text-yellow-500" : "text-red-500"
                                                        )}>
                                                            {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                                                        </span>
                                                    )}
                                                    {f.paid && f.payment_date && (
                                                        <span className="text-[10px] text-green-500">✓ Pago</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Estimated */}
                                            <span className="text-xs text-text-secondary text-right w-20 flex-shrink-0">{formatCurrency(estimated)}</span>

                                            {/* Real value — inline editable */}
                                            <div className="w-24 flex-shrink-0">
                                                {f.paid ? (
                                                    <span className={cn("text-sm font-semibold block text-right", variance !== null && variance > 10 ? "text-red-500" : variance !== null && variance <= 0 ? "text-green-500" : "text-text-primary")}>
                                                        {formatCurrency(f.value)}
                                                    </span>
                                                ) : (
                                                    <InlineInput
                                                        value={f.value}
                                                        onChange={(v) => handleRealValueChange(f.id, v)}
                                                    />
                                                )}
                                            </div>

                                            {/* Edit + Delete */}
                                            <div className="flex items-center gap-0.5 w-14 justify-end flex-shrink-0">
                                                <button
                                                    onClick={() => setEditingInstance(f)}
                                                    className="p-1.5 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(f.id)}
                                                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary hover:text-red-500 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>

                                            {/* Paid toggle */}
                                            <button
                                                onClick={() => handleTogglePaid(f)}
                                                className={cn(
                                                    "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                                    f.paid
                                                        ? "bg-green-500 border-green-500 text-white"
                                                        : "border-border hover:border-green-400"
                                                )}
                                            >
                                                {f.paid && <Check size={13} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2 text-center py-8">
                            <CalendarDays size={28} className="mx-auto text-text-secondary mb-2" />
                            {isFutureMonth ? (
                                <>
                                    <p className="text-sm text-text-secondary">Mês futuro</p>
                                    <p className="text-xs text-text-secondary mt-1">As contas serão geradas quando chegar o mês</p>
                                </>
                            ) : recurringBills.length === 0 ? (
                                <>
                                    <p className="text-sm text-text-secondary">Nenhuma conta cadastrada ainda</p>
                                    <Button variant="ghost" className="text-primary mt-2 text-sm" onClick={() => setTab('registry')}>
                                        Cadastrar contas →
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-text-secondary">Nenhuma conta para este mês</p>
                            )}
                        </Card>
                    )}

                    {/* Credit card invoices */}
                    {creditInvoices.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                <CreditCard size={13} className="text-pink-500" />
                                <span className="text-[11px] font-semibold text-text-secondary uppercase">Faturas de Cartão</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <Card className="py-2 px-3 text-center border-pink-100 dark:border-pink-900/30">
                                    <p className="text-[10px] text-pink-700 dark:text-pink-400 uppercase">Total</p>
                                    <p className="text-sm font-bold text-pink-700 dark:text-pink-300">{formatCurrency(totalCardInvoices)}</p>
                                </Card>
                                <Card className="py-2 px-3 text-center bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30">
                                    <p className="text-[10px] text-green-700 dark:text-green-400 uppercase">Pago</p>
                                    <p className="text-sm font-bold text-green-700 dark:text-green-300">{formatCurrency(totalCardPaid)}</p>
                                </Card>
                                <Card className="py-2 px-3 text-center bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
                                    <p className="text-[10px] text-red-700 dark:text-red-400 uppercase">Pendente</p>
                                    <p className="text-sm font-bold text-red-700 dark:text-red-300">{formatCurrency(totalCardPending)}</p>
                                </Card>
                            </div>

                            <div className="space-y-1">
                                {creditInvoices.map(inv => {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const invOverdue = !inv.paid && inv.due_date < todayStr;
                                    const invDueToday = !inv.paid && inv.due_date === todayStr;
                                    const invUpcoming = !inv.paid && !invOverdue && !invDueToday;

                                    return (
                                        <Card
                                            key={inv.id}
                                            className={cn(
                                                "py-2.5 px-3 flex items-center gap-3 transition-colors overflow-hidden",
                                                inv.paid && "opacity-60",
                                                invOverdue && "border-l-4 border-red-500 bg-red-500/5 dark:bg-red-900/15",
                                                invDueToday && "border-l-4 border-amber-400 bg-amber-400/8 dark:bg-amber-900/15",
                                                invUpcoming && "border-l-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-900/10"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className={cn("text-sm font-medium text-text-primary truncate", inv.paid && "line-through")}>{inv.description}</p>
                                                    {invOverdue && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold flex-shrink-0 animate-pulse">VENCIDA</span>
                                                    )}
                                                    {invDueToday && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold flex-shrink-0 animate-pulse">HOJE</span>
                                                    )}
                                                    {invUpcoming && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold flex-shrink-0">NO PRAZO</span>
                                                    )}
                                                </div>
                                                <p className={cn("text-[10px] mt-0.5",
                                                    invOverdue ? "text-red-500 font-semibold" :
                                                        invDueToday ? "text-amber-600 dark:text-amber-400 font-semibold" :
                                                            invUpcoming ? "text-emerald-600 dark:text-emerald-400" :
                                                                "text-text-secondary"
                                                )}>
                                                    {invOverdue
                                                        ? `Venceu ${new Date(inv.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                                        : invDueToday
                                                            ? 'Vence hoje'
                                                            : `Vence ${new Date(inv.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                                    }
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-pink-600 dark:text-pink-400 flex-shrink-0">{formatCurrency(inv.value)}</span>
                                            <button
                                                onClick={() => handleTogglePaid(inv)}
                                                className={cn(
                                                    "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                                    inv.paid ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-green-400"
                                                )}
                                            >
                                                {inv.paid && <Check size={13} />}
                                            </button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: REGISTRY ───────────────────────────────────────────── */}
            {tab === 'registry' && (
                <div className="space-y-3">
                    <p className="text-xs text-text-secondary px-1">
                        Cadastre suas contas fixas aqui. Elas serão geradas automaticamente todo mês na aba do mês atual.
                    </p>

                    {recurringBills.length > 0 ? (
                        <Card className="overflow-hidden p-0">
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 bg-muted border-b border-border">
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Conta</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Estimativa</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Vence</span>
                                <span className="w-12"></span>
                            </div>
                            {/* Rows */}
                            <div className="divide-y divide-border">
                                {recurringBills.map(b => (
                                    <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2.5">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-text-primary truncate">{b.description}</p>
                                                <span className={cn(
                                                    "text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0",
                                                    b.is_variable
                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                                )}>
                                                    {b.is_variable ? 'Variável' : 'Fixa'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-text-secondary mt-0.5">{b.category}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-text-primary whitespace-nowrap">{formatCurrency(b.estimated_value)}</span>
                                        <span className="text-xs text-text-secondary whitespace-nowrap">Dia {b.due_day}</span>
                                        <div className="flex items-center gap-1 w-12 justify-end">
                                            <button onClick={() => { setEditingBill(b); setShowBillForm(true); }} className="p-1 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => setDeleteBillId(b.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2 text-center py-10">
                            <BookOpen size={28} className="mx-auto text-text-secondary mb-2" />
                            <p className="text-sm text-text-secondary">Nenhuma conta cadastrada</p>
                            <Button variant="ghost" className="text-primary mt-2" onClick={() => { setEditingBill(null); setShowBillForm(true); }}>
                                <Plus size={16} className="mr-1" /> Adicionar conta
                            </Button>
                        </Card>
                    )}
                </div>
            )}

            {/* ── MODALS ─────────────────────────────────────────────────── */}

            {/* Bill Form Modal */}
            <BillFormModal
                isOpen={showBillForm}
                bill={editingBill}
                onClose={() => { setShowBillForm(false); setEditingBill(null); }}
                onSave={async (data) => {
                    if (editingBill) {
                        updateRecurringBill(editingBill.id, data);
                    } else {
                        await addRecurringBill(data);
                        setTimeout(() => generateMonthlyBills(currentMonth), 400);
                    }
                    setShowBillForm(false);
                    setEditingBill(null);
                }}
            />

            {/* Edit instance */}
            <EditInstanceModal
                instance={editingInstance}
                onClose={() => setEditingInstance(null)}
                onSave={(data) => {
                    if (editingInstance) {
                        updateFixedExpense(editingInstance.id, data);
                        setEditingInstance(null);
                    }
                }}
            />

            {/* Delete instance */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Remover despesa">
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">Remover esta despesa deste mês? O modelo recorrente não será excluído.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { deleteConfirmId && deleteFixedExpense(deleteConfirmId); setDeleteConfirmId(null); }}>Remover</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete recurring bill */}
            <Modal isOpen={!!deleteBillId} onClose={() => setDeleteBillId(null)} title="Excluir modelo">
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">Excluir este modelo? Ele não será mais gerado nos próximos meses. As instâncias já criadas não são afetadas.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setDeleteBillId(null)}>Cancelar</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { deleteBillId && deleteRecurringBill(deleteBillId); setDeleteBillId(null); }}>Excluir</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ── Bill Form Modal ────────────────────────────────────────────────────────────
function BillFormModal({ isOpen, bill, onClose, onSave }: {
    isOpen: boolean;
    bill: RecurringBill | null;
    onClose: () => void;
    onSave: (data: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>) => void;
}) {
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('Outros');
    const [estimatedValue, setEstimatedValue] = useState(0);
    const [isVariable, setIsVariable] = useState(true);
    const [dueDay, setDueDay] = useState(10);

    useEffect(() => {
        if (isOpen) {
            setDesc(bill?.description ?? '');
            setCategory(bill?.category ?? 'Outros');
            setEstimatedValue(bill?.estimated_value ?? 0);
            setIsVariable(bill?.is_variable ?? true);
            setDueDay(bill?.due_day ?? 10);
        }
    }, [bill, isOpen]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={bill ? 'Editar Conta' : 'Nova Conta Fixa'}>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Descrição</label>
                    <Input placeholder="Ex: Água, Luz, Netflix..." value={desc} onChange={e => setDesc(e.target.value)} autoFocus />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Categoria</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full h-10 rounded-lg border border-border bg-card text-text-primary text-sm px-3">
                        {FIXED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Type toggle */}
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Tipo</label>
                    <button
                        type="button"
                        onClick={() => setIsVariable(!isVariable)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                            isVariable
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                        )}
                    >
                        {isVariable
                            ? <ToggleRight size={22} className="text-blue-500 flex-shrink-0" />
                            : <ToggleLeft size={22} className="text-purple-500 flex-shrink-0" />
                        }
                        <div>
                            <p className={cn("text-sm font-semibold", isVariable ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300")}>
                                {isVariable ? 'Variável' : 'Valor Fixo'}
                            </p>
                            <p className="text-[11px] text-text-secondary">
                                {isVariable ? 'O valor muda todo mês (água, luz...)' : 'Mesmo valor todo mês (internet, aluguel...)'}
                            </p>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">
                            {isVariable ? 'Estimativa Mensal' : 'Valor Mensal'}
                        </label>
                        <CurrencyInput value={estimatedValue} onChange={setEstimatedValue} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Dia Vencimento</label>
                        <Input type="number" min="1" max="31" value={String(dueDay)} onChange={e => setDueDay(Number(e.target.value))} />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => onSave({ description: desc, category, estimated_value: estimatedValue, is_variable: isVariable, due_day: dueDay, active: true })}
                        disabled={!desc || estimatedValue <= 0 || dueDay < 1 || dueDay > 31}
                    >
                        Salvar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Inline number input ────────────────────────────────────────────────────────
function InlineInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [local, setLocal] = useState(value);
    const [editing, setEditing] = useState(false);

    useEffect(() => { setLocal(value); }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className={cn(
                    "text-right w-full text-sm font-semibold transition-colors",
                    value > 0 ? "text-text-primary" : "text-primary underline underline-offset-2 hover:text-primary/80"
                )}
            >
                {value > 0 ? formatCurrency(value) : 'Informar'}
            </button>
        );
    }

    return (
        <CurrencyInput
            value={local}
            onChange={setLocal}
            className="h-7 text-xs py-0 px-1.5 rounded"
            onBlur={() => { setEditing(false); if (local !== value) onChange(local); }}
            autoFocus
        />
    );
}

// ── Edit Instance Modal ────────────────────────────────────────────────────────
function EditInstanceModal({ instance, onClose, onSave }: {
    instance: FixedExpense | null;
    onClose: () => void;
    onSave: (data: Partial<Pick<FixedExpense, 'description' | 'value' | 'estimated_value' | 'due_date'>>) => void;
}) {
    const [desc, setDesc] = useState('');
    const [realValue, setRealValue] = useState(0);
    const [estimatedValue, setEstimatedValue] = useState(0);
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (instance) {
            setDesc(instance.description);
            setRealValue(instance.value);
            setEstimatedValue(instance.estimated_value ?? instance.value);
            setDueDate(instance.due_date);
        }
    }, [instance]);

    if (!instance) return null;

    return (
        <Modal isOpen={!!instance} onClose={onClose} title="Editar Despesa">
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Descrição</label>
                    <Input value={desc} onChange={e => setDesc(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Estimativa</label>
                        <CurrencyInput value={estimatedValue} onChange={setEstimatedValue} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Valor Real</label>
                        <CurrencyInput value={realValue} onChange={setRealValue} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Data de Vencimento</label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => onSave({ description: desc, value: realValue, estimated_value: estimatedValue, due_date: dueDate })}
                        disabled={!desc}
                    >
                        Salvar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
