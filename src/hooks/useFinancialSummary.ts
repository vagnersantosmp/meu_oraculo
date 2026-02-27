import { useMemo } from 'react';
import type { LedgerTransaction, FixedExpense } from '../types';
import { calculateFinancialSummary } from '../lib/financialCalculations';

export type { FinancialSummary } from '../lib/financialCalculations';

interface UseFinancialSummaryParams {
    month: string;
    ledger: LedgerTransaction[];
    fixedExpenses: FixedExpense[];
    monthlyGoals?: Record<string, number>;
}

/**
 * Hook wrapper around calculateFinancialSummary.
 * Memoizes the result using React's useMemo.
 * For unit tests, import and test calculateFinancialSummary directly.
 */
export function useFinancialSummary({
    month,
    ledger,
    fixedExpenses,
    monthlyGoals = {},
}: UseFinancialSummaryParams) {
    return useMemo(
        () => calculateFinancialSummary(month, ledger, fixedExpenses, monthlyGoals),
        [month, ledger, fixedExpenses, monthlyGoals]
    );
}
