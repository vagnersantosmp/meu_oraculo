/**
 * Ledger Slice — manages cash ledger transactions (income/expense).
 * No cross-domain dependencies beyond the database layer.
 */
import React from 'react';
import * as db from '../../lib/supabaseService';
import type { LedgerTransaction } from '../../types';

export function createLedgerSlice(
    userId: string,
    setLedger: React.Dispatch<React.SetStateAction<LedgerTransaction[]>>,
) {
    const addTransaction = (data: Omit<LedgerTransaction, 'id' | 'user_id' | 'created_at'>) => {
        db.createTransaction(userId, data).then(txn => {
            setLedger(prev => [txn, ...prev]);
        }).catch(console.error);
    };

    const updateTransaction = (id: string, data: Partial<Omit<LedgerTransaction, 'id' | 'user_id' | 'created_at'>>) => {
        setLedger(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        db.updateTransactionDB(id, data).catch(console.error);
    };

    const deleteTransaction = (id: string) => {
        setLedger(prev => prev.filter(t => t.id !== id));
        db.deleteTransactionDB(id).catch(console.error);
    };

    return { addTransaction, updateTransaction, deleteTransaction };
}
