import { useState, useMemo } from 'react';
import { CreditCard as CardIcon, Plus, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Modal } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { AddCardModal } from './AddCardModal';
import { EditCreditTransactionModal } from './EditCreditTransactionModal';
import type { CreditTransaction } from '../../types';

export function CreditCards() {
    const { creditCards, creditTransactions, deleteCreditCard } = useApp();
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTxn, setEditingTxn] = useState<CreditTransaction | null>(null);
    const [cardToEdit, setCardToEdit] = useState(null);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);

    // Seleciona automaticamente o primeiro cartão caso exista
    useMemo(() => {
        if (creditCards.length > 0 && !selectedCardId) {
            setSelectedCardId(creditCards[0].id);
        }
    }, [creditCards, selectedCardId]);

    const selectedCard = creditCards.find(c => c.id === selectedCardId);

    // Calculate real values
    const currentInvoiceTransactions = useMemo(() => {
        if (!selectedCardId || !selectedCard) return [];

        const cardUnpaid = creditTransactions.filter(t => t.card_id === selectedCardId && t.status !== 'paid');
        if (cardUnpaid.length === 0) return [];

        // Map transactions to their computed invoice period
        const mapped = cardUnpaid.map(t => {
            const txDate = new Date(t.date);
            let txMonth = txDate.getMonth();
            let txYear = txDate.getFullYear();

            if (txDate.getDate() >= selectedCard.closing_day) {
                txMonth++;
                if (txMonth > 11) { txMonth = 0; txYear++; }
            }
            return { ...t, invoiceKey: txYear * 12 + txMonth, txMonth, txYear };
        });

        // Find the earliest open invoice period that has any transactions
        const earliestInvoiceKey = Math.min(...mapped.map(t => t.invoiceKey));

        return mapped
            .filter(t => t.invoiceKey === earliestInvoiceKey)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [creditTransactions, selectedCardId, selectedCard]);

    const currentInvoiceTotal = useMemo(() => {
        return currentInvoiceTransactions.reduce((acc, t) => acc + t.value, 0);
    }, [currentInvoiceTransactions]);

    const availableLimit = useMemo(() => {
        if (!selectedCard) return 0;
        // Total consumed is the sum of ALL unpaid transactions on this card
        const totalConsumed = creditTransactions
            .filter(t => t.card_id === selectedCard.id && t.status !== 'paid')
            .reduce((acc, t) => acc + t.value, 0);

        return Math.max(0, selectedCard.limit_amount - totalConsumed);
    }, [creditTransactions, selectedCard]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CardIcon className="text-blue-500" />
                        Gerenciar Cartões
                    </h1>
                    <p className="text-sm text-text-secondary">Acompanhe seus limites e faturas fixas.</p>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Novo Cartão</span>
                </Button>
            </header>

            {creditCards.length === 0 ? (
                <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <CardIcon size={32} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Nenhum cartão cadastrado</h3>
                        <p className="text-sm text-text-secondary mt-1">Adicione seu primeiro cartão para organizar melhor seu fluxo no crédito.</p>
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2"
                    >
                        Adicionar Cartão
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Lista de Cartões (Carrossel Horizontal no Mobile) */}
                    <div className="lg:col-span-1 flex gap-4 overflow-x-auto pb-2 lg:pb-0 lg:flex-col lg:overflow-visible no-scrollbar">
                        {creditCards.map(card => (
                            <div
                                key={card.id}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`min-w-[280px] lg:min-w-0 p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedCardId === card.id
                                    ? `border-${card.color_theme}-500 bg-gradient-to-br from-card to-muted shadow-lg shadow-${card.color_theme}-500/10`
                                    : 'border-transparent bg-card hover:bg-muted'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full bg-${card.color_theme}-100 dark:bg-${card.color_theme}-900/30 flex items-center justify-center`}>
                                            <CardIcon size={16} className={`text-${card.color_theme}-600 dark:text-${card.color_theme}-400`} />
                                        </div>
                                        <span className="font-bold">{card.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-text-tertiary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-text-secondary uppercase">Limite Total</p>
                                    <p className="font-semibold">{formatCurrency(card.limit_amount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detalhes do Cartão Selecionado */}
                    {selectedCard && (
                        <div className="lg:col-span-2 space-y-6">
                            {/* Card Físico Simulacro Neo-Brutalismo */}
                            <div className={`relative overflow-hidden p-6 rounded-2xl text-white shadow-xl bg-gradient-to-br from-gray-900 to-black`}>
                                <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedCard.color_theme}-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20`}></div>

                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <h2 className="text-xl font-bold tracking-wider">{selectedCard.name}</h2>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setCardToEdit(selectedCard as any); setIsAddOpen(true); }}
                                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                                                title="Editar Cartão"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCardToDelete(selectedCard.id)}
                                                className="p-1.5 rounded-full hover:bg-red-500/80 transition-colors"
                                                title="Excluir Cartão"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400">Vencimento</span>
                                            <span className="font-medium text-sm">Dia {selectedCard.due_day}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 mb-6">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Limite Disponível</p>
                                    <p className="text-3xl font-black tracking-tight">{formatCurrency(availableLimit)}</p>
                                </div>

                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Fatura Atual</p>
                                        <p className="text-xl font-medium">{formatCurrency(currentInvoiceTotal)}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">Fecha dia {selectedCard.closing_day}</p>
                                </div>
                            </div>

                            {/* Fatura Atual & Timeline */}
                            <Card className="p-4 sm:p-6 border-border">
                                <div className="flex justify-between items-center mb-6 gap-2">
                                    <h3 className="font-bold flex-1">Despesas da Fatura Atual</h3>
                                    <Button
                                        variant="outline"
                                        className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm whitespace-nowrap"
                                        onClick={() => window.location.href = '/ledger'}
                                    >
                                        + Lançar no Crédito
                                    </Button>
                                </div>

                                {currentInvoiceTransactions.length === 0 ? (
                                    <div className="text-center py-10 bg-muted/50 rounded-lg border border-dashed border-border">
                                        <p className="text-text-secondary text-sm">Nenhuma transação lançada nesta fatura ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentInvoiceTransactions.map(txn => (
                                            <div
                                                key={txn.id}
                                                onClick={() => setEditingTxn(txn)}
                                                className="flex justify-between items-center py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                        <span className="text-xl">🛍️</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-text-primary">{txn.description}</p>
                                                        <div className="flex gap-2 text-xs text-text-secondary">
                                                            <span>{new Date(txn.date).toLocaleDateString('pt-BR')}</span>
                                                            {txn.installments > 1 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border">
                                                                    {txn.installment_number}/{txn.installments}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm text-text-primary">{formatCurrency(txn.value)}</p>
                                                    <p className="text-xs text-text-tertiary">{txn.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            )}

            <AddCardModal
                isOpen={isAddOpen}
                onClose={() => { setIsAddOpen(false); setCardToEdit(null); }}
                cardToEdit={cardToEdit}
            />

            <EditCreditTransactionModal
                isOpen={!!editingTxn}
                onClose={() => setEditingTxn(null)}
                transaction={editingTxn}
            />

            <Modal isOpen={!!cardToDelete} onClose={() => setCardToDelete(null)} title="Excluir Cartão">
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                        Tem certeza que deseja excluir este cartão? Isso não apagará as transações já registradas no caixa, mas removerá o cartão e suas faturas em aberto.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setCardToDelete(null)}>Cancelar</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (cardToDelete) {
                                    deleteCreditCard(cardToDelete);
                                    if (selectedCardId === cardToDelete) setSelectedCardId(null);
                                }
                                setCardToDelete(null);
                            }}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
