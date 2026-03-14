import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
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
    type: string;
    status: string;
    due_date: string | null;
    recurrence: string | null;
    installments_count: number | null;
    cycle: { id: number; name: string; day_of_month: number | null } | null;
    category: { id: number; name: string; color: string | null } | null;
    assignees: { id: number; name: string }[];
};

type FinanceiroProps = {
    house: { id: number; name: string };
    cycles: Cycle[];
    transactions: Transaction[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'parcelado';
const TX_FILTERS: { key: TxFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'pago', label: 'Pago' },
    { key: 'recorrente', label: 'Recorrente' },
    { key: 'parcelado', label: 'Parcelado' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function noneOrVal(v: string) { return v === '__none__' ? '' : v; }
function valOrNone(v: string | number | null | undefined) { return v ? String(v) : '__none__'; }

// ── Assignee Multi-select ──────────────────────────────────────────────────────
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
                const initials = m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
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
// Transaction form fields (shared between create/edit sheet)
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
    return (
        <>
            <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>Vencimento</Label>
                    <Input type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="ganho">Ganho</SelectItem>
                            <SelectItem value="divida">Dívida</SelectItem>
                            <SelectItem value="emprestimo">Empréstimo</SelectItem>
                            <SelectItem value="afiado">Afiado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Ciclo</Label>
                    <Select value={valOrNone(data.payment_cycle_id)} onValueChange={(v) => setData('payment_cycle_id', noneOrVal(v))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem ciclo</SelectItem>
                            {cycles.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select value={valOrNone(data.category_id)} onValueChange={(v) => setData('category_id', noneOrVal(v))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem categoria</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Recorrência</Label>
                    <Select value={valOrNone(data.recurrence)} onValueChange={(v) => setData('recurrence', noneOrVal(v))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem recorrência</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                            <SelectItem value="fixa">Fixa</SelectItem>
                            <SelectItem value="diaria">Diária</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Nº de parcelas</Label>
                    <Input type="number" min={1} value={data.installments_count} onChange={(e) => setData('installments_count', e.target.value)} placeholder="Ex: 12" />
                </div>
            </div>
            {members.length > 0 && (
                <div className="grid gap-2">
                    <Label>Responsáveis</Label>
                    <AssigneeSelect members={members} selected={assigneeIds} onChange={onAssigneesChange} />
                </div>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Financeiro({ cycles, transactions, categories, members }: FinanceiroProps) {
    const [txFilter, setTxFilter] = useState<TxFilter>('todos');

    // ── Ciclo: criar ──────────────────────────────────────────────────────────
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
    const cycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });

    // ── Lançamento: criar ─────────────────────────────────────────────────────
    const [txSheetOpen, setTxSheetOpen] = useState(false);
    const [createAssignees, setCreateAssignees] = useState<number[]>([]);
    const txForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

    // ── Lançamento: editar ────────────────────────────────────────────────────
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const editTxForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

    // ── Totais ────────────────────────────────────────────────────────────────
    const totals = useMemo(
        () => transactions.reduce(
            (acc, item) => {
                item.type !== 'ganho' ? (acc.expenses += item.amount) : (acc.income += item.amount);
                return acc;
            },
            { expenses: 0, income: 0 },
        ),
        [transactions],
    );

    // "Sem data" totais
    const semDataTotals = useMemo(() => {
        const noDate = transactions.filter((t) => !t.due_date);
        return {
            paid: noDate.filter((t) => t.status === 'pago' && t.type !== 'ganho').reduce((s, t) => s + t.amount, 0),
            pending: noDate.filter((t) => t.status !== 'pago' && t.type !== 'ganho').reduce((s, t) => s + t.amount, 0),
        };
    }, [transactions]);

    // ── Filtered transactions ─────────────────────────────────────────────────
    const filteredTx = useMemo(() => {
        switch (txFilter) {
            case 'pago': return transactions.filter((t) => t.status === 'pago');
            case 'pendente': return transactions.filter((t) => t.status !== 'pago');
            case 'recorrente': return transactions.filter((t) => !!t.recurrence);
            case 'parcelado': return transactions.filter((t) => !!t.installments_count);
            default: return transactions;
        }
    }, [transactions, txFilter]);

    // ── Handlers: ciclos ──────────────────────────────────────────────────────
    function openEditCycle(cycle: Cycle) {
        setEditingCycle(cycle);
        editCycleForm.setData({
            name: cycle.name,
            day_of_month: cycle.day_of_month ? String(cycle.day_of_month) : '',
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
            title: tx.title,
            amount: String(tx.amount),
            type: tx.type,
            status: tx.status,
            due_date: tx.due_date ?? '',
            payment_cycle_id: tx.cycle ? String(tx.cycle.id) : '',
            category_id: tx.category ? String(tx.category.id) : '',
            recurrence: tx.recurrence ?? '',
            installments_count: tx.installments_count ? String(tx.installments_count) : '',
        });
    }
    function submitCreateTx(e: React.FormEvent) {
        e.preventDefault();
        router.post('/financeiro/lancamentos',
            { ...txForm.data, assignee_ids: createAssignees },
            { preserveScroll: true, onSuccess: () => { txForm.reset(); setTxSheetOpen(false); } },
        );
    }
    function submitEditTx(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTx) return;
        router.put(`/financeiro/lancamentos/${editingTx.id}`,
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
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Financeiro', href: '/financeiro' },
        ]}>
            <Head title="Financeiro" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-[28px] font-semibold leading-tight text-[#1A1917]">Financeiro</div>
                        <div className="text-sm text-[#9B9A96]">Ciclos de pagamento e lançamentos.</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => setCycleDialogOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Novo ciclo
                        </Button>
                        <Button onClick={openCreateTx} className="gap-2">
                            <Plus className="size-4" />
                            Novo lançamento
                        </Button>
                    </div>
                </div>

                {/* ── Cycles summary ──────────────────────────────────────── */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {cycles.map((cycle) => {
                        const isOverbudget = cycle.paid + cycle.pending > cycle.expected_amount;
                        return (
                            <div key={cycle.id} className="group relative overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {/* Status dot */}
                                            <div className={`size-2 rounded-full ${isOverbudget ? 'bg-[#DC2626]' : cycle.pending > 0 ? 'bg-[#D97706]' : 'bg-[#059669]'}`} />
                                            <span className="text-sm font-medium text-[#1A1917]">{cycle.name}</span>
                                        </div>
                                        <div className="mt-0.5 font-mono text-xs text-[#9B9A96]">
                                            {cycle.day_of_month ? `Dia ${cycle.day_of_month}` : 'Sem data fixa'}
                                        </div>
                                    </div>
                                    {/* "..." menu */}
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
                                    <ProgressBar value={cycle.paid + cycle.pending} max={cycle.expected_amount || 1} height={6} color={isOverbudget ? '#DC2626' : '#2563EB'} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <span className="font-mono text-[#059669]">Pago: {currency.format(cycle.paid)}</span>
                                    <span className="font-mono text-[#D97706]">Pendente: {currency.format(cycle.pending)}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Card "Sem data" */}
                    <div className="rounded-[12px] border border-dashed border-[#E4E3E0] bg-white p-5">
                        <div className="flex items-center gap-2">
                            <CyclePill label="Sem data" />
                        </div>
                        <div className="mt-3 font-mono text-[32px] font-semibold leading-none text-[#9B9A96]">
                            {currency.format(semDataTotals.paid + semDataTotals.pending)}
                        </div>
                        <div className="mt-4">
                            <ProgressBar value={0} max={1} height={6} color="#9B9A96" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="font-mono text-[#059669]">Pago: {currency.format(semDataTotals.paid)}</span>
                            <span className="font-mono text-[#D97706]">Pendente: {currency.format(semDataTotals.pending)}</span>
                        </div>
                    </div>

                    {/* Card totais */}
                    <div className="rounded-[12px] border border-[#E4E3E0] bg-[#F8F8F7] p-5">
                        <div className="text-xs uppercase tracking-wide text-[#9B9A96]">Total do mês</div>
                        <div className="mt-2 font-mono text-2xl font-semibold text-[#1A1917]">
                            {currency.format(totals.expenses)}
                        </div>
                        <div className="mt-1 font-mono text-xs text-[#9B9A96]">
                            Receitas: {currency.format(totals.income)}
                        </div>
                    </div>
                </div>

                {/* ── Filter chips ────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2">
                    {TX_FILTERS.map(({ key, label }) => {
                        const count =
                            key === 'todos' ? transactions.length
                            : key === 'pago' ? transactions.filter((t) => t.status === 'pago').length
                            : key === 'pendente' ? transactions.filter((t) => t.status !== 'pago').length
                            : key === 'recorrente' ? transactions.filter((t) => !!t.recurrence).length
                            : transactions.filter((t) => !!t.installments_count).length;
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

                {/* ── Transactions table ──────────────────────────────────── */}
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
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTx.map((item) => (
                                    <tr
                                        key={item.id}
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
                                                    <div className="text-xs text-[#9B9A96]">
                                                        {item.category?.name ?? 'Sem categoria'}
                                                        {item.recurrence && (
                                                            <span className="ml-1.5 rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[#2563EB]">
                                                                {item.recurrence}
                                                            </span>
                                                        )}
                                                        {item.installments_count && (
                                                            <span className="ml-1.5 rounded-full bg-[#F0EFED] px-1.5 py-0.5 text-[#6B6A67]">
                                                                {item.installments_count}x
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
                                            {item.due_date ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <CyclePill label={item.cycle?.name ?? 'Sem data'} />
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
                            Nenhum lançamento.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Dialog: Novo Ciclo ───────────────────────────────────────── */}
            <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Novo ciclo</DialogTitle></DialogHeader>
                    <form onSubmit={submitCycle} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input value={cycleForm.data.name} onChange={(e) => cycleForm.setData('name', e.target.value)} placeholder="Ex: Dia 10" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Dia do mês</Label>
                            <Input type="number" min={1} max={31} value={cycleForm.data.day_of_month} onChange={(e) => cycleForm.setData('day_of_month', e.target.value)} placeholder="Deixe vazio para sem data" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Valor esperado (R$)</Label>
                            <Input type="number" value={cycleForm.data.expected_amount} onChange={(e) => cycleForm.setData('expected_amount', e.target.value)} placeholder="0" />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={cycleForm.processing}>Salvar ciclo</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Editar Ciclo ─────────────────────────────────────── */}
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
                            <Input type="number" min={1} max={31} value={editCycleForm.data.day_of_month} onChange={(e) => editCycleForm.setData('day_of_month', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Valor esperado (R$)</Label>
                            <Input type="number" value={editCycleForm.data.expected_amount} onChange={(e) => editCycleForm.setData('expected_amount', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={editCycleForm.processing}>Salvar alterações</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Sheet: Novo Lançamento ───────────────────────────────────── */}
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

            {/* ── Sheet: Editar Lançamento ─────────────────────────────────── */}
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
