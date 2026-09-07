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
import type { Cycle, FinanceiroProps, Lancamento, TipoRegistro, TxFilter } from './types';
import { currency, MONTH_NAMES_FULL, TX_FILTERS } from './utils';

// ── Helpers de tipo ──────────────────────────────────────────────────────────
function isGasto(l: Lancamento): l is Extract<Lancamento, { tipo_registro: 'gasto' }> {
    return l.tipo_registro === 'gasto';
}
function isParcela(l: Lancamento): l is Extract<Lancamento, { tipo_registro: 'parcela' }> {
    return l.tipo_registro === 'parcela';
}

/** URL base para criação por tipo de registro */
function createEndpointFor(tipo: TipoRegistro) {
    const map: Record<TipoRegistro, string> = {
        gasto: '/financeiro/gastos',
        ganho: '/financeiro/ganhos',
        parcela: '/financeiro/parcelamentos', // cria o grupo
    };
    return map[tipo];
}

/** URL para update/delete de um lançamento individual */
function itemEndpointFor(l: Lancamento) {
    if (l.tipo_registro === 'gasto') return `/financeiro/gastos/${l.id}`;
    if (l.tipo_registro === 'ganho') return `/financeiro/ganhos/${l.id}`;
    // Parcela: update/delete/markAsPaid opera na parcela individual
    return `/financeiro/parcelas/${l.id}`;
}

/** URL para deletar o parcelamento inteiro (grupo + todas as parcelas) */
function parcelamentoEndpointFor(l: Extract<Lancamento, { tipo_registro: 'parcela' }>) {
    return `/financeiro/parcelamentos/${l.parcelamento_id}`;
}

export default function Financeiro({
    cycles,
    lancamentos,
    resumo,
    categories,
    members,
    year,
    month,
}: FinanceiroProps) {
    const [txFilter, setTxFilter] = useState<TxFilter>('todos');

    // ── Navegação de mês ──────────────────────────────────────────────────────
    const now            = new Date();
    const isFuture       = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    function navigate(delta: number) {
        let m = month + delta;
        let y = year;
        if (m < 1)  { m = 12; y -= 1; }
        if (m > 12) { m = 1;  y += 1; }
        router.visit(`/financeiro?year=${y}&month=${m}`, {
            only: ['lancamentos', 'resumo', 'year', 'month'],
            preserveState: true,
            preserveScroll: false,
        });
    }

    // ── Totais por ciclo (filtro visual simples, sem lógica de negócio) ──────
    const cycleMthTotals = useMemo(() => {
        const map: Record<number, { paid: number; pending: number; committed: number }> = {};
        lancamentos.forEach((l) => {
            if (l.tipo_registro === 'ganho' || l.status === 'impossibilitado') return;
            const key = ('ciclo' in l && l.ciclo) ? l.ciclo.id : 0;
            if (!map[key]) map[key] = { paid: 0, pending: 0, committed: 0 };
            if (l.status === 'pago') {
                map[key].paid      += l.valor;
                map[key].committed += l.valor;
            } else {
                map[key].pending   += l.valor;
                map[key].committed += l.valor;
            }
        });
        return map;
    }, [lancamentos]);

    // ── Lançamentos filtrados ─────────────────────────────────────────────────
    const filteredTx = useMemo(() => {
        switch (txFilter) {
            case 'pago':       return lancamentos.filter((l) => l.status === 'pago');
            case 'pendente':   return lancamentos.filter((l) => l.status !== 'pago');
            case 'recorrente': return lancamentos.filter((l) => isGasto(l) && l.recorrente);
            case 'parcela':    return lancamentos.filter((l) => l.tipo_registro === 'parcela');
            default:           return lancamentos;
        }
    }, [lancamentos, txFilter]);

    const tableTotal = filteredTx
        .filter((l) => l.status !== 'impossibilitado')
        .reduce((s, l) => (l.tipo_registro === 'ganho' ? s + l.valor : s - l.valor), 0);

    // ── Ciclos: criar/editar ──────────────────────────────────────────────────
    const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
    const cycleForm     = useForm({ name: '', expected_amount: '' });
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const editCycleForm = useForm({ name: '', expected_amount: '' });

    // ── Lançamentos: criar ────────────────────────────────────────────────────
    const [txDrawerOpen, setTxDrawerOpen] = useState(false);
    const [createTipo, setCreateTipo] = useState<TipoRegistro>('gasto');
    const [createAssignees, setCreateAssignees] = useState<number[]>([]);
    const txForm = useForm<Record<string, string>>({
        titulo: '', valor: '', valor_parcela: '', status: 'aberto',
        vencimento: '', data_recebimento: '', ciclo_id: '', categoria_id: '',
        recorrente: '0', dia_recorrencia: '',
        total_parcelas: '', vencimento_primeira: '', numero_parcela: '1',
        observacoes: '',
    });

    // ── Lançamentos: editar ───────────────────────────────────────────────────
    const [editingTx, setEditingTx] = useState<Lancamento | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

    const editTxForm = useForm<Record<string, string>>({
        titulo: '', valor: '', valor_parcela: '', status: 'aberto',
        vencimento: '', data_recebimento: '', ciclo_id: '', categoria_id: '',
        recorrente: '0', dia_recorrencia: '', numero_parcela: '',
        observacoes: '',
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

    // ── Handlers: lançamentos ─────────────────────────────────────────────────
    function openCreateTx() {
        setCreateAssignees([]);
        setCreateTipo('gasto');
        txForm.reset();
        setTxDrawerOpen(true);
    }

    function openEditTx(l: Lancamento) {
        setEditingTx(l);
        const assignees = 'responsaveis' in l ? l.responsaveis.map((a) => a.id) : [];
        setEditAssignees(assignees);

        const base: Record<string, string> = {
            titulo: l.titulo,
            valor: String(l.valor),
            valor_parcela: '',
            status: l.status,
            vencimento: '',
            data_recebimento: '',
            ciclo_id: '',
            categoria_id: l.categoria ? String(l.categoria.id) : '',
            recorrente: '0',
            dia_recorrencia: '',
            numero_parcela: '',
            observacoes: l.observacoes ?? '',
        };

        if (isGasto(l)) {
            base.vencimento = l.vencimento ?? '';
            base.recorrente = l.recorrente ? '1' : '0';
            base.dia_recorrencia = l.dia_recorrencia ? String(l.dia_recorrencia) : '';
            base.ciclo_id = l.ciclo ? String(l.ciclo.id) : '';
        } else if (l.tipo_registro === 'ganho') {
            base.data_recebimento = l.data_recebimento ?? '';
        } else if (isParcela(l)) {
            base.valor_parcela = String(l.valor);
            base.numero_parcela = String(l.numero_parcela);
            base.vencimento = l.vencimento;
            base.ciclo_id = l.ciclo ? String(l.ciclo.id) : '';
        }

        editTxForm.setData(base);
    }

    function submitCreateTx(e: React.FormEvent) {
        e.preventDefault();
        txForm.transform((d) => ({ ...d, responsavel_ids: createAssignees }));
        txForm.post(createEndpointFor(createTipo), {
            preserveScroll: true,
            onSuccess: () => { txForm.reset(); setTxDrawerOpen(false); },
        });
    }

    function submitEditTx(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTx) return;
        editTxForm.transform((d) => ({ ...d, responsavel_ids: editAssignees }));
        editTxForm.put(itemEndpointFor(editingTx), {
            preserveScroll: true,
            onSuccess: () => setEditingTx(null),
        });
    }

    function deleteLancamento(l: Lancamento) {
        setPendingDelete({
            action: () => router.delete(itemEndpointFor(l), { preserveScroll: true }),
            label: l.titulo,
        });
    }

    function markAsPaid(l: Lancamento) {
        router.put(
            itemEndpointFor(l),
            { status: 'pago' },
            { preserveScroll: true },
        );
    }

    // ── Tooltip descriptions ──────────────────────────────────────────────────
    const TX_FILTER_TOOLTIPS: Record<string, string> = {
        todos:      'Exibe todos os lançamentos do mês',
        pago:       'Apenas lançamentos já pagos',
        pendente:   'Apenas lançamentos ainda em aberto',
        recorrente: 'Gastos que se repetem automaticamente todo mês',
        parcela:    'Parcelas de compras parceladas',
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
                                            only: ['lancamentos', 'resumo', 'year', 'month'],
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
                                <TooltipContent>Grupos de despesas recorrentes (ex: aluguel, serviços).</TooltipContent>
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
                            <TooltipContent>Criar um novo ciclo de pagamento</TooltipContent>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"> 
                    {[
                        { label: 'Receitas', value: resumo.total_receitas, color: '#059669' },
                        { label: 'Despesas', value: resumo.total_despesas, color: '#DC2626' },
                        { label: 'Saldo',    value: resumo.saldo,          color: resumo.saldo >= 0 ? '#059669' : '#DC2626' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-[#E4E3E0] bg-white p-4 flex flex-col items-start justify-center">
                            <p className="mb-1 text-xs text-[#9B9A96] font-medium uppercase tracking-wider">{s.label}</p>
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
                                <TooltipContent>Gastos, ganhos e parcelas do mês.</TooltipContent>
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
                                <TooltipContent>Registrar um novo gasto, ganho ou parcela</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                        <div className="hidden border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:gap-4">
                            {['Descrição', 'Valor', 'Vencimento', 'Ciclo', 'Status', ''].map((h) => (
                                <span key={h} className="text-xs uppercase tracking-wide text-[#9B9A96]">{h}</span>
                            ))}
                        </div>

                        {filteredTx.map((item) => (
                            <div
                                key={`${item.tipo_registro}-${item.id}`}
                                className="group relative flex flex-col gap-3 border-b border-[#E4E3E0] px-5 py-4 last:border-0 hover:bg-[#F8F8F7] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] md:items-center md:gap-4 md:py-2.5"
                            >
                                {/* Bloco Superior: Título + Valor (Mobile) / Descrição (Desktop) */}
                                <div className="flex items-start justify-between pr-10 md:pr-0 md:contents">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <p className="text-sm font-medium text-[#1A1917] md:font-normal">{item.titulo}</p>
                                            {isGasto(item) && item.recorrente && (
                                                <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#7C3AED]">
                                                    Recorrente
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Categorias e Parcelas */}
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            {item.categoria && (
                                                <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-[11px] text-[#6B6A67]">
                                                    {item.categoria.name}
                                                </span>
                                            )}
                                            {isParcela(item) && (
                                                <span className="font-mono text-[11px] text-[#9B9A96]">
                                                    {item.numero_parcela}/{item.total_parcelas}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Valor: Fica à direita no mobile, e na sua coluna no desktop */}
                                    <div className="text-right md:text-left">
                                        <span
                                            className="font-mono text-sm font-semibold md:font-normal"
                                            style={{ color: item.tipo_registro === 'ganho' ? '#059669' : '#1A1917' }}
                                        >
                                            {item.tipo_registro === 'ganho' ? '+' : ''}
                                            {currency.format(item.valor)}
                                        </span>
                                    </div>
                                </div>

                                {/* Bloco Inferior: Info secundária (Vencimento, Ciclo, Status) */}
                                <div className="flex flex-wrap items-center gap-3 md:contents">
                                    {/* Vencimento */}
                                    <span className="font-mono text-xs text-[#6B6A67] md:text-sm">
                                        {item.vencimento_resolvido ?? '—'}
                                    </span>

                                    {/* Ciclo */}
                                    <div className="scale-90 origin-left md:scale-100">
                                        <CyclePill label={('ciclo' in item && item.ciclo?.name) || 'Sem ciclo'} />
                                    </div>

                                    {/* Status */}
                                    <div className="scale-90 origin-left md:scale-100">
                                        {isFuture ? (
                                            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-mono text-[10px] font-medium text-[#D97706]">
                                                projetado
                                            </span>
                                        ) : (
                                            <StatusPill status={item.status} />
                                        )}
                                    </div>
                                </div>

                                {/* Ações: Posicionado de forma fixa ou discreta no mobile */}
                                <div className="absolute right-2 top-3 md:relative md:right-0 md:top-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[#F0EFED] md:opacity-0 md:group-hover:opacity-100">
                                                <MoreHorizontal size={16} className="text-[#6B6A67]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditTx(item)}>
                                                Editar
                                            </DropdownMenuItem>
                                            {item.tipo_registro !== 'ganho' && item.status !== 'pago' && (
                                                <DropdownMenuItem onClick={() => markAsPaid(item)}>
                                                    Marcar como pago
                                                </DropdownMenuItem>
                                            )}
                                            {isParcela(item) && (
                                                <DropdownMenuItem
                                                    onClick={() => setPendingDelete({
                                                        action: () => router.delete(parcelamentoEndpointFor(item), { preserveScroll: true }),
                                                        label: `${item.titulo} (parcelamento inteiro)`,
                                                    })}
                                                    className="text-[#DC2626] focus:text-[#DC2626]"
                                                >
                                                    Remover parcelamento inteiro
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => deleteLancamento(item)}
                                                className="text-[#DC2626] focus:text-[#DC2626]"
                                            >
                                                Remover
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}

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
                    tipoRegistro={createTipo}
                    onTipoChange={setCreateTipo}
                    data={txForm.data}
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
                {editingTx && (
                    <>
                        <TxFormFields
                            tipoRegistro={editingTx.tipo_registro}
                            onTipoChange={() => {}} // tipo não muda na edição
                            data={editTxForm.data}
                            errors={editTxForm.errors}
                            setData={(k, v) => editTxForm.setData(k as any, v)}
                            cycles={cycles}
                            categories={categories}
                            members={members}
                            assigneeIds={editAssignees}
                            onAssigneesChange={setEditAssignees}
                            isEditing
                        />
                        <div className="border-t border-[#F0EFED] pt-4">
                            <button
                                type="button"
                                onClick={() => { deleteLancamento(editingTx); setEditingTx(null); }}
                                className="flex items-center gap-1.5 text-sm text-[#DC2626] hover:underline"
                            >
                                <Trash2 size={13} />
                                Remover lançamento
                            </button>
                        </div>
                    </>
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
