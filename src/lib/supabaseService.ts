import { supabase } from './supabaseClient';
import type {
    ShoppingList, ShoppingItem, LedgerTransaction,
    CarFuel, CarMaintenance, FixedExpense,
    CreditCard, CreditTransaction, RecurringBill
} from '../types';

// =============================================
// PRODUCT CATALOG (SHARED)
// =============================================

export async function fetchProductCatalog() {
    const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .order('nome_produto');
    if (error) throw error;
    return data as { id: string; nome_produto: string; categoria: string }[];
}

export async function addProductToCatalogDB(nome: string, categoria: string) {
    const { data, error } = await supabase
        .from('product_catalog')
        .insert({ nome_produto: nome.trim(), categoria })
        .select()
        .single();
    // If duplicate (unique constraint violation), just ignore
    if (error && error.code === '23505') return null;
    if (error) throw error;
    return data as { id: string; nome_produto: string; categoria: string } | null;
}

// =============================================
// SHOPPING LISTS
// =============================================

export async function fetchShoppingLists(userId: string) {
    const { data: lists, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', userId)
        .order('data_criacao', { ascending: false });
    if (error) throw error;

    // Fetch all items for these lists in one query
    const listIds = (lists || []).map(l => l.id);
    let items: ShoppingItem[] = [];
    if (listIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
            .from('shopping_items')
            .select('*')
            .in('list_id', listIds);
        if (itemsError) throw itemsError;
        items = (itemsData || []) as ShoppingItem[];
    }

    // Attach items to their lists
    return (lists || []).map(list => ({
        ...list,
        items: items.filter(i => i.list_id === list.id)
    })) as ShoppingList[];
}

export async function createShoppingList(userId: string, nome: string) {
    const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ user_id: userId, nome_lista: nome })
        .select()
        .single();
    if (error) throw error;
    return { ...data, items: [] } as ShoppingList;
}

export async function updateShoppingListDB(id: string, data: Partial<ShoppingList>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { items, ...dbData } = data as ShoppingList & { items?: ShoppingItem[] };
    const { error } = await supabase
        .from('shopping_lists')
        .update(dbData)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteShoppingListDB(id: string) {
    const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// SHOPPING ITEMS
// =============================================

export async function createShoppingItem(item: Omit<ShoppingItem, 'id'>) {
    const { data, error } = await supabase
        .from('shopping_items')
        .insert(item)
        .select()
        .single();
    if (error) throw error;
    return data as ShoppingItem;
}

export async function createShoppingItems(items: Omit<ShoppingItem, 'id'>[]) {
    const { data, error } = await supabase
        .from('shopping_items')
        .insert(items)
        .select();
    if (error) throw error;
    return (data || []) as ShoppingItem[];
}

export async function updateShoppingItemDB(id: string, data: Partial<ShoppingItem>) {
    const { error } = await supabase
        .from('shopping_items')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteShoppingItemDB(id: string) {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// LEDGER TRANSACTIONS
// =============================================

export async function fetchTransactions(userId: string) {
    const { data, error } = await supabase
        .from('ledger_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as LedgerTransaction[];
}

export async function createTransaction(userId: string, txn: Omit<LedgerTransaction, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('ledger_transactions')
        .insert({ ...txn, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as LedgerTransaction;
}

export async function updateTransactionDB(id: string, data: Partial<LedgerTransaction>) {
    const { error } = await supabase
        .from('ledger_transactions')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteTransactionDB(id: string) {
    const { error } = await supabase.from('ledger_transactions').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteTransactionsBySourceRef(sourceRef: string) {
    const { error } = await supabase
        .from('ledger_transactions')
        .delete()
        .eq('source_ref', sourceRef);
    if (error) throw error;
}

// =============================================
// CAR FUEL
// =============================================

export async function fetchFuelRecords(userId: string) {
    const { data, error } = await supabase
        .from('car_fuel')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as CarFuel[];
}

export async function createFuelDB(userId: string, fuel: Omit<CarFuel, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('car_fuel')
        .insert({ ...fuel, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as CarFuel;
}

export async function updateFuelDB(id: string, data: Partial<CarFuel>) {
    const { error } = await supabase
        .from('car_fuel')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteFuelDB(id: string) {
    const { error } = await supabase.from('car_fuel').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// CAR MAINTENANCE
// =============================================

export async function fetchMaintenanceRecords(userId: string) {
    const { data, error } = await supabase
        .from('car_maintenance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as CarMaintenance[];
}

export async function createMaintenanceDB(userId: string, maint: Omit<CarMaintenance, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('car_maintenance')
        .insert({ ...maint, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as CarMaintenance;
}

export async function updateMaintenanceDB(id: string, data: Partial<CarMaintenance>) {
    const { error } = await supabase
        .from('car_maintenance')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteMaintenanceDB(id: string) {
    const { error } = await supabase.from('car_maintenance').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// FIXED EXPENSES
// =============================================

export async function fetchFixedExpenses(userId: string) {
    const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []) as FixedExpense[];
}

export async function createFixedExpenseDB(userId: string, expense: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({ ...expense, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as FixedExpense;
}

export async function updateFixedExpenseDB(id: string, data: Partial<FixedExpense>) {
    const { error } = await supabase
        .from('fixed_expenses')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteFixedExpenseDB(id: string) {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// RECURRING BILLS
// =============================================

export async function fetchRecurringBills(userId: string) {
    const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as RecurringBill[];
}

export async function createRecurringBillDB(userId: string, bill: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('recurring_bills')
        .insert({ ...bill, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as RecurringBill;
}

export async function updateRecurringBillDB(id: string, data: Partial<RecurringBill>) {
    const { error } = await supabase
        .from('recurring_bills')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteRecurringBillDB(id: string) {
    const { error } = await supabase.from('recurring_bills').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// MONTHLY GOALS
// =============================================

export async function fetchMonthlyGoals(userId: string) {
    const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    const goals: Record<string, number> = {};
    (data || []).forEach((g: { month: string; goal: number }) => {
        goals[g.month] = g.goal;
    });
    return goals;
}

export async function setMonthlyGoalDB(userId: string, month: string, goal: number) {
    const { error } = await supabase
        .from('monthly_goals')
        .upsert(
            { user_id: userId, month, goal },
            { onConflict: 'user_id,month' }
        );
    if (error) throw error;
}

// =============================================
// CREDIT CARDS
// =============================================

export async function fetchCreditCards(userId: string) {
    const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as CreditCard[];
}

export async function createCreditCardDB(userId: string, card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('credit_cards')
        .insert({ ...card, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as CreditCard;
}

export async function updateCreditCardDB(id: string, data: Partial<CreditCard>) {
    const { error } = await supabase
        .from('credit_cards')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteCreditCardDB(id: string) {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) throw error;
}

// =============================================
// CREDIT TRANSACTIONS (INVOICES)
// =============================================

export async function fetchCreditTransactions(userId: string) {
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as CreditTransaction[];
}

export async function createCreditTransactionDB(userId: string, txn: Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('credit_transactions')
        .insert({ ...txn, user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data as CreditTransaction;
}

export async function updateCreditTransactionDB(id: string, data: Partial<CreditTransaction>) {
    const { error } = await supabase
        .from('credit_transactions')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

export async function deleteCreditTransactionDB(id: string) {
    const { error } = await supabase.from('credit_transactions').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteCreditTransactionsBySourceRef(sourceRef: string) {
    const { error } = await supabase
        .from('credit_transactions')
        .delete()
        .eq('source_ref', sourceRef);
    if (error) throw error;
}
