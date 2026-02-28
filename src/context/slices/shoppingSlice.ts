/**
 * Shopping Slice — manages shopping lists, shopping items and product catalog.
 *
 * Cross-dependency: finalizeShoppingList and reopenShoppingList need to
 * create/remove ledger entries. They receive setLedger and toast as dependencies.
 * When payment method is 'credito', the total is sent to the credit card system
 * via addCreditTransaction instead of the cash ledger.
 */
import React from 'react';
import { categorizarItem } from '../../lib/categorias';
import * as db from '../../lib/supabaseService';
import type { ShoppingList, ShoppingItem, LedgerTransaction, CreditTransaction, PaymentMethod } from '../../types';

type SetLedger = React.Dispatch<React.SetStateAction<LedgerTransaction[]>>;
type AddCreditTransactionFn = (data: Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
type ProductCatalog = { id: string; nome_produto: string; categoria: string };

export function createShoppingSlice(
    userId: string,
    shoppingLists: ShoppingList[],
    setShoppingLists: React.Dispatch<React.SetStateAction<ShoppingList[]>>,
    setProductCatalog: React.Dispatch<React.SetStateAction<ProductCatalog[]>>,
    setLedger: SetLedger,
    onError: (msg: string, detail?: string) => void,
    addCreditTransaction: AddCreditTransactionFn = async () => { },
) {
    const recalcListTotal = (items: ShoppingItem[]): number =>
        items.reduce((acc, i) => acc + (i.valor_total_item || 0), 0);

    const addShoppingList = async (nome: string): Promise<ShoppingList> => {
        const newList = await db.createShoppingList(userId, nome);
        setShoppingLists(prev => [newList, ...prev]);
        return newList;
    };

    const deleteShoppingList = (id: string) => {
        setShoppingLists(prev => prev.filter(l => l.id !== id));
        db.deleteShoppingListDB(id).catch(console.error);
    };

    const duplicateShoppingList = (id: string) => {
        const original = shoppingLists.find(l => l.id === id);
        if (!original) return;

        db.createShoppingList(userId, `${original.nome_lista} (cópia)`).then(async newList => {
            if (original.items.length > 0) {
                const itemsToCreate = original.items.map(item => ({
                    list_id: newList.id,
                    nome_item: item.nome_item,
                    categoria: item.categoria,
                    quantidade: item.quantidade,
                    unidade_medida: item.unidade_medida,
                    valor_unitario: 0,
                    valor_total_item: 0,
                    marcado_como_pegado: false,
                    observacoes: item.observacoes
                }));
                const createdItems = await db.createShoppingItems(itemsToCreate);
                newList.items = createdItems;
            }
            setShoppingLists(prev => [newList, ...prev]);
        }).catch(console.error);
    };

    const renameShoppingList = (id: string, nome: string) => {
        setShoppingLists(prev => prev.map(l => l.id === id ? { ...l, nome_lista: nome } : l));
        db.updateShoppingListDB(id, { nome_lista: nome } as Partial<ShoppingList>).catch(console.error);
    };

    const reopenShoppingList = (id: string) => {
        setShoppingLists(prev => prev.map(l =>
            l.id === id ? { ...l, status: 'aberta' as const, data_compra: null } : l
        ));
        setLedger(prev => prev.filter(t => t.source_ref !== id));
        db.updateShoppingListDB(id, { status: 'aberta', data_compra: null } as Partial<ShoppingList>).catch(console.error);
        db.deleteTransactionsBySourceRef(id).catch(console.error);
    };

    const finalizeShoppingList = (
        id: string,
        finalTotal?: number,
        paymentMethod: PaymentMethod = 'pix',
        cardId?: string,
        installments: number = 1,
    ) => {
        let listTotal = 0;
        let listName = '';

        setShoppingLists(prev => prev.map(list => {
            if (list.id !== id) return list;
            listTotal = finalTotal !== undefined ? finalTotal : list.valor_total_lista;
            listName = list.nome_lista;
            return {
                ...list,
                status: 'finalizada' as const,
                valor_total_lista: listTotal,
                data_compra: new Date().toISOString(),
                payment_method: paymentMethod,
            };
        }));

        db.updateShoppingListDB(id, {
            status: 'finalizada',
            valor_total_lista: finalTotal,
            data_compra: new Date().toISOString(),
        } as Partial<ShoppingList>).catch(console.error);

        if (listTotal <= 0) return;

        if (paymentMethod === 'credito' && cardId) {
            // ── Credit card path: create a credit transaction ──────────────
            addCreditTransaction({
                card_id: cardId,
                date: new Date().toISOString(),
                category: 'Mercado',
                description: `Lista: ${listName}`,
                value: listTotal,
                installments,
                installment_number: 1,
                status: 'open_invoice',
                payment_date: null,
            }).catch(() => onError('Erro ao lançar na fatura', 'A lista foi finalizada, mas o lançamento no cartão não foi salvo.'));
        } else {
            // ── Cash / PIX / Debit path: deduct from ledger ──────────────
            const txnData = {
                category: 'Mercado',
                description: `Lista: ${listName}`,
                value: listTotal,
                type: 'expense' as const,
                payment_method: paymentMethod,
                source: 'system' as const,
                source_ref: id,
                date: new Date().toISOString(),
            };
            db.createTransaction(userId, txnData).then(txn => {
                setLedger(prev => [txn, ...prev]);
            }).catch(() => onError('Erro ao registrar compra no caixa', 'A lista foi finalizada, mas o lançamento não foi salvo.'));
        }
    };

    const addItemToList = (listId: string, nome: string, categoria?: string) => {
        const cat = categoria || categorizarItem(nome);
        const itemData = {
            list_id: listId, nome_item: nome.trim(), categoria: cat,
            quantidade: 1, unidade_medida: 'un', valor_unitario: 0,
            valor_total_item: 0, marcado_como_pegado: false, observacoes: null
        };

        db.createShoppingItem(itemData).then(newItem => {
            setShoppingLists(prev => prev.map(list => {
                if (list.id !== listId) return list;
                const newItems = [...list.items, newItem];
                return { ...list, items: newItems, valor_total_lista: recalcListTotal(newItems) };
            }));
            db.addProductToCatalogDB(nome.trim(), cat).then(product => {
                if (product) {
                    setProductCatalog(prev => {
                        if (prev.some(p => p.id === product.id)) return prev;
                        return [...prev, product];
                    });
                }
            }).catch(() => { /* Ignore duplicates */ });
        }).catch(() => onError('Erro ao adicionar item', 'Não foi possível salvar o item. Tente novamente.'));
    };

    const addMultipleItemsToList = (listId: string, items: { nome: string; categoria: string }[]) => {
        const itemsData = items.map(item => ({
            list_id: listId, nome_item: item.nome.trim(),
            categoria: item.categoria || categorizarItem(item.nome),
            quantidade: 1, unidade_medida: 'un', valor_unitario: 0,
            valor_total_item: 0, marcado_como_pegado: false, observacoes: null
        }));

        db.createShoppingItems(itemsData).then(newItems => {
            setShoppingLists(prev => prev.map(list => {
                if (list.id !== listId) return list;
                const allItems = [...list.items, ...newItems];
                return { ...list, items: allItems, valor_total_lista: recalcListTotal(allItems) };
            }));
        }).catch(() => onError('Erro ao adicionar itens', 'Não foi possível salvar os itens. Tente novamente.'));
    };

    const updateItemInList = (listId: string, itemId: string, data: Partial<ShoppingItem>) => {
        setShoppingLists(prev => prev.map(list => {
            if (list.id !== listId) return list;
            const newItems = list.items.map(item => {
                if (item.id !== itemId) return item;
                const updated = { ...item, ...data };
                if (data.quantidade !== undefined || data.valor_unitario !== undefined) {
                    updated.valor_total_item = updated.quantidade * updated.valor_unitario;
                }
                return updated;
            });
            return { ...list, items: newItems, valor_total_lista: recalcListTotal(newItems) };
        }));

        const dbData = { ...data } as Partial<ShoppingItem> & { valor_total_item?: number };
        if (data.quantidade !== undefined || data.valor_unitario !== undefined) {
            const list = shoppingLists.find(l => l.id === listId);
            const item = list?.items.find(i => i.id === itemId);
            if (item) {
                const qty = data.quantidade ?? item.quantidade;
                const price = data.valor_unitario ?? item.valor_unitario;
                dbData.valor_total_item = qty * price;
            }
        }
        db.updateShoppingItemDB(itemId, dbData).catch(console.error);

        const updatedList = shoppingLists.find(l => l.id === listId);
        if (updatedList) {
            const newItems = updatedList.items.map(i => {
                if (i.id !== itemId) return i;
                const u = { ...i, ...data };
                if (data.quantidade !== undefined || data.valor_unitario !== undefined) {
                    u.valor_total_item = u.quantidade * u.valor_unitario;
                }
                return u;
            });
            db.updateShoppingListDB(listId, { valor_total_lista: recalcListTotal(newItems) } as Partial<ShoppingList>).catch(console.error);
        }
    };

    const deleteItemFromList = (listId: string, itemId: string) => {
        setShoppingLists(prev => prev.map(list => {
            if (list.id !== listId) return list;
            const newItems = list.items.filter(item => item.id !== itemId);
            return { ...list, items: newItems, valor_total_lista: recalcListTotal(newItems) };
        }));
        db.deleteShoppingItemDB(itemId).catch(console.error);
    };

    const addProductToCatalog = (nome: string, categoria: string): ProductCatalog => {
        const tempProduct = { id: crypto.randomUUID(), nome_produto: nome.trim(), categoria };
        setProductCatalog(prev => [...prev, tempProduct]);
        db.addProductToCatalogDB(nome, categoria).catch(() => { /* Ignore duplicates */ });
        return tempProduct;
    };

    return {
        addShoppingList, deleteShoppingList, duplicateShoppingList, renameShoppingList,
        reopenShoppingList, finalizeShoppingList, addItemToList, addMultipleItemsToList,
        updateItemInList, deleteItemFromList, addProductToCatalog,
    };
}
