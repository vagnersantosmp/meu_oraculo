import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Input, Button } from '../../components/ui';
import { CurrencyInput } from '../../components/CurrencyInput';
import { getLedgerCategoryNames } from '../../lib/ledger-categories';
import type { CreditTransaction } from '../../types';

interface EditCreditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: CreditTransaction | null;
}

export function EditCreditTransactionModal({ isOpen, onClose, transaction }: EditCreditTransactionModalProps) {
    const { updateCreditTransaction, deleteCreditTransaction } = useApp();
    const [desc, setDesc] = useState('');
    const [valueReais, setValueReais] = useState(0);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categoryOptions = useMemo(() => getLedgerCategoryNames('expense'), []);

    useEffect(() => {
        if (transaction) {
            setDesc(transaction.description);
            setValueReais(transaction.value);
            setCategory(transaction.category);
            setDate(transaction.date.split('T')[0]);
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || valueReais === 0 || !category || !date) return;

        setIsSubmitting(true);
        try {
            updateCreditTransaction(transaction.id, {
                description: desc,
                value: valueReais,
                category,
                date: new Date(date + 'T12:00:00').toISOString()
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (transaction.installments > 1 && transaction.installment_number === 1) {
            // É a parcela original — propor excluir todas as parcelas via CASCADE
            const confirmed = window.confirm(
                `Esta é a 1ª parcela de uma compra em ${transaction.installments}x.\n\nDeseja excluir TODAS as ${transaction.installments} parcelas desta compra?\n\nClique OK para excluir todas, ou Cancelar para não excluir.`
            );
            if (confirmed) {
                deleteCreditTransaction(transaction.id); // CASCADE no banco exclui as filhas
                onClose();
            }
        } else {
            if (window.confirm('Tem certeza que deseja excluir esta parcela?')) {
                deleteCreditTransaction(transaction.id);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-bold">Editar Transação</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors active:scale-95">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="edit-credit-txn-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-11 rounded-xl border border-border bg-card text-text-primary px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Selecione...</option>
                                {categoryOptions.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                            <Input
                                placeholder="Ex: Mercado, Uber..."
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Data da Compra</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
                            <CurrencyInput
                                value={valueReais}
                                onChange={setValueReais}
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/30 flex justify-between gap-3 mt-auto">
                    <Button type="button" variant="danger" onClick={handleDelete} className="bg-red-100 hover:bg-red-200 text-red-600 px-3">
                        <Trash2 size={20} />
                    </Button>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="edit-credit-txn-form" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting || !desc || valueReais === 0 || !category}>
                            Salvar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
