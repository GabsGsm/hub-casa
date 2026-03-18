import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { CyclePill } from '@/components/hub/cycle-pill';
import { StatusPill } from '@/components/hub/status-pill';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { CycleCard } from './components/cycle-card';
import { HistoricoView } from './components/historico-view';
import { TxDrawer } from './components/tx-drawer';
import { TxFormFields } from './components/tx-form-fields';
import type { Cycle, FinanceiroProps, MainTab, Transaction, TxFilter } from './types';
import { currency, TX_FILTERS, resolveTransactionsForMonth } from './utils';

export default function Financeiro({ cycles, transactions, categories, members }: FinanceiroProps) {
    const [mainTab, setMainTab] = useState<MainTab>('visao-geral');
    const [txFilter, setTxFilter] = useState<TxFilter>('todos');

    // ── Data: mês atual ───────────────────────────────────────────────────────
    const today = new Date();
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth();

    const currentMonthTx = useMemo(
        () => resolveTransactionsForMonth(transactions, currentYear, currentMonth),
        [transactions],
    );

    // ── Computed: Visão Geral ─────────────────────────────────────────────────

    /** Paid/pending por ciclo — key 0 = sem ciclo */
    const cycleMthTotals = useMemo(() => {
        const map: Record<number, { paid: number; pending: number }> = {};
        currentMonthTx.forEach((t) => {
            if (t.type === 'ganho') return;
            const key = t.cycle ? t.cycle.id : 0;
            if (!map[key]) map[key] = { paid: 0, pending: 0 };
            if (t.status === 'pago') map[key].paid += t.amount;
            else map[key].pending += t.amount;
        });
        return map;
    }, [currentMonthTx]);

    const filteredTx = useMemo(() => {
        switch (txFilter) {
            case 'pago':       return currentMonthTx.filter((t) => t.status === 'pago');
            case 'pendente':   return currentMonthTx.filter((t) => t.status !== 'pago');
            case 'recorrente': return currentMonthTx.filter((t) => !!t.recurrence);
            case 'divida':     return currentMonthTx.filter((t) => t.type === 'divida');
            default:           return currentMonthTx;
        }
    }, [currentMonthTx, txFilter]);

    const tableTotal = filteredTx.reduce(
        (s, t) => (t.type === 'ganho' ? s + t.amount : s - t.amount),
        0,
    );

    // ── Ciclos: criar/editar ──────────────────────────────────────────────────
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
    const cycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', day_of_month: '', expected_amount: '' });

    // ── Lançamentos: criar/editar ─────────────────────────────────────────────
    const [txDrawerOpen, setTxDrawerOpen] = useState(false);
    const [createAssignees, setCreateAssignees] = useState<number[]>([]);
    const txForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);
    const editTxForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        recurrence: '', installments_count: '',
    });

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
        setPendingDelete({
            action: () => router.delete(`/financeiro/ciclos/${cycle.id}`, { preserveScroll: true }),
            label: cycle.name,
        });
    }

    // ── Handlers: transações ──────────────────────────────────────────────────
    function openCreateTx() {
        setCreateAssignees([]);
        txForm.reset();
        setTxDrawerOpen(true);
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
        txForm.transform((d) => ({ ...d, assignee_ids: createAssignees }));
        txForm.post('/financeiro/lancamentos', {
            preserveScroll: true,
            onSuccess: () => { txForm.reset(); setTxDrawerOpen(false); },
        });
    }
    function submitEditTx(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTx) return;
        editTxForm.transform((d) => ({ ...d, assignee_ids: editAssignees }));
        editTxForm.put(`/financeiro/lancamentos/${editingTx.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingTx(null),
        });
    }
    function deleteTransaction(tx: Transaction) {
        setPendingDelete({
            action: () => router.delete(`/financeiro/lancamentos/${tx.id}`, { preserveScroll: true }),
            label: tx.title,
        });
    }
    function markAsPaid(id: number) {
        router.put(`/financeiro/lancamentos/${id}`, { status: 'pago' }, { preserveScroll: true });
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const noCycle = cycleMthTotals[0];
    const showNoCycle = noCycle && (noCycle.paid > 0 || noCycle.pending > 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Financeiro', href: '/financeiro' },
            ]}
        >
            <Head title="Financeiro" />
            <div className="flex flex-col gap-6 p-6">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-[28px] font-semibold text-[#1A1917]">Financeiro</h1>
                    <div className="mt-4 flex items-center gap-1 border-b border-[#E4E3E0]">
                        {(['visao-geral', 'historico'] as MainTab[]).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setMainTab(tab)}
                                className={`relative pb-3 px-4 text-sm transition-colors ${
                                    mainTab === tab
                                        ? 'text-[#1A1917]'
                                        : 'text-[#9B9A96] hover:text-[#6B6A67]'
                                }`}
                            >
                                {tab === 'visao-geral' ? 'Visão Geral' : 'Histórico'}
                                {mainTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1A1917]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ════════ TAB: VISÃO GERAL ════════ */}
                {mainTab === 'visao-geral' && (
                    <>
                        {/* Cycle cards */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-[16px] font-medium text-[#1A1917]">Ciclos de Pagamento</h3>
                                <button
                                    type="button"
                                    onClick={() => setCycleDialogOpen(true)}
                                    className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                >
                                    <Plus size={14} />
                                    Novo ciclo
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {cycles.map((cycle) => {
                                    const mth = cycleMthTotals[cycle.id] ?? { paid: 0, pending: 0 };
                                    return (
                                        <div key={cycle.id} className="group relative">
                                            <CycleCard
                                                name={cycle.name}
                                                dayOfMonth={cycle.day_of_month}
                                                expectedAmount={cycle.expected_amount}
                                                paid={mth.paid}
                                                pending={mth.pending}
                                            />
                                            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="flex size-6 items-center justify-center rounded-[4px] transition-colors hover:bg-[#F0EFED]">
                                                            <MoreHorizontal size={13} className="text-[#6B6A67]" />
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
                                        </div>
                                    );
                                })}
                                {showNoCycle && (
                                    <CycleCard
                                        name="Sem ciclo"
                                        dayOfMonth={null}
                                        expectedAmount={0}
                                        paid={noCycle.paid}
                                        pending={noCycle.pending}
                                        isNoCycle
                                    />
                                )}
                            </div>
                        </div>

                        {/* Lançamentos section */}
                        <div>
                            {/* Section header: title + filters + new button */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-[16px] font-medium text-[#1A1917]">Lançamentos do ciclo</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    {TX_FILTERS.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTxFilter(key)}
                                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                                txFilter === key
                                                    ? 'border-[#1A1917] bg-[#1A1917] text-white'
                                                    : 'border-[#C8C7C3] bg-white text-[#6B6A67] hover:border-[#9B9A96]'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={openCreateTx}
                                        className="flex h-9 items-center gap-1.5 rounded-[8px] bg-[#1A1917] px-4 text-sm text-white transition-colors hover:bg-[#3D3C3A]"
                                    >
                                        <Plus size={14} />
                                        Novo lançamento
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                                {/* Header row */}
                                <div className="hidden border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:gap-4">
                                    {['Descrição', 'Valor', 'Vencimento', 'Ciclo', 'Status', ''].map((h) => (
                                        <span key={h} className="text-xs uppercase tracking-wide text-[#9B9A96]">{h}</span>
                                    ))}
                                </div>

                                {filteredTx.length === 0 ? (
                                    <div className="px-5 py-8 text-center text-sm text-[#9B9A96]">
                                        Nenhum lançamento encontrado.
                                    </div>
                                ) : (
                                    filteredTx.map((item) => (
                                        <div
                                            key={`${item.id}-${item.installmentNum ?? 0}`}
                                            className="group grid cursor-pointer grid-cols-1 items-center gap-2 border-b border-[#E4E3E0] px-5 py-2.5 last:border-0 hover:bg-[#F8F8F7] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:gap-4"
                                        >
                                            {/* Descrição */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-[#1A1917]">{item.title}</p>
                                                    {item.recurrence && (
                                                        <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#7C3AED]">
                                                            Recorrente
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                    <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-xs text-[#6B6A67]">
                                                        {item.category?.name ?? 'Sem categoria'}
                                                    </span>
                                                    {item.installmentNum && (
                                                        <span className="font-mono text-xs text-[#9B9A96]">
                                                            {item.installmentNum}/{item.installmentsTotal} parcelas
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Valor */}
                                            <span
                                                className="font-mono text-sm"
                                                style={{ color: item.type === 'ganho' ? '#059669' : '#1A1917' }}
                                            >
                                                {item.type === 'ganho' ? '+' : ''}
                                                {currency.format(item.amount)}
                                            </span>

                                            {/* Vencimento */}
                                            <span className="font-mono text-sm text-[#6B6A67]">
                                                {item.resolvedDate}
                                            </span>

                                            {/* Ciclo */}
                                            <div>
                                                <CyclePill label={item.cycle?.name ?? 'Sem ciclo'} />
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <StatusPill status={item.status} />
                                            </div>

                                            {/* Actions */}
                                            <div>
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
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Total row */}
                                {filteredTx.length > 0 && (
                                    <div className="grid grid-cols-1 items-center gap-4 border-t-2 border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px]">
                                        <span className="text-sm font-medium text-[#1A1917]">Total</span>
                                        <span
                                            className="font-mono text-sm font-medium"
                                            style={{ color: tableTotal >= 0 ? '#059669' : '#1A1917' }}
                                        >
                                            {tableTotal >= 0 ? '+' : ''}
                                            {currency.format(Math.abs(tableTotal))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ════════ TAB: HISTÓRICO ════════ */}
                {mainTab === 'historico' && (
                    <HistoricoView cycles={cycles} transactions={transactions} />
                )}
            </div>

            {/* ── Drawer: Novo Lançamento ──────────────────────────────────────── */}
            <TxDrawer
                open={txDrawerOpen}
                onClose={() => setTxDrawerOpen(false)}
                title="Novo lançamento"
                submitLabel="Salvar lançamento"
                onSubmit={submitCreateTx}
                processing={txForm.processing}
            >
                <TxFormFields
                    data={txForm.data as unknown as Record<string, string>}
                    errors={txForm.errors}
                    setData={(k, v) => txForm.setData(k as any, v)}
                    cycles={cycles}
                    categories={categories}
                    members={members}
                    assigneeIds={createAssignees}
                    onAssigneesChange={setCreateAssignees}
                />
            </TxDrawer>

            {/* ── Drawer: Editar Lançamento ────────────────────────────────────── */}
            <TxDrawer
                open={!!editingTx}
                onClose={() => setEditingTx(null)}
                title="Editar lançamento"
                submitLabel="Salvar alterações"
                onSubmit={submitEditTx}
                processing={editTxForm.processing}
            >
                <TxFormFields
                    data={editTxForm.data as unknown as Record<string, string>}
                    errors={editTxForm.errors}
                    setData={(k, v) => editTxForm.setData(k as any, v)}
                    cycles={cycles}
                    categories={categories}
                    members={members}
                    assigneeIds={editAssignees}
                    onAssigneesChange={setEditAssignees}
                />
                {editingTx && (
                    <div className="border-t border-[#F0EFED] pt-4">
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
            </TxDrawer>

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
                            <InputError message={cycleForm.errors.name} />
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
                            <Input
                                value={editCycleForm.data.name}
                                onChange={(e) => editCycleForm.setData('name', e.target.value)}
                            />
                            <InputError message={editCycleForm.errors.name} />
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

            {/* ── Confirm: Remover ─────────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}"?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
