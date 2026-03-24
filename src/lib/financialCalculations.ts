/**
 * financialCalculations.ts — Pure calculation logic.
 *
 * Extracted from useFinancialSummary so it can be unit-tested
 * without any React dependency (no hooks, no jsdom needed).
 *
 * The hook (useFinancialSummary.ts) wraps this function with useMemo.
 */
import type { LedgerTransaction, FixedExpense } from '../types';

export interface FinancialSummary {
    openingBalance: number;
    monthIncome: number;
    monthLedgerExpense: number;
    monthFixedPaid: number;
    monthResult: number;
    currentBalance: number;
    fixedPending: number;
    projectedBalance: number;
    goal: number;
    percentage: number;
    isSafe: boolean;
}

/**
 * Calculates the complete financial summary for a given month.
 * Pure function — no side effects, no React.
 */
export function calculateFinancialSummary(
    month: string,
    ledger: LedgerTransaction[],
    fixedExpenses: FixedExpense[],
    monthlyGoals: Record<string, number> = {}
): FinancialSummary {
    const [y, m] = month.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);

    /** Returns true if a ledger transaction is a virtual-invoice system entry */
    const isVirtualInvoice = (t: LedgerTransaction) =>
        t.source === 'system' && !!t.source_ref?.startsWith('virtual-invoice-');

    // ─── 1. Opening Balance (everything BEFORE this month) ───────────────
    const prevLedger = ledger.filter(t => {
        if (isVirtualInvoice(t)) return false;
        return new Date(t.date) < monthStart;
    });

    const prevIncome = prevLedger
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.value, 0);

    const prevExpense = prevLedger
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.value, 0);

    const prevFixedPaid = fixedExpenses
        .filter(f => f.paid && f.payment_date)
        .filter(f => new Date(f.payment_date! + 'T12:00:00') < monthStart)
        .reduce((s, f) => s + f.value, 0);

    const openingBalance = prevIncome - prevExpense - prevFixedPaid;

    // ─── 2. Current Month ─────────────────────────────────────────────────
    const monthLedger = ledger.filter(t => {
        if (isVirtualInvoice(t)) return false;
        const d = new Date(t.date);
        return d.getFullYear() === y && d.getMonth() === m - 1;
    });

    const monthIncome = monthLedger
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.value, 0);

    const monthLedgerExpense = monthLedger
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.value, 0);

    const monthFixedPaid = fixedExpenses
        .filter(f => f.paid && f.payment_date)
        .filter(f => {
            const pd = new Date(f.payment_date! + 'T12:00:00');
            return pd.getFullYear() === y && pd.getMonth() === m - 1;
        })
        .reduce((s, f) => s + f.value, 0);

    const monthResult = monthIncome - monthLedgerExpense - monthFixedPaid;
    const currentBalance = openingBalance + monthResult;

    // ─── 3. Pending Obligations ───────────────────────────────────────────
    const pendingPhysical = fixedExpenses
        .filter(f => !f.paid && !f.id.startsWith('virtual-invoice'))
        .filter(f => {
            const [fy, fm] = f.due_date.split('-').map(Number);
            return fy === y && fm === m;
        })
        .reduce((s, f) => s + f.value, 0);

    const pendingVirtual = fixedExpenses
        .filter(f => !f.paid && f.id.startsWith('virtual-invoice'))
        .filter(f => {
            // Only count invoices due in THIS month — future invoices don't affect the current month's projection
            const [fy, fm] = f.due_date.split('-').map(Number);
            return fy === y && fm === m;
        })
        .reduce((s, f) => s + f.value, 0);

    const fixedPending = pendingPhysical + pendingVirtual;
    const projectedBalance = currentBalance - fixedPending;

    // ─── 4. Goal Tracking ─────────────────────────────────────────────────
    const goal = monthlyGoals[month] || 0;
    const percentage = goal > 0 ? (projectedBalance / goal) * 100 : 0;
    const isSafe = projectedBalance >= goal;

    return {
        openingBalance,
        monthIncome,
        monthLedgerExpense,
        monthFixedPaid,
        monthResult,
        currentBalance,
        fixedPending,
        projectedBalance,
        goal,
        percentage,
        isSafe,
    };
}
