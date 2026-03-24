import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header, Input, Select, Modal } from '../../components/ui';
import { CurrencyInput } from '../../components/CurrencyInput';
import {
    ArrowUp, ArrowDown, Plus, Trash2, Pencil, Search,
    ChevronLeft, ChevronRight, Wallet, Receipt, CalendarDays, RotateCcw, Target, PiggyBank
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { getLedgerCategoryColor, getLedgerCategoryNames } from '../../lib/ledger-categories';
import type { PaymentMethod, TransactionType, LedgerTransaction } from '../../types';
import { useFinancialSummary } from '../../hooks/useFinancialSummary';

export function Ledger() {
    const {
        ledger, addTransaction, updateTransaction, deleteTransaction,
        stats, fixedExpenses, monthlyGoals, setMonthlyGoal,
        creditTransactions, addCreditTransaction, updateCreditTransaction, deleteCreditTransaction,
        currentMonth, changeMonth, formatMonthDisplay
    } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [tempGoal, setTempGoal] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);
    const [viewingTransaction, setViewingTransaction] = useState<LedgerTransaction | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Period mode: 'month' or 'range'
    const [periodMode, setPeriodMode] = useState<'month' | 'range'>('month');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');

    const todayMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const isCurrentMonth = currentMonth === todayMonth;


    const monthLabel = useMemo(() => {
        return formatMonthDisplay(currentMonth);
    }, [currentMonth, formatMonthDisplay]);

    const prevMonth = () => changeMonth(-1);
    const nextMonth = () => changeMonth(1);

    const goToToday = () => {
        // Reset to today's month by computing delta
        const [cy, cm] = currentMonth.split('-').map(Number);
        const now = new Date();
        const delta = (now.getFullYear() - cy) * 12 + (now.getMonth() + 1 - cm);
        if (delta !== 0) changeMonth(delta);
        setPeriodMode('month');
    };

    // Filter by month, type, and search (BUT NOT CATEGORY)
    const baseLedger = useMemo(() => {
        return ledger.filter(t => {
            const tDate = new Date(t.date);

            // Date range filtering
            if (periodMode === 'month') {
                const tMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
                if (tMonth !== currentMonth) return false;
            } else {
                if (rangeStart && tDate < new Date(rangeStart + 'T00:00:00')) return false;
                if (rangeEnd && tDate > new Date(rangeEnd + 'T23:59:59')) return false;
            }

            if (filterType !== 'all' && t.type !== filterType) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!t.description.toLowerCase().includes(term) && !t.category.toLowerCase().includes(term)) return false;
            }
            return true;
        });
    }, [ledger, currentMonth, periodMode, rangeStart, rangeEnd, filterType, searchTerm]);

    // Build virtual ledger entries from paid credit card invoices (for display only, no impact on totals)
    const virtualInvoiceEntries = useMemo((): LedgerTransaction[] => {
        if (filterType === 'income') return []; // Don't show in income filter

        return fixedExpenses
            .filter(f => {
                if (!f.id.startsWith('virtual-invoice-') || !f.paid || !f.payment_date) return false;

                const payDate = f.payment_date + 'T12:00:00';
                if (periodMode === 'month') {
                    return payDate.startsWith(currentMonth);
                } else {
                    const d = new Date(payDate);
                    if (rangeStart && d < new Date(rangeStart + 'T00:00:00')) return false;
                    if (rangeEnd && d > new Date(rangeEnd + 'T23:59:59')) return false;
                    return true;
                }
            })
            .filter(f => {
                if (filterCategory !== 'all' && f.category !== filterCategory) return false;
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    if (!f.description.toLowerCase().includes(term) && !f.category.toLowerCase().includes(term)) return false;
                }
                return true;
            })
            .map(f => ({
                id: f.id, // use the virtual-invoice id as unique key
                user_id: f.user_id,
                date: f.payment_date! + 'T12:00:00',
                type: 'expense' as const,
                category: 'Cartão de Crédito',
                description: f.description,
                value: f.value,
                payment_method: 'credito' as const,
                source: 'system' as const,
                source_ref: f.id, // starts with 'virtual-invoice-' — used to identify these entries
                created_at: f.created_at
            }));
    }, [fixedExpenses, currentMonth, periodMode, rangeStart, rangeEnd, filterType, filterCategory, searchTerm]);

    const filteredLedger = useMemo(() => {
        return baseLedger.filter(t => filterCategory === 'all' || t.category === filterCategory);
    }, [baseLedger, filterCategory]);

    // Sort by date desc — merge ledger entries with virtual invoice entries for display only
    const sortedLedger = useMemo(() => {
        return [...filteredLedger, ...virtualInvoiceEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredLedger, virtualInvoiceEntries]);

    // Group by day
    const groupedByDay = useMemo(() => {
        const groups: Record<string, LedgerTransaction[]> = {};
        sortedLedger.forEach(t => {
            const dayKey = t.date.split('T')[0];
            if (!groups[dayKey]) groups[dayKey] = [];
            groups[dayKey].push(t);
        });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [sortedLedger]);

    // Monthly totals (calculated directly from filteredLedger + paid fixedExpenses)
    const monthTotals = useMemo(() => {
        const income = filteredLedger.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
        // Exclude virtual-invoice ledger entries — they are already counted via fixedPaid below
        const expense = filteredLedger
            .filter(t => t.type === 'expense' && !(t.source === 'system' && t.source_ref?.startsWith('virtual-invoice-')))
            .reduce((s, t) => s + t.value, 0);

        let fixedPaid = 0;
        if (filterType === 'all' || filterType === 'expense') {
            const periodFixed = fixedExpenses.filter(f => {
                if (!f.paid || !f.payment_date) return false;
                if (filterCategory !== 'all' && f.category !== filterCategory) return false;

                const fDate = new Date(f.payment_date + 'T12:00:00');
                if (periodMode === 'month') {
                    const fMonth = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;
                    return fMonth === currentMonth;
                } else {
                    if (rangeStart && fDate < new Date(rangeStart + 'T00:00:00')) return false;
                    if (rangeEnd && fDate > new Date(rangeEnd + 'T23:59:59')) return false;
                    return true;
                }
            });
            fixedPaid = periodFixed.reduce((s, f) => s + f.value, 0);
        }

        const totalExpense = expense + fixedPaid;
        return { income, expense: totalExpense, balance: income - totalExpense };
    }, [filteredLedger, fixedExpenses, currentMonth, periodMode, rangeStart, rangeEnd, filterType, filterCategory]);

    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        // Build categories from baseLedger + virtual invoice entries
        baseLedger.forEach(t => cats.add(t.category));
        virtualInvoiceEntries.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    }, [baseLedger, virtualInvoiceEntries]);

    const handleOpenNew = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (t: LedgerTransaction) => {
        setEditingTransaction(t);
        setIsModalOpen(true);
    };

    const handleView = (t: LedgerTransaction) => {
        setViewingTransaction(t);
    };

    const handleSubmit = (data: any) => {
        const isEditingCredit = editingTransaction && creditTransactions.some(c => c.id === editingTransaction.id);

        if (data.payment_method === 'credito' && data.cardId) {
            const creditData = {
                card_id: data.cardId,
                date: data.date,
                category: data.category,
                description: data.description,
                value: data.value,
                installments: data.installments ?? 1,
                installment_number: 1,
                status: 'open_invoice' as const
            };
            if (isEditingCredit) {
                updateCreditTransaction(editingTransaction!.id, creditData);
            } else {
                addCreditTransaction(creditData);
                if (editingTransaction) {
                    deleteTransaction(editingTransaction.id);
                }
            }
        } else {
            const { cardId, installments: _inst, ...cleanData } = data;
            if (isEditingCredit) {
                deleteCreditTransaction(editingTransaction!.id);
                addTransaction(cleanData);
            } else if (editingTransaction) {
                updateTransaction(editingTransaction.id, cleanData);
            } else {
                addTransaction(cleanData);
            }
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (creditTransactions.some(c => c.id === id)) {
            deleteCreditTransaction(id);
        } else {
            deleteTransaction(id);
        }
        setDeleteConfirmId(null);
        setViewingTransaction(null);
        setIsModalOpen(false);
    };

    const formatDayLabel = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoje';
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    const getDayTotal = (transactions: LedgerTransaction[]) => {
        return transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.value : -t.value), 0);
    };

    // --- Goal/Balance Logic — via centralized hook (same formula as Dashboard) ---
    const goalData = useFinancialSummary({ month: currentMonth, ledger, fixedExpenses, monthlyGoals });


    return (
        <div className="pb-20 overflow-x-hidden">
            <Header title="Caixa" subtitle={`Saldo: ${formatCurrency(stats.balance)}`} />

            {/* Financial Goal Card */}
            <div className="px-4 mt-4">
                <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <PiggyBank size={18} className="text-yellow-400" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Objetivo {monthLabel}</h3>
                                </div>
                                <div className="flex items-baseline gap-2 cursor-pointer group" onClick={() => { setTempGoal(String(goalData.goal)); setIsGoalModalOpen(true); }}>
                                    <span className="text-2xl font-bold">{formatCurrency(goalData.goal)}</span>
                                    <Pencil size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase mb-0.5">Saldo Projetado Final</p>
                                <p className={cn(
                                    "text-xl font-bold",
                                    goalData.isSafe ? "text-green-400" : "text-red-400"
                                )}>{formatCurrency(goalData.projectedBalance)}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Progresso da Meta</span>
                                <span>{goalData.percentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        goalData.isSafe ? "bg-green-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${Math.min(Math.max(goalData.percentage, 0), 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                                <span>Saldo Inicial: <span className="text-slate-300">{formatCurrency(goalData.openingBalance)}</span></span>
                                <span>Saldo Atual: <span className="text-slate-300">{formatCurrency(goalData.currentBalance)}</span></span>
                            </div>
                        </div>

                        {!goalData.isSafe && (
                            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                                <ArrowDown size={14} className="text-red-400" />
                                <p className="text-xs text-red-200">
                                    Faltam <b>{formatCurrency(goalData.goal - goalData.projectedBalance)}</b> para atingir a meta acumulada.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Summary Strip */}
            <div className="bg-gray-900 text-white p-4 dark:bg-black">
                {/* Period Mode Toggle */}
                <div className="flex justify-center gap-1 mb-3">
                    <button
                        className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            periodMode === 'month' ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                        )}
                        onClick={() => setPeriodMode('month')}
                    >
                        Mensal
                    </button>
                    <button
                        className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                            periodMode === 'range' ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                        )}
                        onClick={() => {
                            setPeriodMode('range');
                            if (!rangeStart) {
                                const d = new Date();
                                d.setMonth(d.getMonth() - 1);
                                setRangeStart(d.toISOString().split('T')[0]);
                                setRangeEnd(new Date().toISOString().split('T')[0]);
                            }
                        }}
                    >
                        <CalendarDays size={12} /> Período
                    </button>
                </div>

                {/* Month Navigation or Date Range */}
                {periodMode === 'month' ? (
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold capitalize">{monthLabel}</span>
                            {!isCurrentMonth && (
                                <button
                                    onClick={goToToday}
                                    className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-medium hover:bg-white/25 transition-colors flex items-center gap-1"
                                    title="Voltar ao mês atual"
                                >
                                    <RotateCcw size={10} /> Hoje
                                </button>
                            )}
                        </div>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 items-center mb-3">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-400 uppercase block mb-0.5">De</label>
                            <input
                                type="date"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg text-white text-xs px-2 py-1.5"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-400 uppercase block mb-0.5">Até</label>
                            <input
                                type="date"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg text-white text-xs px-2 py-1.5"
                            />
                        </div>
                        <button
                            onClick={goToToday}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors mt-3"
                            title="Voltar ao mês atual"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                )}

                {/* Monthly Totals */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <div className="bg-white/10 rounded-lg p-2 sm:p-2.5 text-center overflow-hidden">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <ArrowUp size={12} className="text-green-400 flex-shrink-0" />
                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Entradas</p>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-green-400 truncate">{formatCurrency(monthTotals.income)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 sm:p-2.5 text-center overflow-hidden">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <ArrowDown size={12} className="text-red-400 flex-shrink-0" />
                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Saídas</p>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-red-400 truncate">{formatCurrency(monthTotals.expense)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 sm:p-2.5 text-center overflow-hidden">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Wallet size={12} className={cn("flex-shrink-0", monthTotals.balance >= 0 ? 'text-green-400' : 'text-red-400')} />
                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Balanço</p>
                        </div>
                        <p className={cn("font-bold text-xs sm:text-sm truncate", monthTotals.balance >= 0 ? "text-green-400" : "text-red-400")}>
                            {formatCurrency(monthTotals.balance)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4">
                {/* Filters Row 1: Type tabs + New button */}
                <div className="flex justify-between items-center">
                    <div className="flex bg-muted rounded-lg p-1 text-xs font-medium">
                        <button
                            className={cn("px-3 py-1.5 rounded-md transition-all", filterType === 'all' ? "bg-card shadow-sm text-text-primary" : "text-text-secondary")}
                            onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
                        >
                            Todos
                        </button>
                        <button
                            className={cn("px-3 py-1.5 rounded-md transition-all", filterType === 'income' ? "bg-card shadow-sm text-green-600 dark:text-green-400" : "text-text-secondary")}
                            onClick={() => { setFilterType('income'); setFilterCategory('all'); }}
                        >
                            Entradas
                        </button>
                        <button
                            className={cn("px-3 py-1.5 rounded-md transition-all", filterType === 'expense' ? "bg-card shadow-sm text-red-600 dark:text-red-400" : "text-text-secondary")}
                            onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
                        >
                            Saídas
                        </button>
                    </div>
                    <Button size="sm" onClick={handleOpenNew}>
                        <Plus size={16} /> Lançar
                    </Button>
                </div>

                {/* Filters Row 2: Search + Category */}
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="h-9 text-xs rounded-lg border border-border bg-card text-text-primary px-2 w-[100px] sm:w-[120px] flex-shrink-0"
                    >
                        <option value="all">Categoria</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Transaction List - Grouped by Day */}
                {sortedLedger.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <Receipt className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">Nenhum lançamento</p>
                        <p className="text-xs text-text-secondary/70 mt-1">
                            {searchTerm || filterCategory !== 'all'
                                ? 'Tente alterar os filtros'
                                : `Nenhum lançamento em ${monthLabel}`
                            }
                        </p>
                        <Button size="sm" className="mt-4" onClick={handleOpenNew}>
                            <Plus size={16} /> Novo lançamento
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {groupedByDay.map(([dayKey, transactions]) => {
                            const dayTotal = getDayTotal(transactions);
                            return (
                                <div key={dayKey}>
                                    {/* Day header */}
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-xs font-semibold text-text-secondary uppercase capitalize">
                                            {formatDayLabel(dayKey)}
                                        </span>
                                        <span className={cn("text-xs font-semibold", dayTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                            {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                                        </span>
                                    </div>

                                    {/* Day transactions */}
                                    <div className="space-y-2">
                                        {transactions.map(t => (
                                            <Card
                                                key={t.id}
                                                className="flex items-center py-2.5 sm:py-3 px-3 sm:px-4 cursor-pointer active:scale-[0.99] transition-transform overflow-hidden"
                                                onClick={() => handleView(t)}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <div className={cn("p-2 rounded-full flex-shrink-0",
                                                        t.type === 'income'
                                                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {t.type === 'income' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-text-primary text-sm truncate">{t.description}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", getLedgerCategoryColor(t.category))}>
                                                                {t.category}
                                                            </span>
                                                            <span className="text-[10px] text-text-secondary capitalize">{t.payment_method}</span>
                                                            {t.source === 'system' && (
                                                                <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-text-secondary border border-border">Auto</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                    <p className={cn("font-bold text-xs sm:text-sm whitespace-nowrap",
                                                        t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                                    )}>
                                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                                                    </p>
                                                    {!t.id.startsWith('virtual-invoice-') && (
                                                        <button
                                                            className="p-1 text-text-secondary hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                                                            title="Editar"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-2 border-t border-border text-center">
                            <p className="text-xs text-text-secondary">
                                {sortedLedger.length} lançamento{sortedLedger.length !== 1 ? 's' : ''} neste mês
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                className="fixed bottom-24 right-6 lg:bottom-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
                onClick={handleOpenNew}
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Edit/New Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}>
                <TransactionForm
                    initialData={editingTransaction}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    onDelete={editingTransaction ? () => setDeleteConfirmId(editingTransaction.id) : undefined}
                />
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={!!viewingTransaction} onClose={() => setViewingTransaction(null)} title="Detalhes do Lançamento">
                {viewingTransaction && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <span className={cn("inline-block text-xs px-2 py-1 rounded-full font-medium mb-2", getLedgerCategoryColor(viewingTransaction.category))}>
                                {viewingTransaction.category}
                            </span>
                            <h2 className="text-xl font-bold text-text-primary">{viewingTransaction.description}</h2>
                            <p className={cn("text-3xl font-bold mt-2", viewingTransaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {viewingTransaction.type === 'income' ? '+' : '-'} {formatCurrency(viewingTransaction.value)}
                            </p>
                        </div>

                        <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Data</span>
                                <span className="font-medium text-text-primary">{formatDate(viewingTransaction.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Pagamento</span>
                                <span className="font-medium capitalize text-text-primary">{viewingTransaction.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Origem</span>
                                <span className="font-medium capitalize text-text-primary">
                                    {viewingTransaction.source === 'system' ? 'Automático (Sistema)' : 'Manual'}
                                </span>
                            </div>
                            {viewingTransaction.source === 'system' && (
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Ref. ID</span>
                                    <span className="font-mono text-xs text-text-secondary">{viewingTransaction.source_ref?.slice(0, 8)}...</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setViewingTransaction(null);
                                handleOpenEdit(viewingTransaction);
                            }}>
                                <Pencil size={16} /> Editar
                            </Button>
                            <Button variant="danger" className="flex-1 bg-red-100 text-red-600 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" onClick={() => {
                                setDeleteConfirmId(viewingTransaction.id);
                            }}>
                                <Trash2 size={16} /> Excluir
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Excluir Lançamento">
                <div className="space-y-4">
                    <p className="text-text-secondary">Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Goal Modal */}
            <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Definir Meta para ${monthLabel}`}>
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">Qual o saldo final acumulado desejado para {monthLabel}?</p>
                    <CurrencyInput
                        value={parseFloat(tempGoal) || 0}
                        onChange={(v) => setTempGoal(String(v))}
                        placeholder="R$ 0,00"
                        className="text-lg py-3"
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setIsGoalModalOpen(false)}>Cancelar</Button>
                        <Button onClick={() => { setMonthlyGoal(currentMonth, parseFloat(tempGoal) || 0); setIsGoalModalOpen(false); }}>
                            Salvar Meta
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ─── Transaction Form ──────────────────────────────────────────────────────────

function TransactionForm({ initialData, onClose, onSubmit, onDelete }: {
    initialData: LedgerTransaction | null;
    onClose: () => void;
    onSubmit: (data: any) => void;
    onDelete?: () => void;
}) {
    const [type, setType] = useState<TransactionType>('expense');
    const [desc, setDesc] = useState('');
    const [valueReais, setValueReais] = useState(0);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payment, setPayment] = useState<PaymentMethod>('debito');
    const [cardId, setCardId] = useState('');
    const [installments, setInstallments] = useState(1);
    const { creditCards } = useApp();

    const categoryOptions = useMemo(() => getLedgerCategoryNames(type), [type]);

    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setDesc(initialData.description);
            setValueReais(initialData.value);
            setCategory(initialData.category);
            setDate(initialData.date.split('T')[0]);
            setPayment(initialData.payment_method);
            setCardId(initialData.source_ref || '');
        } else {
            setType('expense');
            setDesc('');
            setValueReais(0);
            setCategory('');
            setDate(new Date().toISOString().split('T')[0]);
            setPayment('debito');
            setCardId('');
            setInstallments(1);
        }
    }, [initialData]);

    // Reset category and payment when type changes (only for new transactions)
    useEffect(() => {
        if (!initialData) {
            setCategory('');
            setPayment(type === 'income' ? 'pix' : 'debito');
        }
    }, [type, initialData]);

    const submit = () => {
        if (!desc || valueReais === 0 || !category) return;
        if (payment === 'credito' && !cardId) return;

        onSubmit({
            type,
            description: desc,
            value: valueReais,
            category,
            source: initialData ? initialData.source : 'manual',
            date,
            payment_method: payment,
            cardId: payment === 'credito' ? cardId : undefined,
            installments: payment === 'credito' ? installments : 1,
        });
    };

    return (
        <div className="space-y-4">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    className={cn("p-2.5 rounded-lg border text-sm font-medium transition-colors",
                        type === 'income'
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-900/50 dark:text-green-400"
                            : "border-border text-text-secondary"
                    )}
                    onClick={() => setType('income')}
                >
                    <ArrowUp size={16} className="inline mr-1" /> Receita
                </button>
                <button
                    className={cn("p-2.5 rounded-lg border text-sm font-medium transition-colors",
                        type === 'expense'
                            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400"
                            : "border-border text-text-secondary"
                    )}
                    onClick={() => setType('expense')}
                >
                    <ArrowDown size={16} className="inline mr-1" /> Despesa
                </button>
            </div>

            {/* 1. Categoria */}
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Categoria</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-card text-text-primary text-sm px-3"
                >
                    <option value="">Selecione...</option>
                    {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* 2. Descrição */}
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Descrição</label>
                <Input placeholder="Ex: Salário, Mercado..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            {/* 3. Data */}
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Data</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* 4. Valor */}
            <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Valor</label>
                <CurrencyInput
                    value={valueReais}
                    onChange={setValueReais}
                    className="h-10"
                />
            </div>

            {/* 5. Fonte (receita) / Pagamento (despesa) */}
            <div className={type === 'expense' && payment === 'credito' ? "grid grid-cols-2 gap-4" : ""}>
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">
                        {type === 'income' ? 'Fonte' : 'Pagamento'}
                    </label>
                    <Select value={payment} onChange={e => {
                        setPayment(e.target.value as PaymentMethod);
                        if (e.target.value !== 'credito') setCardId('');
                    }}>
                        {type === 'income' ? (
                            <>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="transferencia">Transferência</option>
                                <option value="pix">Pix</option>
                            </>
                        ) : (
                            <>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="pix">Pix</option>
                                <option value="debito">Débito</option>
                                <option value="credito">Crédito</option>
                            </>
                        )}
                    </Select>
                </div>
                {type === 'expense' && payment === 'credito' && (
                    <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Cartão Selecionado</label>
                        <Select value={cardId} onChange={e => setCardId(e.target.value)}>
                            <option value="">Selecione...</option>
                            {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                )}
            </div>

            {/* Parcelas — só aparece p/ crédito */}
            {type === 'expense' && payment === 'credito' && (
                <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Parcelas</label>
                    <Select value={String(installments)} onChange={e => setInstallments(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                            <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
                        ))}
                    </Select>
                    {installments > 1 && valueReais > 0 && (
                        <p className="text-xs text-text-secondary mt-1">
                            {installments}x de <span className="font-semibold text-text-primary">R$ {(valueReais / installments).toFixed(2).replace('.', ',')}</span>
                        </p>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-4">
                {onDelete && (
                    <Button type="button" variant="danger" size="icon" onClick={onDelete}
                        className="bg-red-100 hover:bg-red-200 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30">
                        <Trash2 size={20} />
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted border-border text-text-secondary hover:text-text-primary">
                    Cancelar
                </Button>
                <Button
                    className={cn("flex-1", type === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
                    onClick={submit}
                    disabled={!desc || valueReais === 0 || !category || (payment === 'credito' && !cardId)}
                >
                    Salvar
                </Button>
            </div>
        </div>
    );
}
