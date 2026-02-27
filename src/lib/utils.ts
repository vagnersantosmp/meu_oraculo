import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        signDisplay: 'never',
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : formatted;
}

export function generateId(): string {
    return uuidv4();
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export type DueStatus = 'paid' | 'overdue' | 'today' | 'upcoming';

/**
 * Returns the due status of a bill based on its due date and paid flag.
 * Single source of truth for bill status logic — used in FixedExpenses, Dashboard alerts etc.
 *
 * @param dueDate - ISO date string (YYYY-MM-DD)
 * @param paid    - whether the bill has been paid
 * @returns 'paid' | 'overdue' | 'today' | 'upcoming'
 */
export function getDueStatus(dueDate: string, paid: boolean): DueStatus {
    if (paid) return 'paid';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate + 'T12:00:00');
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) return 'today';
    if (due < today) return 'overdue';
    return 'upcoming';
}

