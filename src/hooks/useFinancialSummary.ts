import { useMemo } from 'react';
import type { LedgerTransaction, FixedExpense } from '../types';

interface UseFinancialSummaryParams {
    month: string; // YYYY-MM
    ledger: LedgerTransaction[];
    fixedExpenses: FixedExpense[];
    monthlyGoals?: Record<string, number>;
}

export interface FinancialSummary {
    // Opening balance — everything accumulated BEFORE this month
    openingBalance: number;

    // Current month income/expenses from ledger (cash transactions only)
    monthIncome: number;
    monthLedgerExpense: number;

    // Fixed expenses paid THIS month (source of truth for invoices)
    monthFixedPaid: number;

    // Running total for the month
    monthResult: number;
    currentBalance: number;

    // Pending obligations
    fixedPending: number;        // pending physical (due this month) + ALL unpaid virtual invoices
    projectedBalance: number;    // currentBalance - fixedPending

    // Goal tracking (only when monthlyGoals is provided)
    goal: number;
    percentage: number;
    isSafe: boolean;
}

/**
 * Single source of truth for all financial calculations.
 * Used by Dashboard and Ledger — guarantees both show the same numbers.
 *
 * Rules:
 * - Virtual-invoice ledger entries are EXCLUDED from all calculations
 *   (they are counted via fixedExpenses.paid to avoid double-counting)
 * - Fixed expenses with payment_date are the source of truth for invoice payments
 */
export function useFinancialSummary({
    month,
    ledger,
    fixedExpenses,
    monthlyGoals = {},
}: UseFinancialSummaryParams): FinancialSummary {
    return useMemo(() => {
        const [y, m] = month.split('-').map(Number);
        const monthStart = new Date(y, m - 1, 1);

        /** Returns true if a ledger transaction is a virtual-invoice system entry */
        const isVirtualInvoice = (t: LedgerTransaction) =>
            t.source === 'system' && !!t.source_ref?.startsWith('virtual-invoice-');

        // ─── 1. Opening Balance (everything BEFORE this month) ───────────────
        const prevLedger = ledger.filter(t => {
            if (isVirtualInvoice(t)) return false; // excluded: counted via fixedExpenses
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
            if (isVirtualInvoice(t)) return false; // excluded: counted via fixedExpenses
            const d = new Date(t.date);
            return d.getFullYear() === y && d.getMonth() === m - 1;
        });

        const monthIncome = monthLedger
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + t.value, 0);

        const monthLedgerExpense = monthLedger
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + t.value, 0);

        // Fixed expenses paid IN this month (by payment_date)
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
        // Physical: only if due THIS month and unpaid
        const pendingPhysical = fixedExpenses
            .filter(f => !f.paid && !f.id.startsWith('virtual-invoice'))
            .filter(f => {
                const [fy, fm] = f.due_date.split('-').map(Number);
                return fy === y && fm === m;
            })
            .reduce((s, f) => s + f.value, 0);

        // Virtual (credit card invoices): always pending until paid (immediate liability)
        const pendingVirtual = fixedExpenses
            .filter(f => !f.paid && f.id.startsWith('virtual-invoice'))
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
    }, [month, ledger, fixedExpenses, monthlyGoals]);
}
