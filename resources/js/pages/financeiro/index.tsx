import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CyclePill } from '@/components/hub/cycle-pill';
import { ProgressBar } from '@/components/hub/progress-bar';
import { StatusPill } from '@/components/hub/status-pill';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Cycle = {
    id: number;
    name: string;
    day_of_month: number | null;
    expected_amount: number;
    paid: number;
    pending: number;
};

type Transaction = {
    id: number;
    title: string;
    amount: number;
    type: string;       // 'gasto' | 'ganho' | 'divida'
    status: string;     // 'aberto' | 'pago' | 'impossibilitado'
    created_at: string; // YYYY-MM-DD
    due_date: string | null;
    recurrence: string | null;   // 'mensal' | null
    installments_count: number | null;
    cycle: { id: number; name: string; day_of_month: number | null } | null;
    category: { id: number; name: string; color: string | null } | null;
    assignees: { id: number; name: string }[];
};

// Transação "resolvida" para um mês específico
type ResolvedTransaction = Transaction & {
    resolvedDate: string;        // due_date projetado para o mês alvo
    installmentNum?: number;     // parcela atual (1-based)
    installmentsTotal?: number;
};

type MonthProjection = {
    year: number;
    month: number;
    label: string;
    phase: 'past' | 'current' | 'future';
    transactions: ResolvedTransaction[];
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
};

type FinanceiroProps = {
    house: { id: number; name: string };
    cycles: Cycle[];
    transactions: Transaction[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
};

type MainTab = 'visao-geral' | 'historico';
type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'divida';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const TX_FILTERS: { key: TxFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'pago', label: 'Pago' },
    { key: 'recorrente', label: 'Recorrente' },
    { key: 'divida', label: 'Dívidas' },
];

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function noneOrVal(v: string) { return v === '__none__' ? '' : v; }
function valOrNone(v: string | number | null | undefined) { return v ? String(v) : '__none__'; }

/** Constrói uma data YYYY-MM-DD para o mês/ano alvo, usando o mesmo dia da data de origem. */
function dateForMonth(origDay: number, year: number, month: number): string {
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
function resolveTransactionsForMonth(
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

// ---------------------------------------------------------------------------
// MonthCard (Histórico)
// ---------------------------------------------------------------------------
function MonthCard({ data, defaultExpanded }: { data: MonthProjection; defaultExpanded: boolean }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const phaseColor =
        data.phase === 'past' ? '#9B9A96' : data.phase === 'current' ? '#2563EB' : '#D97706';
    const phaseLabel =
        data.phase === 'past' ? 'Passado' : data.phase === 'current' ? 'Atual' : 'Projetado';

    const expenses = data.transactions.filter((t) => t.type !== 'ganho');
    const incomes  = data.transactions.filter((t) => t.type === 'ganho');

    return (
        <div
            className={`overflow-hidden rounded-[12px] border bg-white ${
                data.phase === 'current' ? 'border-[#2563EB]' : 'border-[#E4E3E0]'
            }`}
        >
            {/* Header */}
            <div
                className="flex cursor-pointer items-center justify-between px-5 py-4"
                onClick={() => setExpanded((v) => !v)}
            >
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1917]">{data.label}</span>
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: `${phaseColor}22`, color: phaseColor }}
                        >
                            {phaseLabel}
                        </span>
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-[#9B9A96]">
                        {data.transactions.length} lançamento{data.transactions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {data.phase !== 'future' && (
                        <div className="hidden text-right sm:block">
                            <div className="font-mono text-xs text-[#059669]">
                                {currency.format(data.totalPaid)} pago
                            </div>
                            <div className="font-mono text-xs text-[#D97706]">
                                {currency.format(data.totalPending)} pendente
                            </div>
                        </div>
                    )}
                    <div className="text-right">
                        <div className="font-mono text-sm font-semibold" style={{ color: phaseColor }}>
                            {currency.format(data.totalExpected)}
                        </div>
                        <div className="font-mono text-[10px] text-[#9B9A96]">
                            {data.phase === 'future' ? 'projetado' : 'total gastos'}
                        </div>
                    </div>
                    <ChevronDown
                        size={14}
                        className={`shrink-0 text-[#9B9A96] transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Progress bar */}
            {data.phase !== 'future' && data.totalExpected > 0 && (
                <div className="px-5 pb-2">
                    <ProgressBar value={data.totalPaid} max={data.totalExpected} height={4} />
                </div>
            )}

            {/* Body */}
            {expanded && (
                <div className="border-t border-[#F0EFED]">
                    {data.transactions.length === 0 ? (
                        <div className="px-5 py-4 text-sm text-[#9B9A96]">
                            Nenhum lançamento para este mês.
                        </div>
                    ) : (
                        <div>
                            {/* Gastos */}
                            {expenses.map((t) => (
                                <div
                                    key={`${t.id}-${t.installmentNum ?? 0}`}
                                    className="flex items-center gap-3 border-b border-[#F0EFED] px-5 py-2.5 last:border-0"
                                >
                                    <div
                                        className="size-1.5 shrink-0 rounded-full"
                                        style={{
                                            background:
                                                data.phase === 'future'
                                                    ? '#D97706'
                                                    : t.status === 'pago'
                                                      ? '#059669'
                                                      : '#D97706',
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span
                                            className={`text-sm ${
                                                data.phase !== 'future' && t.status === 'pago'
                                                    ? 'text-[#9B9A96]'
                                                    : 'text-[#1A1917]'
                                            }`}
                                        >
                                            {t.title}
                                        </span>
                                        {/* Badges */}
                                        {t.category && (
                                            <span className="ml-1.5 rounded-full bg-[#F0EFED] px-1.5 py-0.5 text-[10px] text-[#6B6A67]">
                                                {t.category.name}
                                            </span>
                                        )}
                                        {t.recurrence && (
                                            <span className="ml-1.5 rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] text-[#2563EB]">
                                                mensal · dia {new Date(t.resolvedDate + 'T00:00').getDate()}
                                            </span>
                                        )}
                                        {t.installmentNum && (
                                            <span className="ml-1.5 rounded-full bg-[#F0EFED] px-1.5 py-0.5 text-[10px] text-[#6B6A67]">
                                                {t.installmentNum}/{t.installmentsTotal}
                                            </span>
                                        )}
                                    </div>
                                    <span className="shrink-0 font-mono text-xs text-[#9B9A96]">
                                        {t.resolvedDate}
                                    </span>
                                    <span className="shrink-0 font-mono text-sm text-[#3D3C3A]">
                                        {currency.format(t.amount)}
                                    </span>
                                    {data.phase !== 'future' && <StatusPill status={t.status} />}
                                    {data.phase === 'future' && (
                                        <span className="shrink-0 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#D97706]">
                                            projetado
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Receitas */}
                            {incomes.length > 0 && (
                                <>
                                    <div className="border-t border-b border-[#F0EFED] bg-[#F0FDF4] px-5 py-1.5">
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#15803D]">
                                            Receitas · {incomes.length}
                                        </span>
                                    </div>
                                    {incomes.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center gap-3 border-b border-[#F0EFED] px-5 py-2.5 last:border-0"
                                        >
                                            <div className="size-1.5 shrink-0 rounded-full bg-[#059669]" />
                                            <span className="min-w-0 flex-1 text-sm text-[#1A1917]">
                                                {t.title}
                                            </span>
                                            {t.recurrence && (
                                                <span className="rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] text-[#2563EB]">
                                                    mensal · dia {new Date(t.resolvedDate + 'T00:00').getDate()}
                                                </span>
                                            )}
                                            <span className="shrink-0 font-mono text-sm text-[#059669]">
                                                +{currency.format(t.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// AssigneeSelect
// ---------------------------------------------------------------------------
function AssigneeSelect({
    members,
    selected,
    onChange,
}: {
    members: { id: number; name: string }[];
    selected: number[];
    onChange: (ids: number[]) => void;
}) {
    function toggle(id: number) {
        if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
        else onChange([...selected, id]);
    }
    return (
        <div className="flex flex-wrap gap-2">
            {members.map((m) => {
                const active = selected.includes(m.id);
                const initials = m.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        title={m.name}
                        className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                            active
                                ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                                : 'border-[#E4E3E0] bg-white text-[#6B6A67] hover:border-[#C8C7C3]'
                        }`}
                    >
                        <span
                            className="flex size-4 items-center justify-center rounded-full text-white"
                            style={{ fontSize: 8, background: active ? '#2563EB' : '#9B9A96' }}
                        >
                            {initials}
                        </span>
                        {m.name.split(' ')[0]}
                        {active && <X size={10} />}
                    </button>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// TxFormFields
// ---------------------------------------------------------------------------
function TxFormFields({
    data,
    setData,
    cycles,
    categories,
    members,
    assigneeIds,
    onAssigneesChange,
}: {
    data: Record<string, string>;
    setData: (key: string, value: string) => void;
    cycles: Cycle[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
    assigneeIds: number[];
    onAssigneesChange: (ids: number[]) => void;
}) {
    const isDivida = data.type === 'divida';

    const dueDayOfMonth = data.due_date
        ? new Date(data.due_date + 'T00:00').getDate()
        : null;

    function handleTypeChange(v: string) {
        setData('type', v);
        if (v === 'divida') setData('recurrence', '');
        else setData('installments_count', '');
    }

    return (
        <>
            <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input
                        type="number"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>
                        Vencimento{isDivida && <span className="ml-0.5 text-[#DC2626]">*</span>}
                    </Label>
                    <Input
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        required={isDivida}
                    />
                    {!isDivida && !data.due_date && (
                        <p className="text-xs text-[#9B9A96]">Sem data → usa a data de criação</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={data.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="ganho">Ganho</SelectItem>
                            <SelectItem value="divida">Dívida / Parcelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isDivida ? (
                <div className="grid gap-2">
                    <Label>
                        Nº de parcelas<span className="ml-0.5 text-[#DC2626]">*</span>
                    </Label>
                    <Input
                        type="number"
                        min={1}
                        value={data.installments_count}
                        onChange={(e) => setData('installments_count', e.target.value)}
                        required
                        placeholder="Ex: 12"
                    />
                    <p className="text-xs text-[#9B9A96]">
                        Parcelas seguintes são projetadas automaticamente no Histórico
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label>Recorrência</Label>
                    <Select
                        value={valOrNone(data.recurrence)}
                        onValueChange={(v) => setData('recurrence', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Não recorrente</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                        </SelectContent>
                    </Select>
                    {data.recurrence === 'mensal' && dueDayOfMonth && (
                        <p className="text-xs text-[#2563EB]">
                            Projetado todo dia {dueDayOfMonth} de cada mês
                        </p>
                    )}
                    {data.recurrence === 'mensal' && !data.due_date && (
                        <p className="text-xs text-[#9B9A96]">
                            Defina o vencimento para fixar o dia da recorrência
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Ciclo</Label>
                    <Select
                        value={valOrNone(data.payment_cycle_id)}
                        onValueChange={(v) => setData('payment_cycle_id', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem ciclo</SelectItem>
                            {cycles.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select
                        value={valOrNone(data.category_id)}
                        onValueChange={(v) => setData('category_id', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem categoria</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {members.length > 0 && (
                <div className="grid gap-2">
                    <Label>Responsáveis</Label>
                    <AssigneeSelect
                        members={members}
                        selected={assigneeIds}
                        onChange={onAssigneesChange}
                    />
                </div>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Financeiro({ cycles, transactions, categories, members }: FinanceiroProps) {
    const [mainTab, setMainTab] = useState<MainTab>('visao-geral');
    const [txFilter, setTxFilter] = useState<TxFilter>('todos');
    const [histStart, setHistStart] = useState(-2);

    // ── Data: mês atual ───────────────────────────────────────────────────────
    const today = new Date();
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    /** Lançamentos resolvidos para o mês atual */
    const currentMonthTx = useMemo(
        () => resolveTransactionsForMonth(transactions, currentYear, currentMonth),
        [transactions],
    );

    // ── Ciclo: criar/editar ───────────────────────────────────────────────────
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
    const cycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });

    // ── Lançamento: criar/editar ──────────────────────────────────────────────
    const [txSheetOpen, setTxSheetOpen] = useState(false);
    const [createAssignees, setCreateAssignees] = useState<number[]>([]);
    const txForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const editTxForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

    // ── Computed: Visão Geral ─────────────────────────────────────────────────

    /** Totais do mês atual */
    const totals = useMemo(
        () =>
            currentMonthTx.reduce(
                (acc, t) => {
                    t.type !== 'ganho' ? (acc.expenses += t.amount) : (acc.income += t.amount);
                    return acc;
                },
                { expenses: 0, income: 0 },
            ),
        [currentMonthTx],
    );

    /** Paid/pending por ciclo — calculados do mês atual */
    const cycleMthTotals = useMemo(() => {
        const map: Record<number, { paid: number; pending: number }> = {};
        currentMonthTx.forEach((t) => {
            if (!t.cycle || t.type === 'ganho') return;
            if (!map[t.cycle.id]) map[t.cycle.id] = { paid: 0, pending: 0 };
            if (t.status === 'pago') map[t.cycle.id].paid += t.amount;
            else map[t.cycle.id].pending += t.amount;
        });
        return map;
    }, [currentMonthTx]);

    /** Lançamentos filtrados do mês atual */
    const filteredTx = useMemo(() => {
        switch (txFilter) {
            case 'pago':
                return currentMonthTx.filter((t) => t.status === 'pago');
            case 'pendente':
                return currentMonthTx.filter((t) => t.status !== 'pago');
            case 'recorrente':
                return currentMonthTx.filter((t) => !!t.recurrence);
            case 'divida':
                return currentMonthTx.filter((t) => t.type === 'divida');
            default:
                return currentMonthTx;
        }
    }, [currentMonthTx, txFilter]);

    // ── Computed: Histórico ───────────────────────────────────────────────────
    const monthProjections = useMemo<MonthProjection[]>(() => {
        return Array.from({ length: 6 }, (_, idx) => {
            const offset = histStart + idx;
            const d = new Date(currentYear, currentMonth + offset, 1);
            const year  = d.getFullYear();
            const month = d.getMonth();
            const phase: 'past' | 'current' | 'future' =
                offset < 0 ? 'past' : offset === 0 ? 'current' : 'future';
            const label = `${MONTH_NAMES[month]} ${year}`;

            const resolved = resolveTransactionsForMonth(transactions, year, month);

            const expenses = resolved.filter((t) => t.type !== 'ganho');
            const totalExpected = expenses.reduce((s, t) => s + t.amount, 0);
            const totalPaid     = expenses.filter((t) => t.status === 'pago').reduce((s, t) => s + t.amount, 0);
            const totalPending  = expenses.filter((t) => t.status !== 'pago').reduce((s, t) => s + t.amount, 0);

            return { year, month, label, phase, transactions: resolved, totalExpected, totalPaid, totalPending };
        });
    }, [transactions, histStart]);

    // ── Handlers: ciclos ──────────────────────────────────────────────────────
    function openEditCycle(cycle: Cycle) {
        setEditingCycle(cycle);
        editCycleForm.setData({
            name:            cycle.name,
            day_of_month:    cycle.day_of_month ? String(cycle.day_of_month) : '',
            expected_amount: String(cycle.expected_amount),
        });
    }
    function submitCycle(e: React.FormEvent) {
        e.preventDefault();
        cycleForm.post('/financeiro/ciclos', {
            preserveScroll: true,
            onSuccess: () => { cycleForm.reset(); setCycleDialogOpen(false); },
        });
    }
    function submitEditCycle(e: React.FormEvent) {
        e.preventDefault();
        if (!editingCycle) return;
        editCycleForm.put(`/financeiro/ciclos/${editingCycle.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingCycle(null),
        });
    }
    function deleteCycle(cycle: Cycle) {
        if (!confirm(`Remover ciclo "${cycle.name}"?`)) return;
        router.delete(`/financeiro/ciclos/${cycle.id}`, { preserveScroll: true });
    }

    // ── Handlers: transações ──────────────────────────────────────────────────
    function openCreateTx() {
        setCreateAssignees([]);
        txForm.reset();
        setTxSheetOpen(true);
    }
    function openEditTx(tx: Transaction) {
        setEditingTx(tx);
        setEditAssignees(tx.assignees.map((a) => a.id));
        editTxForm.setData({
            title:              tx.title,
            amount:             String(tx.amount),
            type:               tx.type,
            status:             tx.status,
            due_date:           tx.due_date ?? '',
            payment_cycle_id:   tx.cycle ? String(tx.cycle.id) : '',
            category_id:        tx.category ? String(tx.category.id) : '',
            recurrence:         tx.recurrence ?? '',
            installments_count: tx.installments_count ? String(tx.installments_count) : '',
        });
    }
    function submitCreateTx(e: React.FormEvent) {
        e.preventDefault();
        router.post(
            '/financeiro/lancamentos',
            { ...txForm.data, assignee_ids: createAssignees },
            { preserveScroll: true, onSuccess: () => { txForm.reset(); setTxSheetOpen(false); } },
        );
    }
    function submitEditTx(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTx) return;
        router.put(
            `/financeiro/lancamentos/${editingTx.id}`,
            { ...editTxForm.data, assignee_ids: editAssignees },
            { preserveScroll: true, onSuccess: () => setEditingTx(null) },
        );
    }
    function deleteTransaction(tx: Transaction) {
        if (!confirm(`Remover lançamento "${tx.title}"?`)) return;
        router.delete(`/financeiro/lancamentos/${tx.id}`, { preserveScroll: true });
    }
    function markAsPaid(id: number) {
        router.put(`/financeiro/lancamentos/${id}`, { status: 'pago' }, { preserveScroll: true });
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const monthLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Financeiro', href: '/financeiro' },
            ]}
        >
            <Head title="Financeiro" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-[28px] font-semibold leading-tight text-[#1A1917]">
                            Financeiro
                        </div>
                        <div className="text-sm text-[#9B9A96]">
                            Ciclos de pagamento e lançamentos.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => setCycleDialogOpen(true)} className="gap-2">
                            <Plus className="size-4" /> Novo ciclo
                        </Button>
                        <Button onClick={openCreateTx} className="gap-2">
                            <Plus className="size-4" /> Novo lançamento
                        </Button>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex w-fit items-center gap-1 rounded-[10px] border border-[#E4E3E0] bg-[#F8F8F7] p-1">
                    {(['visao-geral', 'historico'] as MainTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setMainTab(tab)}
                            className={`rounded-[7px] px-4 py-1.5 text-sm font-medium transition-colors ${
                                mainTab === tab
                                    ? 'bg-white text-[#1A1917] shadow-sm'
                                    : 'text-[#6B6A67] hover:text-[#1A1917]'
                            }`}
                        >
                            {tab === 'visao-geral' ? 'Visão Geral' : 'Histórico'}
                        </button>
                    ))}
                </div>

                {/* ════════ TAB: VISÃO GERAL ════════ */}
                {mainTab === 'visao-geral' && (
                    <>
                        {/* Mês atual label + filter chips */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="font-mono text-xs text-[#9B9A96]">
                                Exibindo lançamentos de <strong className="text-[#1A1917]">{monthLabel}</strong>
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {TX_FILTERS.map(({ key, label }) => {
                                    const count =
                                        key === 'todos'      ? currentMonthTx.length
                                        : key === 'pago'     ? currentMonthTx.filter((t) => t.status === 'pago').length
                                        : key === 'pendente' ? currentMonthTx.filter((t) => t.status !== 'pago').length
                                        : key === 'recorrente' ? currentMonthTx.filter((t) => !!t.recurrence).length
                                        : currentMonthTx.filter((t) => t.type === 'divida').length;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTxFilter(key)}
                                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                                txFilter === key
                                                    ? 'bg-[#1A1917] text-white'
                                                    : 'bg-[#F0EFED] text-[#6B6A67] hover:bg-[#E4E3E0]'
                                            }`}
                                        >
                                            {label}
                                            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${txFilter === key ? 'bg-white/20' : 'bg-white text-[#9B9A96]'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Transactions table */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-[#E4E3E0] text-xs uppercase text-[#9B9A96]">
                                        <tr>
                                            <th className="px-4 py-3">Descrição</th>
                                            <th className="px-4 py-3">Valor</th>
                                            <th className="px-4 py-3">Vencimento</th>
                                            <th className="px-4 py-3">Ciclo</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="w-10 px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTx.map((item) => (
                                            <tr
                                                key={`${item.id}-${item.installmentNum ?? 0}`}
                                                className="group border-b border-[#F0EFED] last:border-b-0 hover:bg-[#F8F8F7]"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="size-2 shrink-0 rounded-full"
                                                            style={{ background: item.type === 'ganho' ? '#059669' : '#2563EB' }}
                                                        />
                                                        <div>
                                                            <div className="text-[#1A1917]">{item.title}</div>
                                                            <div className="flex flex-wrap items-center gap-1 text-xs text-[#9B9A96]">
                                                                {item.category?.name ?? 'Sem categoria'}
                                                                {item.recurrence && (
                                                                    <span className="rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[#2563EB]">
                                                                        mensal
                                                                    </span>
                                                                )}
                                                                {item.installmentNum && (
                                                                    <span className="rounded-full bg-[#F0EFED] px-1.5 py-0.5 text-[#6B6A67]">
                                                                        {item.installmentNum}/{item.installmentsTotal}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-mono ${item.type === 'ganho' ? 'text-[#059669]' : 'text-[#3D3C3A]'}`}>
                                                        {item.type === 'ganho' ? '+' : ''}{currency.format(item.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[#6B6A67]">
                                                    {item.resolvedDate}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <CyclePill label={item.cycle?.name ?? 'Sem ciclo'} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusPill status={item.status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="flex size-7 items-center justify-center rounded-[6px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#F0EFED]">
                                                                <MoreHorizontal size={14} className="text-[#6B6A67]" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {item.status !== 'pago' && (
                                                                <DropdownMenuItem onClick={() => markAsPaid(item.id)}>
                                                                    Marcar como pago
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => openEditTx(item)}>
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => deleteTransaction(item)}
                                                                className="text-[#DC2626] focus:text-[#DC2626]"
                                                            >
                                                                Remover
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredTx.length === 0 && (
                                <div className="p-6 text-sm text-[#9B9A96]">
                                    Nenhum lançamento em {monthLabel}.
                                </div>
                            )}
                        </div>

                        {/* Cycle cards */}
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {cycles.map((cycle) => {
                                const mth = cycleMthTotals[cycle.id] ?? { paid: 0, pending: 0 };
                                const isOverbudget = mth.paid + mth.pending > cycle.expected_amount;
                                return (
                                    <div
                                        key={cycle.id}
                                        className="group relative overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white p-5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`size-2 rounded-full ${isOverbudget ? 'bg-[#DC2626]' : mth.pending > 0 ? 'bg-[#D97706]' : 'bg-[#059669]'}`} />
                                                    <span className="text-sm font-medium text-[#1A1917]">{cycle.name}</span>
                                                </div>
                                                <div className="mt-0.5 font-mono text-xs text-[#9B9A96]">
                                                    {cycle.day_of_month ? `Dia ${cycle.day_of_month}` : 'Sem data fixa'}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="flex size-7 items-center justify-center rounded-[6px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#F0EFED]">
                                                        <MoreHorizontal size={14} className="text-[#6B6A67]" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditCycle(cycle)}>
                                                        Editar ciclo
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => deleteCycle(cycle)}
                                                        className="text-[#DC2626] focus:text-[#DC2626]"
                                                    >
                                                        Remover ciclo
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-3 font-mono text-[32px] font-semibold leading-none text-[#2563EB]">
                                            {currency.format(cycle.expected_amount || 0)}
                                        </div>
                                        <div className="mt-4">
                                            <ProgressBar
                                                value={mth.paid + mth.pending}
                                                max={cycle.expected_amount || 1}
                                                height={6}
                                                color={isOverbudget ? '#DC2626' : '#2563EB'}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <span className="font-mono text-[#059669]">Pago: {currency.format(mth.paid)}</span>
                                            <span className="font-mono text-[#D97706]">Pendente: {currency.format(mth.pending)}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Card totais do mês */}
                            <div className="rounded-[12px] border border-[#E4E3E0] bg-[#F8F8F7] p-5">
                                <div className="text-xs uppercase tracking-wide text-[#9B9A96]">
                                    Total · {monthLabel}
                                </div>
                                <div className="mt-2 font-mono text-2xl font-semibold text-[#1A1917]">
                                    {currency.format(totals.expenses)}
                                </div>
                                <div className="mt-1 font-mono text-xs text-[#059669]">
                                    Receitas: {currency.format(totals.income)}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ════════ TAB: HISTÓRICO ════════ */}
                {mainTab === 'historico' && (
                    <>
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setHistStart((s) => s - 3)}
                                className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                            >
                                <ChevronLeft size={14} />
                                3 meses antes
                            </button>
                            <span className="font-mono text-xs text-[#9B9A96]">
                                {monthProjections[0]?.label} — {monthProjections[5]?.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => setHistStart((s) => s + 3)}
                                className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                            >
                                Próximos 3
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {monthProjections.map((mp) => (
                                <MonthCard
                                    key={`${mp.year}-${mp.month}`}
                                    data={mp}
                                    defaultExpanded={mp.phase !== 'past'}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Dialog: Novo Ciclo ───────────────────────────────────────────── */}
            <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Novo ciclo</DialogTitle></DialogHeader>
                    <form onSubmit={submitCycle} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                value={cycleForm.data.name}
                                onChange={(e) => cycleForm.setData('name', e.target.value)}
                                placeholder="Ex: Dia 10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Dia do mês</Label>
                            <Input
                                type="number" min={1} max={31}
                                value={cycleForm.data.day_of_month}
                                onChange={(e) => cycleForm.setData('day_of_month', e.target.value)}
                                placeholder="Deixe vazio para sem data"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Valor esperado (R$)</Label>
                            <Input
                                type="number"
                                value={cycleForm.data.expected_amount}
                                onChange={(e) => cycleForm.setData('expected_amount', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={cycleForm.processing}>Salvar ciclo</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Editar Ciclo ─────────────────────────────────────────── */}
            <Dialog open={!!editingCycle} onOpenChange={(open) => !open && setEditingCycle(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Editar ciclo</DialogTitle></DialogHeader>
                    <form onSubmit={submitEditCycle} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input value={editCycleForm.data.name} onChange={(e) => editCycleForm.setData('name', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Dia do mês</Label>
                            <Input
                                type="number" min={1} max={31}
                                value={editCycleForm.data.day_of_month}
                                onChange={(e) => editCycleForm.setData('day_of_month', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Valor esperado (R$)</Label>
                            <Input
                                type="number"
                                value={editCycleForm.data.expected_amount}
                                onChange={(e) => editCycleForm.setData('expected_amount', e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={editCycleForm.processing}>Salvar alterações</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Sheet: Novo Lançamento ───────────────────────────────────────── */}
            <Sheet open={txSheetOpen} onOpenChange={setTxSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader><SheetTitle>Novo lançamento</SheetTitle></SheetHeader>
                    <form onSubmit={submitCreateTx} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <TxFormFields
                            data={txForm.data as unknown as Record<string, string>}
                            setData={(k, v) => txForm.setData(k as any, v)}
                            cycles={cycles}
                            categories={categories}
                            members={members}
                            assigneeIds={createAssignees}
                            onAssigneesChange={setCreateAssignees}
                        />
                        <SheetFooter>
                            <Button type="submit" disabled={txForm.processing}>Salvar lançamento</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ── Sheet: Editar Lançamento ─────────────────────────────────────── */}
            <Sheet open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader><SheetTitle>Editar lançamento</SheetTitle></SheetHeader>
                    <form onSubmit={submitEditTx} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <TxFormFields
                            data={editTxForm.data as unknown as Record<string, string>}
                            setData={(k, v) => editTxForm.setData(k as any, v)}
                            cycles={cycles}
                            categories={categories}
                            members={members}
                            assigneeIds={editAssignees}
                            onAssigneesChange={setEditAssignees}
                        />
                        {editingTx && (
                            <div className="mt-2 border-t border-[#F0EFED] pt-4">
                                <button
                                    type="button"
                                    onClick={() => { deleteTransaction(editingTx); setEditingTx(null); }}
                                    className="flex items-center gap-1.5 text-sm text-[#DC2626] hover:underline"
                                >
                                    <Trash2 size={13} />
                                    Remover lançamento
                                </button>
                            </div>
                        )}
                        <SheetFooter>
                            <Button type="submit" disabled={editTxForm.processing}>Salvar alterações</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
