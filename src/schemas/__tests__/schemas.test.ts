/**
 * Tests for Zod schemas — validates that our schemas correctly
 * accept valid data and reject malformed inputs with clear messages.
 */
import { describe, it, expect } from 'vitest';
import { safeParseLedgerTransaction } from '../../schemas/ledger.schema';
import { safeParseFixedExpense, safeParseRecurringBill } from '../../schemas/fixedExpense.schema';
import { safeParseCreditCard, safeParseCreditTransaction } from '../../schemas/creditCard.schema';

// ── Ledger Transaction Schema ─────────────────────────────────────────────────

describe('ledgerTransactionSchema', () => {
    const valid = {
        type: 'income',
        category: 'Salário',
        description: 'Salário de Fevereiro',
        value: 5000,
        payment_method: 'pix',
        date: '2025-02-05',
    };

    it('accepts a valid transaction', () => {
        const result = safeParseLedgerTransaction(valid);
        expect(result.success).toBe(true);
    });

    it('rejects negative value', () => {
        const result = safeParseLedgerTransaction({ ...valid, value: -100 });
        expect(result.success).toBe(false);
        expect(result.errors.value).toBeTruthy();
    });

    it('rejects zero value', () => {
        const result = safeParseLedgerTransaction({ ...valid, value: 0 });
        expect(result.success).toBe(false);
        expect(result.errors.value).toContain('maior que zero');
    });

    it('rejects empty description', () => {
        const result = safeParseLedgerTransaction({ ...valid, description: 'a' });
        expect(result.success).toBe(false);
        expect(result.errors.description).toBeTruthy();
    });

    it('rejects invalid payment method', () => {
        const result = safeParseLedgerTransaction({ ...valid, payment_method: 'bitcoin' });
        expect(result.success).toBe(false);
        expect(result.errors.payment_method).toBeTruthy();
    });

    it('rejects invalid type', () => {
        const result = safeParseLedgerTransaction({ ...valid, type: 'transfer' });
        expect(result.success).toBe(false);
        expect(result.errors.type).toBeTruthy();
    });

    it('rejects missing date', () => {
        const result = safeParseLedgerTransaction({ ...valid, date: '' });
        expect(result.success).toBe(false);
        expect(result.errors.date).toBeTruthy();
    });
});

// ── Fixed Expense Schema ──────────────────────────────────────────────────────

describe('fixedExpenseSchema', () => {
    const valid = {
        description: 'Internet Vivo',
        category: 'Internet',
        value: 120,
        due_date: '2025-02-15',
        paid: false,
    };

    it('accepts a valid fixed expense', () => {
        const result = safeParseFixedExpense(valid);
        expect(result.success).toBe(true);
    });

    it('rejects value of zero', () => {
        const result = safeParseFixedExpense({ ...valid, value: 0 });
        expect(result.success).toBe(false);
        expect(result.errors.value).toBeTruthy();
    });

    it('rejects invalid date format', () => {
        const result = safeParseFixedExpense({ ...valid, due_date: '15/02/2025' });
        expect(result.success).toBe(false);
        expect(result.errors.due_date).toBeTruthy();
    });

    it('rejects very short description', () => {
        const result = safeParseFixedExpense({ ...valid, description: 'A' });
        expect(result.success).toBe(false);
        expect(result.errors.description).toBeTruthy();
    });
});

describe('recurringBillSchema', () => {
    const valid = {
        description: 'Netflix',
        category: 'Streaming',
        estimated_value: 45,
        due_day: 10,
        is_variable: false,
        active: true,
    };

    it('accepts a valid recurring bill', () => {
        const result = safeParseRecurringBill(valid);
        expect(result.success).toBe(true);
    });

    it('rejects due_day > 31', () => {
        const result = safeParseRecurringBill({ ...valid, due_day: 32 });
        expect(result.success).toBe(false);
        expect(result.errors.due_day).toBeTruthy();
    });

    it('rejects due_day = 0', () => {
        const result = safeParseRecurringBill({ ...valid, due_day: 0 });
        expect(result.success).toBe(false);
        expect(result.errors.due_day).toBeTruthy();
    });
});

// ── Credit Card Schema ────────────────────────────────────────────────────────

describe('creditCardSchema', () => {
    const valid = {
        name: 'Nubank Roxinho',
        color_theme: 'purple',
        limit_amount: 5000,
        closing_day: 3,
        due_day: 10,
    };

    it('accepts a valid credit card', () => {
        const result = safeParseCreditCard(valid);
        expect(result.success).toBe(true);
    });

    it('rejects when closing_day === due_day', () => {
        const result = safeParseCreditCard({ ...valid, due_day: 3 }); // same as closing_day
        expect(result.success).toBe(false);
        expect(result.errors.due_day).toContain('não pode ser igual');
    });

    it('rejects zero limit', () => {
        const result = safeParseCreditCard({ ...valid, limit_amount: 0 });
        expect(result.success).toBe(false);
        expect(result.errors.limit_amount).toBeTruthy();
    });

    it('rejects closing_day > 31', () => {
        const result = safeParseCreditCard({ ...valid, closing_day: 32 });
        expect(result.success).toBe(false);
        expect(result.errors.closing_day).toBeTruthy();
    });

    it('rejects card name too short', () => {
        const result = safeParseCreditCard({ ...valid, name: 'N' });
        expect(result.success).toBe(false);
        expect(result.errors.name).toBeTruthy();
    });
});

describe('creditTransactionSchema', () => {
    const valid = {
        card_id: 'card-uuid-123',
        category: 'Alimentação',
        description: 'Hamburguer ZetaBurguer',
        value: 45.9,
        date: '2025-02-18',
        installments: 1,
        status: 'open_invoice',
    };

    it('accepts a valid credit transaction', () => {
        const result = safeParseCreditTransaction(valid);
        expect(result.success).toBe(true);
    });

    it('rejects installments > 48', () => {
        const result = safeParseCreditTransaction({ ...valid, installments: 60 });
        expect(result.success).toBe(false);
        expect(result.errors.installments).toBeTruthy();
    });

    it('rejects invalid status value', () => {
        const result = safeParseCreditTransaction({ ...valid, status: 'pending' });
        expect(result.success).toBe(false);
        expect(result.errors.status).toBeTruthy();
    });

    it('rejects empty card_id', () => {
        const result = safeParseCreditTransaction({ ...valid, card_id: '' });
        expect(result.success).toBe(false);
        expect(result.errors.card_id).toBeTruthy();
    });
});
