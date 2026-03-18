import type { Transaction, ResolvedTransaction, TxFilter } from './types';

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const TX_FILTERS: { key: TxFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pago', label: 'Pago' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'recorrente', label: 'Recorrente' },
    { key: 'divida', label: 'Parcelado' },
];

export const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MONTH_NAMES_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function noneOrVal(v: string) { return v === '__none__' ? '' : v; }
export function valOrNone(v: string | number | null | undefined) { return v ? String(v) : '__none__'; }

/** Constrói uma data YYYY-MM-DD para o mês/ano alvo, usando o mesmo dia da data de origem. */
export function dateForMonth(origDay: number, year: number, month: number): string {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(origDay, daysInMonth);
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Resolve quais transações aparecem em um dado mês.
 *
 * Regras:
 * - Gasto/Ganho simples: aparece apenas no mês de (due_date ?? created_at)
 * - Gasto/Ganho mensal: aparece em todo mês, com due_date projetado ao mesmo dia
 * - Dívida parcelada: aparece nos meses [0, installments_count) a partir do due_date
 */
export function resolveTransactionsForMonth(
    transactions: Transaction[],
    year: number,
    month: number, // 0-indexed
): ResolvedTransaction[] {
    const result: ResolvedTransaction[] = [];

    for (const t of transactions) {
        // Data de origem: due_date ou created_at como fallback
        const effectiveDateStr = t.due_date ?? t.created_at;
        const origDate = new Date(effectiveDateStr + 'T00:00');
        const oy = origDate.getFullYear();
        const om = origDate.getMonth();
        const origDay = origDate.getDate();

        if (t.recurrence === 'mensal') {
            // Aparece em todo mês — projeta a data para o mês alvo
            result.push({
                ...t,
                resolvedDate: dateForMonth(origDay, year, month),
            });
        } else if (t.type === 'divida' && t.installments_count) {
            // Parcela N cai neste mês?
            const installNum = (year - oy) * 12 + (month - om); // 0-based
            if (installNum >= 0 && installNum < t.installments_count) {
                result.push({
                    ...t,
                    resolvedDate: dateForMonth(origDay, year, month),
                    installmentNum: installNum + 1,
                    installmentsTotal: t.installments_count,
                });
            }
        } else {
            // Gasto/Ganho simples: só aparece no mês da data efetiva
            if (oy === year && om === month) {
                result.push({ ...t, resolvedDate: effectiveDateStr });
            }
        }
    }

    return result;
}
