/**
 * AppContext — Orchestrator
 *
 * This file is the single entry point for all app state.
 * Domain logic is delegated to slices in ./slices/:
 *   - shoppingSlice  → shopping lists & items
 *   - ledgerSlice    → cash ledger transactions
 *   - carSlice       → fuel & maintenance records
 *   - billsSlice     → fixed expenses, recurring bills & invoice payment
 *   - cardsSlice     → credit cards & credit card transactions
 *
 * The public API (useApp) is unchanged — all components continue to work without modification.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
    ShoppingList, ShoppingItem, CarFuel, CarMaintenance, LedgerTransaction,
    DashboardStats, FixedExpense, CreditCard, CreditTransaction, RecurringBill
} from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import * as db from '../lib/supabaseService';

// ── Domain Slices ──────────────────────────────────────────────────────────────
import { createShoppingSlice } from './slices/shoppingSlice';
import { createLedgerSlice } from './slices/ledgerSlice';
import { createCarSlice } from './slices/carSlice';
import { createBillsSlice } from './slices/billsSlice';
import { createCardsSlice } from './slices/cardsSlice';

// ── Context Type (public API — unchanged) ──────────────────────────────────────
interface AppContextType {
    loading: boolean;
    shoppingLists: ShoppingList[];
    ledger: LedgerTransaction[];
    fuelRecords: CarFuel[];
    maintenanceRecords: CarMaintenance[];
    stats: DashboardStats;
    productCatalog: { id: string; nome_produto: string; categoria: string }[];

    addShoppingList: (nome: string) => Promise<ShoppingList>;
    deleteShoppingList: (id: string) => void;
    duplicateShoppingList: (id: string) => void;
    renameShoppingList: (id: string, nome: string) => void;
    reopenShoppingList: (id: string) => void;
    finalizeShoppingList: (id: string, finalTotal?: number, paymentMethod?: import('../types').PaymentMethod, cardId?: string, installments?: number) => void;
    addItemToList: (listId: string, nome: string, categoria?: string) => void;
    addMultipleItemsToList: (listId: string, items: { nome: string; categoria: string }[]) => void;
    updateItemInList: (listId: string, itemId: string, data: Partial<ShoppingItem>) => void;
    deleteItemFromList: (listId: string, itemId: string) => void;
    addProductToCatalog: (nome: string, categoria: string) => { id: string; nome_produto: string; categoria: string };

    addFuel: (data: Omit<CarFuel, 'id' | 'user_id' | 'created_at'>) => void;
    updateFuel: (id: string, data: Partial<Omit<CarFuel, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteFuel: (id: string) => void;
    addMaintenance: (data: Omit<CarMaintenance, 'id' | 'user_id' | 'created_at'>) => void;
    updateMaintenance: (id: string, data: Partial<Omit<CarMaintenance, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteMaintenance: (id: string) => void;

    addTransaction: (data: Omit<LedgerTransaction, 'id' | 'user_id' | 'created_at'>) => void;
    updateTransaction: (id: string, data: Partial<Omit<LedgerTransaction, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteTransaction: (id: string) => void;

    fixedExpenses: FixedExpense[];
    addFixedExpense: (data: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) => void;
    updateFixedExpense: (id: string, data: Partial<Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteFixedExpense: (id: string) => void;
    toggleFixedExpensePaid: (id: string, paid: boolean, paymentDate: string | null) => void;

    recurringBills: RecurringBill[];
    addRecurringBill: (data: Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>) => Promise<RecurringBill>;
    updateRecurringBill: (id: string, data: Partial<Omit<RecurringBill, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteRecurringBill: (id: string) => void;
    generateMonthlyBills: (month: string) => Promise<void>;

    monthlyGoals: Record<string, number>;
    setMonthlyGoal: (month: string, goal: number) => void;

    creditCards: CreditCard[];
    creditTransactions: CreditTransaction[];
    addCreditCard: (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => void;
    updateCreditCard: (id: string, data: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteCreditCard: (id: string) => void;
    addCreditTransaction: (data: Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>) => void;
    updateCreditTransaction: (id: string, data: Partial<Omit<CreditTransaction, 'id' | 'user_id' | 'created_at'>>) => void;
    deleteCreditTransaction: (id: string) => void;

    getCarAlerts: () => { status: 'OK' | 'ATENÇÃO' | 'URGENTE', remainingKm: number, nextMaintenanceKm: number, type: string } | null;

    currentMonth: string;
    changeMonth: (delta: number) => void;
    formatMonthDisplay: (yyyy_mm: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id || '';
    const { toast } = useToast();

    // ── State ──────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
    const [fuelRecords, setFuelRecords] = useState<CarFuel[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<CarMaintenance[]>([]);
    const [productCatalog, setProductCatalog] = useState<{ id: string; nome_produto: string; categoria: string }[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [monthlyGoals, setMonthlyGoalsState] = useState<Record<string, number>>({});
    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
    const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
    const [stats, setStats] = useState<DashboardStats>({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const generatingRef = useRef(false);
    // Ref to always have latest creditCards for use inside stable closures
    const creditCardsRef = useRef<CreditCard[]>([]);
    useEffect(() => { creditCardsRef.current = creditCards; }, [creditCards]);

    // ── Global Month Navigation ────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const changeMonth = useCallback((delta: number) => {
        setCurrentMonth(prev => {
            const [year, month] = prev.split('-').map(Number);
            const date = new Date(year, month - 1 + delta, 1);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });
    }, []);

    const formatMonthDisplay = useCallback((yyyy_mm: string) => {
        const [year, month] = yyyy_mm.split('-').map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, []);

    // ── Data Loading ───────────────────────────────────────────────────────────
    const loadAllData = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const [lists, txns, fuel, maint, fixed, goals, catalog, cards, cardTxns, recurring] = await Promise.all([
                db.fetchShoppingLists(userId),
                db.fetchTransactions(userId),
                db.fetchFuelRecords(userId),
                db.fetchMaintenanceRecords(userId),
                db.fetchFixedExpenses(userId),
                db.fetchMonthlyGoals(userId),
                db.fetchProductCatalog(),
                db.fetchCreditCards(userId),
                db.fetchCreditTransactions(userId),
                db.fetchRecurringBills(userId)
            ]);
            setShoppingLists(lists);
            setLedger(txns);
            setFuelRecords(fuel);
            setMaintenanceRecords(maint);
            setFixedExpenses(fixed);
            setMonthlyGoalsState(goals);
            setProductCatalog(catalog);
            setCreditCards(cards);
            setCreditTransactions(cardTxns);
            setRecurringBills(recurring);
        } catch (err) {
            console.error('Failed to load data:', err);
            toast.error('Erro ao carregar dados', 'Verifique sua conexão e recarregue a página.');
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => { loadAllData(); }, [loadAllData]);

    // ── Virtual Credit Card Invoices (computed from card transactions) ──────────
    const virtualInvoices = useMemo(() => {
        const invoices: Record<string, FixedExpense> = {};

        creditCards.forEach(card => {
            const cardTxns = creditTransactions.filter(t => t.card_id === card.id);

            cardTxns.forEach(txn => {
                const date = new Date(txn.date);
                const day = date.getDate();
                let month = date.getMonth();
                let year = date.getFullYear();

                if (day >= card.closing_day) {
                    month++;
                    if (month > 11) { month = 0; year++; }
                }

                const invoiceId = `virtual-invoice-${card.id}-${year}-${month}`;

                let dueMonth = month;
                let dueYear = year;
                if (card.due_day < card.closing_day) {
                    dueMonth++;
                    if (dueMonth > 11) { dueMonth = 0; dueYear++; }
                }

                const invoiceDueDate = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(card.due_day).padStart(2, '0')}`;

                if (!invoices[invoiceId]) {
                    invoices[invoiceId] = {
                        id: invoiceId, user_id: userId,
                        description: `Fatura ${card.name} (${String(dueMonth + 1).padStart(2, '0')}/${dueYear})`,
                        category: 'Cartão de Crédito', value: 0,
                        due_date: invoiceDueDate, paid: true,
                        payment_date: invoiceDueDate, created_at: new Date().toISOString()
                    };
                }

                invoices[invoiceId].value += txn.value;
                if (txn.status !== 'paid') {
                    invoices[invoiceId].paid = false;
                    invoices[invoiceId].payment_date = null;
                } else if (txn.payment_date) {
                    invoices[invoiceId].payment_date = txn.payment_date;
                }
            });
        });

        return Object.values(invoices);
    }, [creditCards, creditTransactions, userId]);

    const allFixedExpenses = useMemo(() => [...fixedExpenses, ...virtualInvoices], [fixedExpenses, virtualInvoices]);

    // ── Stats (legacy — kept for compatibility) ────────────────────────────────
    useMemo(() => {
        const income = ledger.filter(t => t.type === 'income' && !(t.source === 'system' && t.source_ref?.startsWith('virtual-invoice-'))).reduce((acc, t) => acc + t.value, 0);
        const ledgerExpense = ledger.filter(t => t.type === 'expense' && !(t.source === 'system' && t.source_ref?.startsWith('virtual-invoice-'))).reduce((acc, t) => acc + t.value, 0);
        const fixedExpenseTotal = allFixedExpenses.filter(f => f.paid).reduce((acc, f) => acc + f.value, 0);
        setStats({
            totalIncome: income,
            totalExpense: ledgerExpense + fixedExpenseTotal,
            balance: income - (ledgerExpense + fixedExpenseTotal)
        });
    }, [ledger, allFixedExpenses]);

    // ── Monthly Goals ──────────────────────────────────────────────────────────
    const setMonthlyGoal = (month: string, goal: number) => {
        setMonthlyGoalsState(prev => ({ ...prev, [month]: goal }));
        db.setMonthlyGoalDB(userId, month, goal).catch(console.error);
    };

    // ── Slices (domain-specific logic extracted into separate files) ───────────
    const cardsSlice = createCardsSlice(userId, creditCards, setCreditCards, setCreditTransactions);

    // Stable addCreditTransaction that always reads the latest creditCards via ref
    const stableAddCreditTransaction = useCallback(
        (data: Parameters<typeof cardsSlice.addCreditTransaction>[0]) => {
            const freshSlice = createCardsSlice(userId, creditCardsRef.current, setCreditCards, setCreditTransactions);
            return freshSlice.addCreditTransaction(data);
        },
        [userId] // only userId needed — creditCardsRef is always fresh
    );

    const shoppingSlice = createShoppingSlice(
        userId, shoppingLists, setShoppingLists, setProductCatalog, setLedger,
        (msg, detail) => toast.error(msg, detail),
        stableAddCreditTransaction,
        setCreditTransactions
    );

    const ledgerSlice = createLedgerSlice(userId, setLedger);

    const carSlice = createCarSlice(userId, setFuelRecords, setMaintenanceRecords, setLedger);

    const billsSlice = createBillsSlice(
        userId, creditCards, creditTransactions, allFixedExpenses, recurringBills,
        setFixedExpenses, setRecurringBills, setCreditTransactions, setLedger, generatingRef
    );

    // getCarAlerts is a pure computation from car state—wraps the slice helper
    const getCarAlerts = useCallback(
        () => carSlice.getCarAlerts(fuelRecords, maintenanceRecords),
        [fuelRecords, maintenanceRecords]
    );

    // ── Provider Value ────────────────────────────────────────────────────────
    return (
        <AppContext.Provider value={{
            loading,
            shoppingLists, ledger, fuelRecords, maintenanceRecords, stats, productCatalog,
            ...shoppingSlice,
            ...ledgerSlice,
            ...carSlice,
            getCarAlerts,
            fixedExpenses: allFixedExpenses,
            recurringBills,
            ...billsSlice,
            monthlyGoals, setMonthlyGoal,
            creditCards, creditTransactions,
            ...cardsSlice,
            currentMonth, changeMonth, formatMonthDisplay,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
