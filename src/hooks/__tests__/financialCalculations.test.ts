/**
 * Tests for calculateFinancialSummary (pure financial calculation logic).
 *
 * Coverage focus:
 *  ✅ Opening balance calculated correctly from previous months
 *  ✅ Virtual-invoice ledger entries are EXCLUDED (not double-counted)
 *  ✅ Fixed expenses: paid ones are deducted via payment_date (not due_date)
 *  ✅ Projected balance = currentBalance - pending obligations
 *  ✅ Dashboard and Ledger would show the SAME numbers (single source of truth)
 *  ✅ Goal tracking (percentage and isSafe)
 *  ✅ Pending: physical only if due this month; virtual always
 *  ✅ Edge cases: empty data, zero income, negative balance
 */
import { describe, it, expect } from 'vitest';
import { calculateFinancialSummary } from '../../lib/financialCalculations';
import type { LedgerTransaction, FixedExpense } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────
const tx = (
    overrides: Partial<LedgerTransaction> & { date: string; value: number; type: 'income' | 'expense' }
): LedgerTransaction => ({
    id: crypto.randomUUID(),
    user_id: 'user-1',
    category: 'Outros',
    description: 'Test',
    payment_method: 'pix',
    source: 'manual',
    source_ref: undefined,
    created_at: overrides.date,
    ...overrides,
});

const fixedExpense = (
    overrides: Partial<FixedExpense> & { due_date: string; value: number }
): FixedExpense => ({
    id: crypto.randomUUID(),
    user_id: 'user-1',
    description: 'Conta',
    category: 'Contas',
    paid: false,
    payment_date: undefined,
    created_at: overrides.due_date,
    estimated_value: overrides.value,
    recurring_bill_id: undefined,
    ...overrides,
});

// ── Test Suites ────────────────────────────────────────────────────────────────

describe('calculateFinancialSummary', () => {

    describe('Empty data', () => {
        it('returns all zeros when ledger and fixedExpenses are empty', () => {
            const result = calculateFinancialSummary('2025-02', [], []);
            expect(result.openingBalance).toBe(0);
            expect(result.monthIncome).toBe(0);
            expect(result.monthLedgerExpense).toBe(0);
            expect(result.currentBalance).toBe(0);
            expect(result.fixedPending).toBe(0);
            expect(result.projectedBalance).toBe(0);
        });
    });

    describe('Opening balance', () => {
        it('accumulates income from PREVIOUS months into opening balance', () => {
            const ledger = [
                tx({ date: '2025-01-10', value: 5000, type: 'income' }), // previous month
                tx({ date: '2025-02-05', value: 3000, type: 'income' }), // current month
            ];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            expect(result.openingBalance).toBe(5000);
            expect(result.monthIncome).toBe(3000);
        });

        it('deducts expenses from previous months in opening balance', () => {
            const ledger = [
                tx({ date: '2025-01-10', value: 5000, type: 'income' }),
                tx({ date: '2025-01-20', value: 1200, type: 'expense' }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            expect(result.openingBalance).toBe(3800); // 5000 - 1200
        });

        it('deducts paid fixed expenses from previous months in opening balance', () => {
            const expenses = [
                fixedExpense({
                    due_date: '2025-01-15',
                    value: 800,
                    paid: true,
                    payment_date: '2025-01-15',
                }),
            ];
            const ledger = [tx({ date: '2025-01-10', value: 5000, type: 'income' })];
            const result = calculateFinancialSummary('2025-02', ledger, expenses);
            expect(result.openingBalance).toBe(4200); // 5000 - 800
        });
    });

    describe('Current month calculations', () => {
        it('correctly sums income and expenses within the month', () => {
            const ledger = [
                tx({ date: '2025-02-05', value: 4000, type: 'income' }),
                tx({ date: '2025-02-10', value: 500, type: 'expense' }),
                tx({ date: '2025-02-15', value: 300, type: 'expense' }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            expect(result.monthIncome).toBe(4000);
            expect(result.monthLedgerExpense).toBe(800);
            expect(result.monthResult).toBe(3200);
        });

        it('uses payment_date (not due_date) for fixed expenses paid this month', () => {
            // Expense is DUE in January but PAID in February
            const expenses = [
                fixedExpense({
                    due_date: '2025-01-20',     // due in January
                    payment_date: '2025-02-01', // but paid in February
                    value: 600,
                    paid: true,
                }),
            ];
            const result = calculateFinancialSummary('2025-02', [], expenses);
            // Should count as February expense (not January)
            expect(result.monthFixedPaid).toBe(600);
            // Opening balance must NOT include this expense (not paid before Feb)
            expect(result.openingBalance).toBe(0);
        });
    });

    describe('Virtual invoice double-counting prevention', () => {
        it('EXCLUDES virtual-invoice ledger entries from all calculations', () => {
            // Simulates what happens when a credit card invoice is paid:
            // A system entry is created in the ledger with source_ref = 'virtual-invoice-...'
            const ledger = [
                tx({ date: '2025-02-10', value: 3000, type: 'income' }),
                tx({
                    date: '2025-02-15',
                    value: 1500,
                    type: 'expense',
                    source: 'system',
                    source_ref: 'virtual-invoice-card-uuid-2025-1',
                }),
            ];
            // The invoice is also present as a fixedExpense (virtual)
            const expenses = [
                fixedExpense({
                    id: 'virtual-invoice-card-uuid-2025-1',
                    due_date: '2025-02-10',
                    value: 1500,
                    paid: true,
                    payment_date: '2025-02-15',
                }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, expenses);
            // The 1500 expense should be counted ONLY ONCE (via fixedExpenses, not ledger)
            expect(result.monthLedgerExpense).toBe(0);   // virtual entry excluded
            expect(result.monthFixedPaid).toBe(1500);    // counted via fixedExpenses
            expect(result.currentBalance).toBe(1500);    // 3000 - 1500
        });

        it('virtual-invoice entries are excluded from OPENING balance too', () => {
            const ledger = [
                tx({ date: '2025-01-10', value: 5000, type: 'income' }),
                tx({
                    date: '2025-01-20',
                    value: 2000,
                    type: 'expense',
                    source: 'system',
                    source_ref: 'virtual-invoice-card-uuid-2024-12',
                }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            // Virtual invoice should be excluded, opening = 5000 (not 3000)
            expect(result.openingBalance).toBe(5000);
        });
    });

    describe('Pending obligations', () => {
        it('includes physical pending expense due THIS month', () => {
            const expenses = [
                fixedExpense({ due_date: '2025-02-20', value: 400, paid: false }),
            ];
            const result = calculateFinancialSummary('2025-02', [], expenses);
            expect(result.fixedPending).toBe(400);
        });

        it('does NOT include physical expense due in a different month', () => {
            const expenses = [
                fixedExpense({ due_date: '2025-03-15', value: 400, paid: false }), // March
            ];
            const result = calculateFinancialSummary('2025-02', [], expenses);
            expect(result.fixedPending).toBe(0);
        });

        it('ALWAYS includes unpaid virtual invoice regardless of due date month', () => {
            const expenses = [
                fixedExpense({
                    id: 'virtual-invoice-card-abc-2025-0', // any month
                    due_date: '2025-01-10',                // due in January
                    value: 900,
                    paid: false,
                }),
            ];
            const result = calculateFinancialSummary('2025-02', [], expenses);
            // Virtual invoices are immediate liability — always pending
            expect(result.fixedPending).toBe(900);
        });

        it('projectedBalance = currentBalance - fixedPending', () => {
            const ledger = [tx({ date: '2025-02-05', value: 3000, type: 'income' })];
            const expenses = [
                fixedExpense({ due_date: '2025-02-20', value: 500, paid: false }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, expenses);
            expect(result.currentBalance).toBe(3000);
            expect(result.fixedPending).toBe(500);
            expect(result.projectedBalance).toBe(2500);
        });
    });

    describe('Goal tracking', () => {
        it('calculates percentage of projected balance vs goal', () => {
            const ledger = [tx({ date: '2025-02-05', value: 2000, type: 'income' })];
            const result = calculateFinancialSummary('2025-02', ledger, [], { '2025-02': 4000 });
            expect(result.goal).toBe(4000);
            expect(result.percentage).toBe(50); // 2000 / 4000 = 50%
            expect(result.isSafe).toBe(false);
        });

        it('isSafe is true when projectedBalance >= goal', () => {
            const ledger = [tx({ date: '2025-02-05', value: 5000, type: 'income' })];
            const result = calculateFinancialSummary('2025-02', ledger, [], { '2025-02': 3000 });
            expect(result.isSafe).toBe(true);
            expect(result.percentage).toBeCloseTo(166.67, 1);
        });

        it('returns zero percentage when no goal is set', () => {
            const ledger = [tx({ date: '2025-02-05', value: 3000, type: 'income' })];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            expect(result.goal).toBe(0);
            expect(result.percentage).toBe(0);
            expect(result.isSafe).toBe(true); // projectedBalance (3000) >= goal (0)
        });
    });

    describe('Dashboard and Ledger consistency', () => {
        it('same inputs produce identical outputs (single source of truth)', () => {
            const ledger = [
                tx({ date: '2025-01-15', value: 4000, type: 'income' }),
                tx({ date: '2025-02-10', value: 3500, type: 'income' }),
                tx({ date: '2025-02-20', value: 800, type: 'expense' }),
            ];
            const expenses = [
                fixedExpense({ due_date: '2025-02-15', value: 300, paid: false }),
                fixedExpense({
                    due_date: '2025-01-10',
                    value: 500,
                    paid: true,
                    payment_date: '2025-01-10',
                }),
            ];

            const fromDashboard = calculateFinancialSummary('2025-02', ledger, expenses);
            const fromLedger = calculateFinancialSummary('2025-02', ledger, expenses);

            // Must be identical — no divergence possible
            expect(fromDashboard).toEqual(fromLedger);
            expect(fromDashboard.currentBalance).toBe(4000 - 500 + 3500 - 800); // 6200
            expect(fromDashboard.projectedBalance).toBe(6200 - 300); // 5900
        });

        it('negative balance is handled correctly', () => {
            const ledger = [
                tx({ date: '2025-02-05', value: 500, type: 'income' }),
                tx({ date: '2025-02-18', value: 1500, type: 'expense' }),
            ];
            const result = calculateFinancialSummary('2025-02', ledger, []);
            expect(result.currentBalance).toBe(-1000);
            expect(result.isSafe).toBe(false); // -1000 < 0
        });
    });
});
