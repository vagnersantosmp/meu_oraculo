/**
 * Credit Card & Credit Transaction Schemas.
 * Used in: Cards.tsx, AddCardModal.tsx, EditCreditTransactionModal.tsx
 * Compatible with Zod v4.
 */
import { z } from 'zod';

export const creditCardSchema = z.object({
    name: z.string()
        .min(2, 'Nome do cartão deve ter pelo menos 2 caracteres')
        .max(50, 'Nome muito longo (máximo 50 caracteres)')
        .trim(),

    color_theme: z.string()
        .min(1, 'Selecione uma cor para o cartão'),

    limit_amount: z.number('Informe o limite do cartão')
        .positive('O limite deve ser maior que zero')
        .max(500_000, 'Limite muito alto (máximo R$ 500.000)'),

    closing_day: z.number('Informe o dia de fechamento')
        .int('O dia deve ser um número inteiro')
        .min(1, 'Dia mínimo: 1')
        .max(31, 'Dia máximo: 31'),

    due_day: z.number('Informe o dia de vencimento')
        .int('O dia deve ser um número inteiro')
        .min(1, 'Dia mínimo: 1')
        .max(31, 'Dia máximo: 31'),
}).refine(
    (data) => data.due_day !== data.closing_day,
    { message: 'O dia de vencimento não pode ser igual ao dia de fechamento', path: ['due_day'] }
);

export type CreditCardFormData = z.infer<typeof creditCardSchema>;

export const creditTransactionSchema = z.object({
    card_id: z.string()
        .min(1, 'Selecione o cartão'),

    category: z.string()
        .min(1, 'Selecione uma categoria'),

    description: z.string()
        .min(2, 'Descrição deve ter pelo menos 2 caracteres')
        .max(120, 'Descrição muito longa (máximo 120 caracteres)')
        .trim(),

    value: z.number('Informe o valor')
        .positive('O valor deve ser maior que zero')
        .max(100_000, 'Valor muito alto (máximo R$ 100.000)'),

    date: z.string()
        .min(1, 'Selecione a data da compra')
        .regex(/^\d{4}-\d{2}-\d{2}/, 'Data inválida (use YYYY-MM-DD)'),

    installments: z.number()
        .int('Número de parcelas deve ser inteiro')
        .min(1, 'Mínimo: 1 parcela')
        .max(48, 'Máximo: 48 parcelas')
        .default(1),

    status: z.enum(['open_invoice', 'closed_invoice', 'paid']).default('open_invoice'),
});

export type CreditTransactionFormData = z.infer<typeof creditTransactionSchema>;

function buildErrors(zodError: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    zodError.issues.forEach((e: z.ZodIssue) => {
        if (e.path[0] !== undefined) errors[e.path[0].toString()] = e.message;
    });
    return errors;
}

export function safeParseCreditCard(data: unknown) {
    const result = creditCardSchema.safeParse(data);
    if (result.success) return { success: true as const, data: result.data, errors: {} as Record<string, string> };
    return { success: false as const, data: null, errors: buildErrors(result.error) };
}

export function safeParseCreditTransaction(data: unknown) {
    const result = creditTransactionSchema.safeParse(data);
    if (result.success) return { success: true as const, data: result.data, errors: {} as Record<string, string> };
    return { success: false as const, data: null, errors: buildErrors(result.error) };
}
