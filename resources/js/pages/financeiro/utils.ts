import type { TxFilter } from './types';

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const TX_FILTERS: { key: TxFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pago', label: 'Pago' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'recorrente', label: 'Recorrente' },
    { key: 'parcela', label: 'Parcelado' },
];

export const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MONTH_NAMES_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function noneOrVal(v: string) { return v === '__none__' ? '' : v; }
export function valOrNone(v: string | number | null | undefined) { return v ? String(v) : '__none__'; }