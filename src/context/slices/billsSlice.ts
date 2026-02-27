/**
 * Bills Slice — manages fixed expenses (both physical bills and virtual credit card invoices),
 * recurring bill templates and monthly bill generation.
 *
 * Cross-dependency: toggleFixedExpensePaid for virtual invoices creates/removes ledger entries.
 * Receives setLedger and creditCards/creditTransactions setters as dependencies.
 */
import React from 'react';
import * as db from '../../lib/supabaseService';
import type {
    FixedExpense, RecurringBill, CreditCard, CreditTransaction, LedgerTransaction
} from '../../types';

type SetLedger = React.Dispatch<React.SetStateAction<LedgerTransaction[]>>;
type SetCreditTransactions = React.Dispatch<React.SetStateAction<CreditTransaction[]>>;

export function createBillsSlice(
    userId: string,
    creditCards: CreditCard[],
    creditTransactions: CreditTransaction[],
    fixedExpenses: FixedExpense[],
    recurringBills: RecurringBill[],
    setFixedExpenses: React.Dispatch<React.SetStateAction<FixedExpense[]>>,
    setRecurringBills: React.Dispatch<React.SetStateAction<RecurringBill[]>>,
    setCreditTransactions: SetCreditTransactions,
    setLedger: SetLedger,
    generatingRef: React.MutableRefObject<boolean>,
) {
    // ── Fixed Expenses CRUD ────────────────────────────────────────────────
    const addFixedExpense = (data: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) => {
        db.createFixedExpenseDB(userId, data).then(newExpense => {
            setFixedExpenses(prev => [...prev, newExpense]);
        }).catch(console.error);
    };

    const updateFixedExpense = (id: string, data: Partial<Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>>) => {
        setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
        db.updateFixedExpenseDB(id, data).catch(console.error);
    };

    const deleteFixedExpense = (id: string) => {
        setFixedExpenses(prev => prev.filter(f => f.id !== id));
        db.deleteFixedExpenseDB(id).catch(console.error);
    };

    const toggleFixedExpensePaid = async (id: string, paid: boolean, paymentDate: string | null) => {
        // Intercept Virtual Invoices (credit card invoices)
        if (id.startsWith('virtual-invoice-')) {
            const stripped = id.replace('virtual-invoice-', '');
            const parts = stripped.split('-');
            const monthStr = parts.pop()!;
            const yearStr = parts.pop()!;
            const cardId = parts.join('-');

            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            const card = creditCards.find(c => c.id === cardId);
            if (!card) return;

            const txnsToUpdate = creditTransactions.filter(txn => {
                if (txn.card_id !== card.id) return false;
                const d = new Date(txn.date);
                const tDay = d.getDate();
                let tMonth = d.getMonth();
                let tYear = d.getFullYear();
                if (tDay >= card.closing_day) {
                    tMonth++;
                    if (tMonth > 11) { tMonth = 0; tYear++; }
                }
                return tMonth === month && tYear === year;
            });

            const newStatus = paid ? 'paid' : 'open_invoice';
            setCreditTransactions(prev => prev.map(t =>
                txnsToUpdate.some(u => u.id === t.id)
                    ? { ...t, status: newStatus, payment_date: paid ? paymentDate : null }
                    : t
            ));

            for (const txn of txnsToUpdate) {
                await db.updateCreditTransactionDB(txn.id, {
                    status: newStatus,
                    payment_date: paid ? paymentDate : null
                }).catch(console.error);
            }

            if (paid) {
                const invoiceTotal = txnsToUpdate.reduce((acc, t) => acc + t.value, 0);
                const dueMonthStr = String(month + 1).padStart(2, '0');
                const txnData = {
                    category: 'Cartão de Crédito',
                    description: `Fatura ${card.name} (${dueMonthStr}/${year})`,
                    value: invoiceTotal,
                    type: 'expense' as const,
                    payment_method: 'credito' as const,
                    source: 'system' as const,
                    source_ref: id,
                    date: paymentDate || new Date().toISOString()
                };
                db.createTransaction(userId, txnData).then(txn => {
                    setLedger(prev => [txn, ...prev]);
                }).catch(console.error);
            } else {
                setLedger(prev => prev.filter(t => !(t.source === 'system' && t.source_ref === id)));
                db.deleteTransactionsBySourceRef(id).catch(console.error);
            }
            return;
        }

        // Standard Fixed Expenses
        setFixedExpenses(prev => prev.map(f => f.id === id ? { ...f, paid, payment_date: paymentDate } : f));
        db.updateFixedExpenseDB(id, { paid, payment_date: paymentDate }).catch(console.error);
    };

    // ── Recurring Bills CRUD ───────────────────────────────────────────────
    const addRecurringBill = async (data: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>): Promise<RecurringBill> => {
        const bill = await db.createRecurringBillDB(userId, data);
        setRecurringBills(prev => [...prev, bill]);
        return bill;
    };

    const updateRecurringBill = (id: string, data: Partial<Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>>) => {
        setRecurringBills(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
        db.updateRecurringBillDB(id, data).catch(console.error);
    };

    const deleteRecurringBill = (id: string) => {
        setRecurringBills(prev => prev.filter(b => b.id !== id));
        db.deleteRecurringBillDB(id).catch(console.error);
    };

    const generateMonthlyBills = async (month: string) => {
        if (!userId || recurringBills.length === 0) return;
        if (generatingRef.current) return;

        const now = new Date();
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (month > nextMonth) return;

        generatingRef.current = true;
        try {
            const [y, m] = month.split('-').map(Number);
            const toCreate: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>[] = [];

            for (const bill of recurringBills) {
                const billCreatedMonth = bill.created_at.substring(0, 7);
                if (month < billCreatedMonth) continue;

                const dueDate = `${y}-${String(m).padStart(2, '0')}-${String(bill.due_day).padStart(2, '0')}`;
                const alreadyExists = fixedExpenses.some(f =>
                    f.recurring_bill_id === bill.id && f.due_date.startsWith(month)
                );
                if (alreadyExists) continue;

                toCreate.push({
                    description: bill.description,
                    category: bill.category,
                    value: bill.estimated_value,
                    estimated_value: bill.estimated_value,
                    due_date: dueDate,
                    paid: false,
                    payment_date: null,
                    recurring_bill_id: bill.id
                });
            }

            if (toCreate.length > 0) {
                const created: FixedExpense[] = [];
                for (const expense of toCreate) {
                    try {
                        const fe = await db.createFixedExpenseDB(userId, expense);
                        created.push(fe);
                    } catch (e) {
                        console.error('Failed to generate monthly bill:', e);
                    }
                }
                if (created.length > 0) {
                    setFixedExpenses(prev => [...prev, ...created]);
                }
            }
        } finally {
            generatingRef.current = false;
        }
    };

    return {
        addFixedExpense, updateFixedExpense, deleteFixedExpense, toggleFixedExpensePaid,
        addRecurringBill, updateRecurringBill, deleteRecurringBill, generateMonthlyBills,
    };
}
