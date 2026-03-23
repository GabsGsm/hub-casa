import type { TxFilter } from './types';

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
