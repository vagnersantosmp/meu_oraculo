import React, { useState } from 'react';
import { X, CreditCard as CardIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui';

import type { CreditCard } from '../../types';

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardToEdit?: CreditCard | null;
}

const colorOptions = [
    { value: 'blue', label: 'Azul', hex: 'bg-blue-500' },
    { value: 'purple', label: 'Roxo', hex: 'bg-purple-500' },
    { value: 'emerald', label: 'Verde', hex: 'bg-emerald-500' },
    { value: 'orange', label: 'Laranja', hex: 'bg-orange-500' },
    { value: 'red', label: 'Vermelho', hex: 'bg-red-500' },
    { value: 'pink', label: 'Rosa', hex: 'bg-pink-500' },
    { value: 'sky', label: 'Céu', hex: 'bg-sky-500' },
    { value: 'slate', label: 'Cinza', hex: 'bg-slate-500' },
];

export function AddCardModal({ isOpen, onClose, cardToEdit }: AddCardModalProps) {
    const { addCreditCard, updateCreditCard } = useApp();
    const [name, setName] = useState('');
    const [color, setColor] = useState('blue');
    const [limitString, setLimitString] = useState('');
    const [closingDay, setClosingDay] = useState('25');
    const [dueDay, setDueDay] = useState('5');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (cardToEdit && isOpen) {
            setName(cardToEdit.name);
            setColor(cardToEdit.color_theme);
            const val = cardToEdit.limit_amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            setLimitString(val);
            setClosingDay(cardToEdit.closing_day.toString());
            setDueDay(cardToEdit.due_day.toString());
        } else if (isOpen) {
            setName('');
            setColor('blue');
            setLimitString('');
            setClosingDay('25');
            setDueDay('5');
        }
    }, [cardToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const limit = parseFloat(limitString.replace(/\./g, '').replace(',', '.'));
            if (cardToEdit) {
                updateCreditCard(cardToEdit.id, {
                    name,
                    color_theme: color,
                    limit_amount: limit || 0,
                    closing_day: parseInt(closingDay, 10),
                    due_day: parseInt(dueDay, 10)
                });
            } else {
                addCreditCard({
                    name,
                    color_theme: color,
                    limit_amount: limit || 0,
                    closing_day: parseInt(closingDay, 10),
                    due_day: parseInt(dueDay, 10)
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val === '') {
            setLimitString('');
            return;
        }
        val = (parseInt(val, 10) / 100).toFixed(2);
        val = val.replace('.', ',');
        val = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        setLimitString(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CardIcon className="text-blue-500" />
                        {cardToEdit ? 'Editar Cartão' : 'Adicionar Cartão'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors active:scale-95">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="add-card-form" onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Cartão (ou Banco)</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Ex: Nubank, Itaú Black..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Cor do Cartão</label>
                            <div className="flex gap-3 flex-wrap">
                                {colorOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setColor(opt.value)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${opt.hex} ${color === opt.value ? 'ring-4 ring-offset-2 ring-primary ring-offset-card scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                                        title={opt.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Limite Total (R$)</label>
                            <input
                                type="text"
                                required
                                value={limitString}
                                onChange={handleLimitChange}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-xl font-medium"
                                placeholder="0,00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Dia do Fechamento</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="31"
                                    value={closingDay}
                                    onChange={e => setClosingDay(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Dia do Vencimento</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="31"
                                    value={dueDay}
                                    onChange={e => setDueDay(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 mt-auto">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="add-card-form" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : cardToEdit ? 'Salvar Alterações' : 'Salvar Cartão'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
