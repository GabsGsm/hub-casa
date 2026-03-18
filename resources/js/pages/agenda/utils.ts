export const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export function formatDateBR(dateStr: string) {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}

export function formatMonthYear(year: number, month: number) {
    return `${MONTH_NAMES[month]} ${year}`;
}

export function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
}
