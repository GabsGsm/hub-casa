import { Head, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, HelpCircle, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { CycleCard } from './components/cycle-card';
import { TxDrawer } from './components/tx-drawer';
import { TxFormFields } from './components/tx-form-fields';
import type { Cycle, FinanceiroProps, ResolvedTransaction, TxFilter } from './types';
import { currency, MONTH_NAMES_FULL, TX_FILTERS } from './utils';

export default function Financeiro({
    cycles,
    transactions,
    categories,
    members,
    year,
    month,
}: FinanceiroProps) {
    const [txFilter, setTxFilter] = useState<TxFilter>('todos');

    // ── Navegação de mês ──────────────────────────────────────────────────────
    const now           = new Date();
    const isFuture      = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    function navigate(delta: number) {
        let m = month + delta;
        let y = year;
        if (m < 1)  { m = 12; y -= 1; }
        if (m > 12) { m = 1;  y += 1; }
        router.visit(`/financeiro?year=${y}&month=${m}`, {
            only: ['transactions', 'year', 'month'],
            preserveState: true,
            preserveScroll: false,
        });
    }

    // ── Totais por ciclo (computed do mês) ────────────────────────────────────
    const cycleMthTotals = useMemo(() => {
        const map: Record<number, { paid: number; pending: number; committed: number }> = {};
        transactions.forEach((t) => {
            if (t.type === 'ganho' || t.status === 'impossibilitado') return;
            const key = t.cycle ? t.cycle.id : 0;
            if (!map[key]) map[key] = { paid: 0, pending: 0, committed: 0 };
            if (t.status === 'pago') {
                map[key].paid      += t.amount;
                map[key].committed += t.amount;
            } else {
                map[key].pending   += t.amount;
                map[key].committed += t.amount;
            }
        });
        return map;
    }, [transactions]);

    // ── Resumo do mês ─────────────────────────────────────────────────────────
    const { totalReceitas, totalDespesas, saldo } = useMemo(() => {
        const ganhos      = transactions.filter((t) => t.type === 'ganho');
        const despesas    = transactions.filter((t) => t.type !== 'ganho' && t.status !== 'impossibilitado');
        const totalCiclos = cycles.reduce((s, c) => s + c.expected_amount, 0);
        const rec         = totalCiclos + ganhos.reduce((s, t) => s + t.amount, 0);
        const desp        = despesas.reduce((s, t) => s + t.amount, 0);
        return { totalReceitas: rec, totalDespesas: desp, saldo: rec - desp };
    }, [transactions, cycles]);

    // ── Lançamentos filtrados ─────────────────────────────────────────────────
    const filteredTx = useMemo(() => {
        switch (txFilter) {
            case 'pago':       return transactions.filter((t) => t.status === 'pago');
            case 'pendente':   return transactions.filter((t) => t.status !== 'pago');
            case 'recorrente': return transactions.filter((t) => t.is_recurring);
            case 'divida':     return transactions.filter((t) => t.type === 'divida');
            default:           return transactions;
        }
    }, [transactions, txFilter]);

    const tableTotal = filteredTx
        .filter((t) => t.status !== 'impossibilitado')
        .reduce((s, t) => (t.type === 'ganho' ? s + t.amount : s - t.amount), 0);

    // ── Ciclos: criar/editar ──────────────────────────────────────────────────
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
    const cycleForm     = useForm({ name: '', expected_amount: '' });
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', expected_amount: '' });

    // ── Lançamentos: criar/editar ─────────────────────────────────────────────
    const [txDrawerOpen, setTxDrawerOpen] = useState(false);
    const [createAssignees, setCreateAssignees] = useState<number[]>([]);
    const txForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        is_recurring: '0', recurrence_day: '', installments_total: '',
        installment_amount: '', notes: '',
    });

    const [editingTx, setEditingTx] = useState<ResolvedTransaction | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

    const editTxForm = useForm({
        title: '', amount: '', type: 'gasto', status: 'aberto',
        due_date: '', payment_cycle_id: '', category_id: '',
        is_recurring: '0', recurrence_day: '', installments_total: '',
        installment_amount: '', notes: '',
    });

    // ── Handlers: ciclos ──────────────────────────────────────────────────────
    function openEditCycle(cycle: Cycle) {
        setEditingCycle(cycle);
        editCycleForm.setData({ name: cycle.name, expected_amount: String(cycle.expected_amount) });
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
    function openEditTx(tx: ResolvedTransaction) {
        setEditingTx(tx);
        setEditAssignees(tx.assignees.map((a) => a.id));
        editTxForm.setData({
            title:              tx.title,
            amount:             String(tx.amount),
            type:               tx.type,
            status:             tx.status,
            due_date:           tx.due_date ?? '',
            payment_cycle_id:   tx.cycle  ? String(tx.cycle.id)    : '',
            category_id:        tx.category ? String(tx.category.id) : '',
            is_recurring:       tx.is_recurring ? '1' : '0',
            recurrence_day:     tx.recurrence_day    ? String(tx.recurrence_day)    : '',
            installments_total: tx.installments_total ? String(tx.installments_total) : '',
            installment_amount: tx.installment_amount ? String(tx.installment_amount) : '',
            notes:              tx.notes ?? '',
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
    function deleteTransaction(tx: ResolvedTransaction) {
        setPendingDelete({
            action: () => router.delete(`/financeiro/lancamentos/${tx.id}`, { preserveScroll: true }),
            label: tx.title,
        });
    }
    function markAsPaid(id: number) {
        router.put(`/financeiro/lancamentos/${id}`, { status: 'pago' }, { preserveScroll: true });
    }
    // ── Tooltip descriptions ──────────────────────────────────────────────────
    const TX_FILTER_TOOLTIPS: Record<string, string> = {
        todos:      'Exibe todos os lançamentos do mês',
        pago:       'Apenas lançamentos já pagos',
        pendente:   'Apenas lançamentos ainda em aberto',
        recorrente: 'Lançamentos que se repetem automaticamente todo mês',
        divida:     'Lançamentos do tipo dívida',
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const noCycle     = cycleMthTotals[0];
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

                {/* ── Header: título + navegação de mês ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-[28px] font-semibold text-[#1A1917]">Financeiro</h1>

                    <div className="flex items-center gap-3">
                        {isFuture && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-[#D97706]">
                                        Projeção futura
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Os valores exibidos são projeções baseadas em lançamentos recorrentes.</TooltipContent>
                            </Tooltip>
                        )}

                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]"
                                    >
                                        <ChevronLeft size={16} className="text-[#6B6A67]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Mês anterior</TooltipContent>
                            </Tooltip>
                            <span className="w-40 text-center text-sm font-medium text-[#1A1917]">
                                {MONTH_NAMES_FULL[month - 1]} {year}
                            </span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => navigate(1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]"
                                    >
                                        <ChevronRight size={16} className="text-[#6B6A67]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Próximo mês</TooltipContent>
                            </Tooltip>
                        </div>

                        {!isCurrentMonth && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => router.visit(`/financeiro?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, {
                                            only: ['transactions', 'year', 'month'],
                                            preserveState: true,
                                        })}
                                        className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                                    >
                                        Mês atual
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Voltar para o mês atual</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* ── Cards de ciclo ── */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[16px] font-medium text-[#1A1917]">Ciclos de Pagamento</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                        <HelpCircle size={13} className="text-[#C8C7C3]" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Grupos de despesas recorrentes (ex: aluguel, serviços). Ajudam a organizar onde cada gasto se encaixa.</TooltipContent>
                            </Tooltip>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setCycleDialogOpen(true)}
                                    className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                >
                                    <Plus size={14} />
                                    Novo ciclo
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Criar um novo ciclo de pagamento para agrupar despesas</TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cycles.map((cycle) => {
                            const mth = cycleMthTotals[cycle.id] ?? { paid: 0, pending: 0, committed: 0 };
                            return (
                                <div key={cycle.id} className="group relative">
                                    <CycleCard
                                        name={cycle.name}
                                        expectedAmount={cycle.expected_amount}
                                        paid={mth.paid}
                                        pending={mth.pending}
                                        committed={mth.committed}
                                    />
                                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex size-6 items-center justify-center rounded-lg transition-colors hover:bg-[#F0EFED]">
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
                                expectedAmount={0}
                                paid={noCycle.paid}
                                pending={noCycle.pending}
                                committed={noCycle.committed}
                                isNoCycle
                            />
                        )}
                    </div>
                </div>

                {/* ── Resumo do mês ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Receitas', value: totalReceitas, color: '#059669' },
                        { label: 'Despesas', value: totalDespesas, color: '#DC2626' },
                        { label: 'Saldo',    value: saldo,         color: saldo >= 0 ? '#059669' : '#DC2626' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-[#E4E3E0] bg-white p-4">
                            <p className="mb-1 text-xs text-[#9B9A96]">{s.label}</p>
                            <span className="font-mono text-[20px] font-semibold leading-none" style={{ color: s.color }}>
                                {s.value < 0 ? '-' : ''}
                                {currency.format(Math.abs(s.value))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Lançamentos ── */}
                <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[16px] font-medium text-[#1A1917]">Lançamentos</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                        <HelpCircle size={13} className="text-[#C8C7C3]" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Registros de receitas, gastos e dívidas do mês. Clique em uma linha para editar.</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {TX_FILTERS.map(({ key, label }) => (
                                <Tooltip key={key}>
                                    <TooltipTrigger asChild>
                                        <button
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
                                    </TooltipTrigger>
                                    <TooltipContent>{TX_FILTER_TOOLTIPS[key]}</TooltipContent>
                                </Tooltip>
                            ))}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={openCreateTx}
                                        className="flex h-9 items-center gap-1.5 rounded-[8px] bg-[#1A1917] px-4 text-sm text-white transition-colors hover:bg-[#3D3C3A]"
                                    >
                                        <Plus size={14} />
                                        Novo lançamento
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Registrar uma nova receita, despesa ou dívida</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                        <div className="hidden border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:gap-4">
                            {['Descrição', 'Valor', 'Vencimento', 'Ciclo', 'Status', ''].map((h) => (
                                <span key={h} className="text-xs uppercase tracking-wide text-[#9B9A96]">{h}</span>
                            ))}
                        </div>

                        {filteredTx.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-[#9B9A96]">
                                Nenhum lançamento{isFuture ? ' projetado' : ''} para este mês.
                            </div>
                        ) : (
                            filteredTx.map((item) => (
                                <div
                                    key={`${item.id}-${item.installment_num ?? 0}`}
                                    className="group grid cursor-pointer grid-cols-1 items-center gap-2 border-b border-[#E4E3E0] px-5 py-2.5 last:border-0 hover:bg-[#F8F8F7] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:gap-4"
                                >
                                    {/* Descrição */}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <p className="text-sm text-[#1A1917]">{item.title}</p>
                                            {item.is_recurring && (
                                                <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#7C3AED]">
                                                    Recorrente
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                            {item.category && (
                                                <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-xs text-[#6B6A67]">
                                                    {item.category.name}
                                                </span>
                                            )}
                                            {item.installment_num && (
                                                <span className="font-mono text-xs text-[#9B9A96]">
                                                    {item.installment_num}/{item.installments_total} parcelas
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
                                        {item.resolved_date ?? '—'}
                                    </span>

                                    {/* Ciclo */}
                                    <div>
                                        <CyclePill label={item.cycle?.name ?? 'Sem ciclo'} />
                                    </div>

                                    {/* Status / Projetado */}
                                    <div>
                                        {isFuture ? (
                                            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-mono text-[10px] font-medium text-[#D97706]">
                                                projetado
                                            </span>
                                        ) : (
                                            <StatusPill status={item.status} />
                                        )}
                                    </div>

                                    {/* Ações */}
                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex size-7 items-center justify-center rounded-[6px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#F0EFED]">
                                                    <MoreHorizontal size={14} className="text-[#6B6A67]" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {item.status !== 'pago' && !isFuture && (
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
            </div>

            {/* ── Drawer: Novo Lançamento ───────────────────────────────────────── */}
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

            {/* ── Drawer: Editar Lançamento ─────────────────────────────────────── */}
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

            {/* ── Dialog: Novo Ciclo ────────────────────────────────────────────── */}
            <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Novo ciclo</DialogTitle></DialogHeader>
                    <form onSubmit={submitCycle} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                value={cycleForm.data.name}
                                onChange={(e) => cycleForm.setData('name', e.target.value)}
                                placeholder="Ex: Conta de luz"
                            />
                            <InputError message={cycleForm.errors.name} />
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

            {/* ── Dialog: Editar Ciclo ──────────────────────────────────────────── */}
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

            {/* ── Confirm: Remover ──────────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}"?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
