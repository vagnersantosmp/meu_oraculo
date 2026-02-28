export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'transferencia';

export type TransactionType = 'income' | 'expense';

export type TransactionSource = 'manual' | 'system';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface ShoppingItem {
    id: string;
    list_id: string;
    nome_item: string;
    categoria: string;
    quantidade: number;
    unidade_medida: string;
    valor_unitario: number;
    valor_total_item: number;
    marcado_como_pegado: boolean;
    observacoes: string | null;
}

export interface ShoppingList {
    id: string;
    user_id: string;
    nome_lista: string;
    status: 'aberta' | 'finalizada';
    data_criacao: string;
    data_compra: string | null;
    valor_total_lista: number;
    payment_method?: PaymentMethod;
    items: ShoppingItem[];
}

export interface CarFuel {
    id: string;
    user_id: string;
    date: string;
    km: number;
    value: number;
    payment_method: PaymentMethod;
    note?: string;
    created_at: string;
}

export interface CarMaintenance {
    id: string;
    user_id: string;
    date: string;
    type: string; // "óleo", "pneus", "revisão" etc
    km_done: number;
    km_next: number;
    value: number;
    payment_method: PaymentMethod;
    note?: string;
    created_at: string;
}

export interface LedgerTransaction {
    id: string;
    user_id: string;
    date: string;
    type: TransactionType;
    category: string;
    description: string;
    value: number;
    payment_method: PaymentMethod;
    source: TransactionSource;
    source_ref?: string; // ID of shopping list, maintenance, fuel
    created_at: string;
}

// Derived state for Dashboard
export interface DashboardStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

export interface FixedExpense {
    id: string;
    user_id: string;
    description: string;
    category: string;
    value: number;              // Valor REAL (preenchido pelo usuário)
    estimated_value?: number;   // Estimativa (copiada do modelo recorrente)
    due_date: string;           // full date yyyy-mm-dd
    paid: boolean;
    payment_date: string | null;
    recurring_bill_id?: string; // FK para recurring_bills (opcional)
    created_at: string;
}

export interface RecurringBill {
    id: string;
    user_id: string;
    description: string;
    category: string;
    estimated_value: number;    // Estimativa mensal
    is_variable: boolean;       // true = varia (água/luz); false = fixa (internet/aluguel)
    due_day: number;            // Dia de vencimento (1-31)
    active: boolean;
    created_at: string;
}

export interface CreditCard {
    id: string;
    user_id: string;
    name: string;
    color_theme: string;
    limit_amount: number;
    closing_day: number;
    due_day: number;
    created_at: string;
}

export interface CreditTransaction {
    id: string;
    user_id: string;
    card_id: string;
    date: string;
    category: string;
    description: string;
    value: number;
    installments: number;
    installment_number: number;
    parent_transaction_id?: string;
    status: 'open_invoice' | 'closed_invoice' | 'paid';
    payment_date?: string | null;
    source_ref?: string | null;  // e.g. shopping list id
    created_at: string;
}
