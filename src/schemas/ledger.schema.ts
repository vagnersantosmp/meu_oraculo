/**
 * Ledger Transaction Schema — validates form data before sending to Supabase.
 * Used in: Ledger.tsx (add/edit transaction form)
 * Compatible with Zod v4.
 */
import { z } from 'zod';

export const ledgerTransactionSchema = z.object({
    type: z.enum(['income', 'expense'], {
        error: 'Selecione o tipo: Receita ou Despesa',
    }),

    category: z.string()
        .min(1, 'Selecione uma categoria')
        .max(60, 'Categoria muito longa'),

    description: z.string()
        .min(2, 'Descrição deve ter pelo menos 2 caracteres')
        .max(120, 'Descrição muito longa (máximo 120 caracteres)')
        .trim(),

    value: z.number('Informe um valor válido')
        .positive('O valor deve ser maior que zero')
        .max(1_000_000, 'Valor muito alto (máximo R$ 1.000.000)'),

    payment_method: z.enum(
        ['dinheiro', 'pix', 'debito', 'credito', 'transferencia'],
        { error: 'Selecione a forma de pagamento' }
    ),

    date: z.string()
        .min(1, 'Selecione a data')
        .regex(/^\d{4}-\d{2}-\d{2}/, 'Data inválida (use YYYY-MM-DD)'),
});

export type LedgerTransactionFormData = z.infer<typeof ledgerTransactionSchema>;

function buildErrors(zodError: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    zodError.issues.forEach((e: z.ZodIssue) => {
        if (e.path[0] !== undefined) errors[e.path[0].toString()] = e.message;
    });
    return errors;
}

export function safeParseLedgerTransaction(data: unknown) {
    const result = ledgerTransactionSchema.safeParse(data);
    if (result.success) return { success: true as const, data: result.data, errors: {} as Record<string, string> };
    return { success: false as const, data: null, errors: buildErrors(result.error) };
}
