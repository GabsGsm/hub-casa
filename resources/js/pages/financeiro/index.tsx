import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

const RECURRENCE_LABELS: Record<string, string> = {
    mensal: 'Mensal',
    anual: 'Anual',
    fixa: 'Fixa',
    diaria: 'Diária',
};

const TABS = [
    { key: 'resumo', label: 'Visão Geral' },
    { key: 'lancamentos', label: 'Lançamentos' },
    { key: 'ciclos', label: 'Ciclos' },
    { key: 'historico', label: 'Histórico' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function noneOrVal(v: string) {
    return v === '__none__' ? '' : v;
}

function valOrNone(v: string | number | null | undefined) {
    return v ? String(v) : '__none__';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Financeiro({ cycles, transactions, categories }: FinanceiroProps) {
    const [tab, setTab] = useState<TabKey>('resumo');

    // ── Ciclo: criar ──────────────────────────────────────────────────────────
    const cycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });

    // ── Ciclo: editar ─────────────────────────────────────────────────────────
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });

    function openEditCycle(cycle: Cycle) {
        setEditingCycle(cycle);
        editCycleForm.setData({
            name: cycle.name,
            day_of_month: cycle.day_of_month ? String(cycle.day_of_month) : '',
            expected_amount: String(cycle.expected_amount),
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
        if (!confirm(`Remover ciclo "${cycle.name}"? Os lançamentos vinculados ficarão sem ciclo.`)) return;
        router.delete(`/financeiro/ciclos/${cycle.id}`, { preserveScroll: true });
    }

    // ── Lançamento: criar ─────────────────────────────────────────────────────
    const [txDialogOpen, setTxDialogOpen] = useState(false);
    const transactionForm = useForm({
        title: '',
        amount: '',
        type: 'gasto',
        status: 'aberto',
        due_date: '',
        payment_cycle_id: '',
        category_id: '',
        recurrence: '',
        installments_count: '',
    });

    // ── Lançamento: editar ────────────────────────────────────────────────────
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const editTxForm = useForm({
        title: '',
        amount: '',
        type: 'gasto',
        status: 'aberto',
        due_date: '',
        payment_cycle_id: '',
        category_id: '',
        recurrence: '',
        installments_count: '',
    });

    function openEditTx(tx: Transaction) {
        setEditingTx(tx);
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

    function submitEditTx(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTx) return;
        editTxForm.put(`/financeiro/lancamentos/${editingTx.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingTx(null),
        });
    }

    function deleteTransaction(tx: Transaction) {
        if (!confirm(`Remover lançamento "${tx.title}"?`)) return;
        router.delete(`/financeiro/lancamentos/${tx.id}`, { preserveScroll: true });
    }

    function markAsPaid(id: number) {
        router.put(`/financeiro/lancamentos/${id}`, { status: 'pago' }, { preserveScroll: true });
    }

    // ── Totais ────────────────────────────────────────────────────────────────
    const totals = useMemo(
        () =>
            transactions.reduce(
                (acc, item) => {
                    item.type !== 'ganho' ? (acc.expenses += item.amount) : (acc.income += item.amount);
                    return acc;
                },
                { expenses: 0, income: 0 },
            ),
        [transactions],
    );

    // ── Form helpers ──────────────────────────────────────────────────────────
    function submitCycle(e: React.FormEvent) {
        e.preventDefault();
        cycleForm.post('/financeiro/ciclos', { preserveScroll: true, onSuccess: () => cycleForm.reset() });
    }

    function submitTransaction(e: React.FormEvent) {
        e.preventDefault();
        transactionForm.post('/financeiro/lancamentos', {
            preserveScroll: true,
            onSuccess: () => {
                transactionForm.reset();
                setTxDialogOpen(false);
            },
        });
    }

    // ── Shared form fields ────────────────────────────────────────────────────
    function CycleFormFields({ form }: { form: typeof cycleForm }) {
        return (
            <>
                <div className="grid gap-2">
                    <Label htmlFor="c-name">Nome</Label>
                    <Input
                        id="c-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Ex: Dia 10"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="c-day">Dia do mês</Label>
                    <Input
                        id="c-day"
                        type="number"
                        min={1}
                        max={31}
                        value={form.data.day_of_month}
                        onChange={(e) => form.setData('day_of_month', e.target.value)}
                        placeholder="Deixe vazio para sem data fixa"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="c-expected">Valor esperado (R$)</Label>
                    <Input
                        id="c-expected"
                        type="number"
                        value={form.data.expected_amount}
                        onChange={(e) => form.setData('expected_amount', e.target.value)}
                        placeholder="0"
                    />
                </div>
            </>
        );
    }

    function TxFormFields({ form }: { form: typeof transactionForm }) {
        return (
            <>
                <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label>Valor (R$)</Label>
                        <Input
                            type="number"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Vencimento</Label>
                        <Input
                            type="date"
                            value={form.data.due_date}
                            onChange={(e) => form.setData('due_date', e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label>Tipo</Label>
                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
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
                        <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
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
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label>Ciclo</Label>
                        <Select
                            value={valOrNone(form.data.payment_cycle_id)}
                            onValueChange={(v) => form.setData('payment_cycle_id', noneOrVal(v))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Sem data fixa</SelectItem>
                                {cycles.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select
                            value={valOrNone(form.data.category_id)}
                            onValueChange={(v) => form.setData('category_id', noneOrVal(v))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
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
                        <Select
                            value={valOrNone(form.data.recurrence)}
                            onValueChange={(v) => form.setData('recurrence', noneOrVal(v))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
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
                        <Input
                            type="number"
                            min={1}
                            value={form.data.installments_count}
                            onChange={(e) => form.setData('installments_count', e.target.value)}
                            placeholder="Ex: 12"
                        />
                    </div>
                </div>
            </>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
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
                        <div className="text-[28px] font-semibold leading-tight text-[var(--hc-gray-900)]">
                            Financeiro
                        </div>
                        <div className="text-sm text-[var(--hc-gray-400)]">
                            Visão geral dos ciclos e lançamentos.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Novo Ciclo */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="gap-2">
                                    <Plus className="size-4" />
                                    Novo ciclo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Novo ciclo</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitCycle} className="grid gap-4 pt-2">
                                    <CycleFormFields form={cycleForm} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={cycleForm.processing}>
                                            Salvar ciclo
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Novo Lançamento */}
                        <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="size-4" />
                                    Novo lançamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Novo lançamento</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submitTransaction} className="grid gap-4 pt-2">
                                    <TxFormFields form={transactionForm} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={transactionForm.processing}>
                                            Salvar lançamento
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-[var(--hc-gray-200)] pb-2 text-sm">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={
                                tab === key
                                    ? 'border-b-2 border-[var(--hc-gray-900)] pb-2 font-medium text-[var(--hc-gray-900)]'
                                    : 'pb-2 text-[var(--hc-gray-400)] transition-colors hover:text-[var(--hc-gray-700)]'
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── TAB: VISÃO GERAL ───────────────────────────────────────── */}
                {tab === 'resumo' && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {cycles.map((cycle) => (
                            <div
                                key={cycle.id}
                                className="rounded-xl border border-[var(--hc-gray-200)] bg-white p-5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-sm text-[var(--hc-gray-500)]">
                                            Ciclo · {cycle.name}
                                        </div>
                                        <div className="font-mono text-xs text-[var(--hc-gray-400)]">
                                            {cycle.day_of_month ? `Dia ${cycle.day_of_month}` : 'Sem data fixa'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditCycle(cycle)}
                                            className="rounded p-1 text-[var(--hc-gray-400)] hover:bg-[var(--hc-gray-100)] hover:text-[var(--hc-gray-700)]"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteCycle(cycle)}
                                            className="rounded p-1 text-[var(--hc-gray-400)] hover:bg-red-50 hover:text-red-500"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 font-mono text-[38px] font-semibold leading-none text-[var(--hc-blue)]">
                                    {currency.format(cycle.expected_amount || 0)}
                                </div>
                                <div className="mt-4 space-y-2 border-t border-[var(--hc-gray-200)] pt-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--hc-gray-500)]">Pago</span>
                                        <span className="font-mono text-[var(--hc-green)]">
                                            {currency.format(cycle.paid)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--hc-gray-500)]">Pendente</span>
                                        <span className="font-mono text-[var(--hc-amber)]">
                                            {currency.format(cycle.pending)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <ProgressBar
                                        value={cycle.paid + cycle.pending}
                                        max={cycle.expected_amount || 1}
                                        height={8}
                                    />
                                </div>
                            </div>
                        ))}
                        {/* Card totais gerais */}
                        <div className="rounded-xl border border-dashed border-[var(--hc-gray-200)] bg-white p-5">
                            <div className="text-sm text-[var(--hc-gray-400)]">Total do mês</div>
                            <div className="mt-2 font-mono text-2xl font-semibold text-[var(--hc-gray-900)]">
                                {currency.format(totals.expenses)}
                            </div>
                            <div className="mt-1 font-mono text-sm text-[var(--hc-gray-500)]">
                                Receitas: {currency.format(totals.income)}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: LANÇAMENTOS ──────────────────────────────────────── */}
                {tab === 'lancamentos' && (
                    <div className="rounded-xl border border-[var(--hc-gray-200)] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[var(--hc-gray-100)] text-xs uppercase text-[var(--hc-gray-400)]">
                                    <tr>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3">Valor</th>
                                        <th className="px-4 py-3">Vencimento</th>
                                        <th className="px-4 py-3">Ciclo</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Recorrência</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-[var(--hc-gray-100)] last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="text-[var(--hc-gray-900)]">{item.title}</div>
                                                <div className="text-xs text-[var(--hc-gray-400)]">
                                                    {item.category?.name ?? 'Sem categoria'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={item.type === 'ganho' ? 'font-mono text-[var(--hc-green)]' : 'font-mono text-[var(--hc-gray-700)]'}>
                                                    {currency.format(item.amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[var(--hc-gray-500)]">
                                                {item.due_date ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <CyclePill label={item.cycle?.name ?? 'Sem data'} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={item.status} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[var(--hc-gray-400)]">
                                                {item.recurrence
                                                    ? `${RECURRENCE_LABELS[item.recurrence] ?? item.recurrence}${item.installments_count ? ` · ${item.installments_count}x` : ''}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {item.status !== 'pago' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => markAsPaid(item.id)}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditTx(item)}
                                                        className="rounded p-1 text-[var(--hc-gray-400)] hover:bg-[var(--hc-gray-100)] hover:text-[var(--hc-gray-700)]"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteTransaction(item)}
                                                        className="rounded p-1 text-[var(--hc-gray-400)] hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {transactions.length === 0 && (
                            <div className="p-6 text-sm text-[var(--hc-gray-400)]">
                                Nenhum lançamento registrado.
                            </div>
                        )}
                    </div>
                )}

                {tab === 'ciclos' && (
                    <div className="py-16 text-center text-sm text-[var(--hc-gray-400)]">
                        Gestão avançada de ciclos — em desenvolvimento
                    </div>
                )}

                {tab === 'historico' && (
                    <div className="py-16 text-center text-sm text-[var(--hc-gray-400)]">
                        Histórico financeiro com gráficos — em desenvolvimento
                    </div>
                )}
            </div>

            {/* ── Dialog: Editar Ciclo ────────────────────────────────────── */}
            <Dialog open={!!editingCycle} onOpenChange={(open) => !open && setEditingCycle(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar ciclo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEditCycle} className="grid gap-4 pt-2">
                        <CycleFormFields form={editCycleForm} />
                        <DialogFooter>
                            <Button type="submit" disabled={editCycleForm.processing}>
                                Salvar alterações
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Editar Lançamento ───────────────────────────────── */}
            <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar lançamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEditTx} className="grid gap-4 pt-2">
                        <TxFormFields form={editTxForm} />
                        <DialogFooter>
                            <Button type="submit" disabled={editTxForm.processing}>
                                Salvar alterações
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
