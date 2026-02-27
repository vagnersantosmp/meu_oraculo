// Categorias predefinidas para o módulo Caixa (Ledger)
// Cada categoria tem nome, cor (bg + text) e tipo (receita, despesa, ou ambos)

export interface LedgerCategory {
    nome: string;
    cor: string;        // Tailwind classes: bg + text
    corDark: string;    // Dark mode
    tipos: ('income' | 'expense')[];
}

export const LEDGER_CATEGORIES: LedgerCategory[] = [
    // ─── Despesas ───
    { nome: 'Alimentação', cor: 'bg-orange-100 text-orange-700', corDark: 'dark:bg-orange-900/30 dark:text-orange-300', tipos: ['expense'] },
    { nome: 'Mercado', cor: 'bg-teal-100 text-teal-700', corDark: 'dark:bg-teal-900/30 dark:text-teal-300', tipos: ['expense'] },
    { nome: 'Transporte', cor: 'bg-blue-100 text-blue-700', corDark: 'dark:bg-blue-900/30 dark:text-blue-300', tipos: ['expense'] },
    { nome: 'Moradia', cor: 'bg-purple-100 text-purple-700', corDark: 'dark:bg-purple-900/30 dark:text-purple-300', tipos: ['expense'] },
    { nome: 'Saúde', cor: 'bg-red-100 text-red-700', corDark: 'dark:bg-red-900/30 dark:text-red-300', tipos: ['expense'] },
    { nome: 'Educação', cor: 'bg-indigo-100 text-indigo-700', corDark: 'dark:bg-indigo-900/30 dark:text-indigo-300', tipos: ['expense'] },
    { nome: 'Lazer', cor: 'bg-pink-100 text-pink-700', corDark: 'dark:bg-pink-900/30 dark:text-pink-300', tipos: ['expense'] },
    { nome: 'Compras', cor: 'bg-amber-100 text-amber-700', corDark: 'dark:bg-amber-900/30 dark:text-amber-300', tipos: ['expense'] },
    { nome: 'Vestuário', cor: 'bg-fuchsia-100 text-fuchsia-700', corDark: 'dark:bg-fuchsia-900/30 dark:text-fuchsia-300', tipos: ['expense'] },
    { nome: 'Serviços', cor: 'bg-cyan-100 text-cyan-700', corDark: 'dark:bg-cyan-900/30 dark:text-cyan-300', tipos: ['expense'] },
    { nome: 'Impostos', cor: 'bg-slate-100 text-slate-700', corDark: 'dark:bg-slate-900/30 dark:text-slate-300', tipos: ['expense'] },
    { nome: 'Pets', cor: 'bg-lime-100 text-lime-700', corDark: 'dark:bg-lime-900/30 dark:text-lime-300', tipos: ['expense'] },
    { nome: 'Veículo', cor: 'bg-sky-100 text-sky-700', corDark: 'dark:bg-sky-900/30 dark:text-sky-300', tipos: ['expense'] },

    // ─── Receitas ───
    { nome: 'Salário', cor: 'bg-green-100 text-green-700', corDark: 'dark:bg-green-900/30 dark:text-green-300', tipos: ['income'] },
    { nome: 'Freelance', cor: 'bg-teal-100 text-teal-700', corDark: 'dark:bg-teal-900/30 dark:text-teal-300', tipos: ['income'] },
    { nome: 'Investimentos', cor: 'bg-emerald-100 text-emerald-700', corDark: 'dark:bg-emerald-900/30 dark:text-emerald-300', tipos: ['income'] },
    { nome: 'Vendas', cor: 'bg-yellow-100 text-yellow-700', corDark: 'dark:bg-yellow-900/30 dark:text-yellow-300', tipos: ['income'] },
    { nome: 'Presente', cor: 'bg-rose-100 text-rose-700', corDark: 'dark:bg-rose-900/30 dark:text-rose-300', tipos: ['income'] },

    // ─── Ambos ───
    { nome: 'Outros', cor: 'bg-gray-100 text-gray-700', corDark: 'dark:bg-gray-900/30 dark:text-gray-300', tipos: ['income', 'expense'] },
];

export function getCategoriasPorTipo(tipo: 'income' | 'expense' | 'all'): LedgerCategory[] {
    if (tipo === 'all') return LEDGER_CATEGORIES;
    return LEDGER_CATEGORIES.filter(c => c.tipos.includes(tipo));
}

export function getLedgerCategoryColor(nome: string): string {
    const cat = LEDGER_CATEGORIES.find(c => c.nome === nome);
    if (!cat) return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    return `${cat.cor} ${cat.corDark}`;
}

export function getLedgerCategoryNames(tipo: 'income' | 'expense'): string[] {
    return LEDGER_CATEGORIES
        .filter(c => c.tipos.includes(tipo))
        .map(c => c.nome);
}
