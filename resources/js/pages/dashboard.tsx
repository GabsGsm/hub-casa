import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, Settings } from 'lucide-react';
import { AvatarStack } from '@/components/hub/avatar-stack';
import { ProgressBar } from '@/components/hub/progress-bar';
import { StatCard } from '@/components/hub/stat-card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────
type DashboardProps = {
    house: { id: number; name: string };
    stats: {
        activeCycle: {
            id: number;
            name: string;
            expected_amount: number;
            paid: number;
            pending: number;
        } | null;
        payable: { amount: number; count: number };
        tasks: { done: number; total: number };
        dispensa: { alerts: number };
    };
    cycles: {
        id: number;
        name: string;
        day_of_month: number | null;
        expected_amount: number;
        paid: number;
        pending: number;
    }[];
    transactions: {
        id: number;
        title: string;
        amount: number;
        type: string;
        due_date: string | null;
        category: { name: string; color: string | null } | null;
    }[];
    tasksToday: {
        id: number;
        title: string;
        completed: boolean;
        color: string | null;
        assignees: { id: number; name: string }[];
    }[];
    todayLabel: string;
    upcomingEvents: {
        id: number;
        title: string;
        date: string;
        time: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard() }];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RingChart({ value, max, color }: { value: number; max: number; color: string }) {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const fill = max > 0 ? (value / max) * circ : 0;
    return (
        <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={r} fill="none" stroke="#F0EFED" strokeWidth="3" />
            <circle
                cx="20" cy="20" r={r} fill="none"
                stroke={color} strokeWidth="3"
                strokeDasharray={`${fill} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ transition: 'stroke-dasharray 400ms ease-out' }}
            />
        </svg>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard({ stats, cycles, transactions, tasksToday, todayLabel, upcomingEvents }: DashboardProps) {
    const { auth } = usePage().props;
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">

                {/* ── Greeting Row ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">
                            {greeting}, {auth.user.name}
                        </h1>
                        <p className="mt-1 font-mono text-sm capitalize text-[#9B9A96]">
                            {todayLabel}
                        </p>
                    </div>
                    <div className="hidden items-center gap-1 md:flex">
                        <button className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]">
                            <Bell size={16} className="text-[#9B9A96]" />
                        </button>
                        <button className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]">
                            <Settings size={16} className="text-[#9B9A96]" />
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {/* Ciclo Ativo */}
                    <StatCard
                        label="Ciclo Ativo"
                        value={
                            stats.activeCycle
                                ? `R$ ${fmt(stats.activeCycle.expected_amount)}`
                                : 'Sem ciclo'
                        }
                        accent="#2563EB"
                        caption={
                            stats.activeCycle
                                ? `R$ ${fmt(stats.activeCycle.paid)} pagos · R$ ${fmt(stats.activeCycle.pending)} pendentes`
                                : undefined
                        }
                    >
                        {stats.activeCycle && (
                            <ProgressBar
                                value={stats.activeCycle.paid}
                                max={stats.activeCycle.expected_amount || 1}
                                height={4}
                            />
                        )}
                    </StatCard>

                    {/* A Pagar */}
                    <StatCard
                        label="A Pagar"
                        value={`R$ ${fmt(stats.payable.amount)}`}
                        caption={
                            <span style={{ color: '#DC2626' }}>
                                {stats.payable.count} contas · vence hoje
                            </span>
                        }
                    />

                    {/* Tarefas */}
                    <StatCard label="Tarefas" accent="#7C3AED" value="">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-mono text-[28px] font-semibold leading-none text-[#7C3AED]">
                                    {stats.tasks.done} / {stats.tasks.total}
                                </span>
                                <p className="mt-1 text-xs text-[#9B9A96]">concluídas esta semana</p>
                            </div>
                            <RingChart value={stats.tasks.done} max={stats.tasks.total || 1} color="#7C3AED" />
                        </div>
                    </StatCard>

                    {/* Dispensa */}
                    <StatCard
                        label="Dispensa"
                        value={`${stats.dispensa.alerts} itens`}
                        accent="#D97706"
                        caption="abaixo do mínimo"
                    />
                </div>

                {/* ── Main Grid 60/40 ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">

                    {/* LEFT */}
                    <div className="flex flex-col gap-4">

                        {/* Ciclos de Pagamento */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Ciclos de Pagamento</h2>
                            </div>
                            <div>
                                {cycles.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-4 border-b border-[#E4E3E0] px-5 last:border-0"
                                        style={{ height: 48 }}
                                    >
                                        <span className="w-12 shrink-0 font-mono text-sm text-[#6B6A67]">
                                            {c.name}
                                        </span>
                                        <div className="flex-1">
                                            <ProgressBar value={c.paid} max={c.expected_amount || 1} height={6} />
                                        </div>
                                        <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#059669] sm:block">
                                            R$ {fmt(c.paid)}
                                        </span>
                                        <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#9B9A96] sm:block">
                                            R$ {fmt(c.pending)}
                                        </span>
                                    </div>
                                ))}
                                {/* Sem data row */}
                                <div className="flex items-center gap-4 px-5" style={{ height: 48 }}>
                                    <span className="w-12 shrink-0 rounded-full bg-[#F0EFED] px-2 py-0.5 text-center font-mono text-xs text-[#9B9A96]">
                                        Sem dt.
                                    </span>
                                    <div className="flex-1">
                                        <ProgressBar value={0} max={1} height={6} color="#9B9A96" />
                                    </div>
                                    <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#9B9A96] sm:block">
                                        R$ 0,00
                                    </span>
                                    <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#9B9A96] sm:block">
                                        R$ 0,00
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Últimos Lançamentos */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Últimos Lançamentos</h2>
                            </div>
                            <div>
                                {transactions.length === 0 && (
                                    <div className="px-5 py-6 text-sm text-[#9B9A96]">
                                        Nenhum lançamento registrado.
                                    </div>
                                )}
                                {transactions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex cursor-pointer items-center gap-3 border-b border-[#E4E3E0] px-5 py-3 transition-colors last:border-0 hover:bg-[#F8F8F7]"
                                    >
                                        <div
                                            className="size-2 shrink-0 rounded-full"
                                            style={{
                                                background:
                                                    item.type === 'ganho' ? '#059669' : '#2563EB',
                                            }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-[#1A1917]">{item.title}</p>
                                            <span className="mt-0.5 inline-block rounded-full bg-[#F0EFED] px-2 py-0.5 text-xs text-[#6B6A67]">
                                                {item.category?.name ?? 'Sem categoria'}
                                            </span>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p
                                                className="font-mono text-sm"
                                                style={{ color: item.type === 'ganho' ? '#059669' : '#3D3C3A' }}
                                            >
                                                {item.type === 'ganho' ? '+' : ''}R$ {fmt(Math.abs(item.amount))}
                                            </p>
                                            {item.due_date && (
                                                <p className="font-mono text-xs text-[#9B9A96]">{item.due_date}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end px-5 py-3">
                                <Link
                                    href="/financeiro"
                                    className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                                >
                                    Ver todos →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-4">

                        {/* Tarefas de hoje */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                        <div className="flex items-center justify-between border-b border-[#E4E3E0] px-5 py-4">
                            <div>
                                <h2 className="text-sm font-medium text-[#1A1917]">Tarefas de hoje</h2>
                                <p className="mt-0.5 text-xs text-[#9B9A96] capitalize">{todayLabel}</p>
                            </div>
                            <Link
                                href="/tarefas"
                                className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                                >
                                    Ver quadro
                                </Link>
                            </div>
                            <div className="py-1">
                                {tasksToday.length === 0 && (
                                    <div className="px-5 py-6 text-sm text-[#9B9A96]">
                                        Nenhuma tarefa para hoje.
                                    </div>
                                )}
                                {tasksToday.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F8F8F7]"
                                        style={{ borderLeft: `2px solid ${task.color ?? '#7C3AED'}` }}
                                    >
                                        {/* Circular checkbox */}
                                        <div
                                            className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                task.completed
                                                    ? 'border-[#7C3AED] bg-[#7C3AED]'
                                                    : 'border-[#E4E3E0]'
                                            }`}
                                        >
                                            {task.completed && (
                                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span
                                            className={`flex-1 text-sm ${
                                                task.completed
                                                    ? 'line-through text-[#9B9A96] opacity-50'
                                                    : 'text-[#1A1917]'
                                            }`}
                                        >
                                            {task.title}
                                        </span>
                                        <AvatarStack
                                            users={task.assignees}
                                            size={20}
                                            bg={task.completed ? '#C8C7C3' : '#1A1917'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Próximos Compromissos */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Próximos compromissos</h2>
                            </div>
                            {upcomingEvents.length === 0 ? (
                                <div className="px-5 py-4 text-sm text-[#9B9A96]">
                                    Nenhum compromisso próximo.
                                </div>
                            ) : (
                                <div>
                                    {upcomingEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-3 border-b border-[#E4E3E0] px-5 py-3 last:border-0 hover:bg-[#F8F8F7] transition-colors"
                                        >
                                            <span className="w-10 text-xs font-mono text-[#9B9A96]">{event.date}</span>
                                            <span className="w-12 text-xs font-mono text-[#D97706]">{event.time}</span>
                                            <div className="size-1.5 rounded-full bg-[#D97706]" />
                                            <span className="text-sm text-[#1A1917]">{event.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
