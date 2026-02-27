/**
 * Cards Slice — manages credit cards and credit card transactions (individual purchases).
 * Cross-dependency: addCreditTransaction only needs setCreditTransactions + creditCards data.
 */
import React from 'react';
import * as db from '../../lib/supabaseService';
import type { CreditCard, CreditTransaction } from '../../types';

export function createCardsSlice(
    userId: string,
    creditCards: CreditCard[],
    setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>,
    setCreditTransactions: React.Dispatch<React.SetStateAction<CreditTransaction[]>>,
) {
    const addCreditCard = (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
        db.createCreditCardDB(userId, data).then(card => {
            setCreditCards(prev => [...prev, card].sort((a, b) => a.name.localeCompare(b.name)));
        }).catch(console.error);
    };

    const updateCreditCard = (id: string, data: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at'>>) => {
        setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        db.updateCreditCardDB(id, data).catch(console.error);
    };

    const deleteCreditCard = (id: string) => {
        setCreditCards(prev => prev.filter(c => c.id !== id));
        db.deleteCreditCardDB(id).catch(console.error);
    };

    const addCreditTransaction = async (data: Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>) => {
        const { installments = 1 } = data;

        if (installments <= 1) {
            db.createCreditTransactionDB(userId, { ...data, installments: 1, installment_number: 1 }).then(txn => {
                setCreditTransactions(prev =>
                    [txn, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );
            }).catch(console.error);
            return;
        }

        const card = creditCards.find(c => c.id === data.card_id);
        if (!card) return;

        const purchaseDate = new Date(data.date);
        const purchaseDay = purchaseDate.getDate();
        let baseMonth = purchaseDate.getMonth();
        let baseYear = purchaseDate.getFullYear();

        if (purchaseDay >= card.closing_day) {
            baseMonth++;
            if (baseMonth > 11) { baseMonth = 0; baseYear++; }
        }

        const installmentValue = Math.round((data.value / installments) * 100) / 100;
        let parentId: string | undefined;
        const createdTxns: CreditTransaction[] = [];

        for (let i = 1; i <= installments; i++) {
            let instMonth = baseMonth + (i - 1);
            let instYear = baseYear;
            while (instMonth > 11) { instMonth -= 12; instYear++; }

            const instDate = new Date(instYear, instMonth, Math.min(purchaseDay, card.closing_day - 1 || 1));
            instDate.setHours(12, 0, 0, 0);

            const txnData = {
                ...data,
                value: installmentValue,
                installments,
                installment_number: i,
                date: instDate.toISOString(),
                parent_transaction_id: i === 1 ? undefined : parentId,
            };

            try {
                const txn = await db.createCreditTransactionDB(userId, txnData);
                createdTxns.push(txn);
                if (i === 1) parentId = txn.id;
            } catch (e) {
                console.error(e);
            }
        }

        if (createdTxns.length > 0) {
            setCreditTransactions(prev =>
                [...prev, ...createdTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            );
        }
    };

    const updateCreditTransaction = (id: string, data: Partial<Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>>) => {
        setCreditTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        db.updateCreditTransactionDB(id, data).catch(console.error);
    };

    const deleteCreditTransaction = (id: string) => {
        setCreditTransactions(prev => prev.filter(t => t.id !== id));
        db.deleteCreditTransactionDB(id).catch(console.error);
    };

    return {
        addCreditCard, updateCreditCard, deleteCreditCard,
        addCreditTransaction, updateCreditTransaction, deleteCreditTransaction,
    };
}
