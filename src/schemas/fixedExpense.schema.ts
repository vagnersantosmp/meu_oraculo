/**
 * Fixed Expense & Recurring Bill Schemas.
 * Used in: FixedExpenses.tsx (add/edit bill form)
 * Compatible with Zod v4.
 */
import { z } from 'zod';

export const fixedExpenseSchema = z.object({
    description: z.string()
        .min(2, 'Descrição deve ter pelo menos 2 caracteres')
        .max(100, 'Descrição muito longa (máximo 100 caracteres)')
        .trim(),

    category: z.string()
        .min(1, 'Selecione uma categoria'),

    value: z.number('Informe um valor válido')
        .positive('O valor deve ser maior que zero')
        .max(100_000, 'Valor muito alto (máximo R$ 100.000)'),

    due_date: z.string()
        .min(1, 'Informe a data de vencimento')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),

    paid: z.boolean().optional().default(false),

    payment_date: z.string().nullable().optional(),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

export const recurringBillSchema = z.object({
    description: z.string()
        .min(2, 'Descrição deve ter pelo menos 2 caracteres')
        .max(100, 'Descrição muito longa')
        .trim(),

    category: z.string()
        .min(1, 'Selecione uma categoria'),

    estimated_value: z.number('Informe o valor estimado')
        .positive('O valor deve ser maior que zero')
        .max(100_000, 'Valor muito alto'),

    due_day: z.number('Informe o dia de vencimento')
        .int('O dia deve ser um número inteiro')
        .min(1, 'Dia mínimo: 1')
        .max(31, 'Dia máximo: 31'),

    is_variable: z.boolean().default(false),
    active: z.boolean().default(true),
});

export type RecurringBillFormData = z.infer<typeof recurringBillSchema>;

function buildErrors(zodError: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    zodError.issues.forEach((e: z.ZodIssue) => {
        if (e.path[0] !== undefined) errors[e.path[0].toString()] = e.message;
    });
    return errors;
}

export function safeParseFixedExpense(data: unknown) {
    const result = fixedExpenseSchema.safeParse(data);
    if (result.success) return { success: true as const, data: result.data, errors: {} as Record<string, string> };
    return { success: false as const, data: null, errors: buildErrors(result.error) };
}

export function safeParseRecurringBill(data: unknown) {
    const result = recurringBillSchema.safeParse(data);
    if (result.success) return { success: true as const, data: result.data, errors: {} as Record<string, string> };
    return { success: false as const, data: null, errors: buildErrors(result.error) };
}
