import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, Settings } from 'lucide-react';
import { AvatarStack } from '@/components/hub/avatar-stack';
import { ProgressBar } from '@/components/hub/progress-bar';
import { StatCard } from '@/components/hub/stat-card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type DashboardProps = {
    house: {
        id: number;
        name: string;
    };
    stats: {
        activeCycle: {
            id: number;
            name: string;
            expected_amount: number;
            paid: number;
            pending: number;
        } | null;
        payable: {
            amount: number;
            count: number;
        };
        tasks: {
            done: number;
            total: number;
        };
        dispensa: {
            alerts: number;
        };
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
        category: {
            name: string;
            color: string | null;
        } | null;
    }[];
    tasksToday: {
        id: number;
        title: string;
        completed: boolean;
        color: string | null;
        assignees: { id: number; name: string }[];
    }[];
    todayLabel: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

export default function Dashboard({
    stats,
    cycles,
    transactions,
    tasksToday,
    todayLabel,
}: DashboardProps) {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-[28px] font-semibold leading-tight text-[var(--hc-gray-900)]">
                            {getGreeting()}, {auth.user.name}
                        </div>
                        <div className="mt-0.5 font-mono text-sm text-[var(--hc-gray-400)]">
                            {todayLabel}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--hc-gray-400)]">
                        <Bell className="size-5" />
                        <Settings className="size-5" />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Ciclo ativo"
                        value={
                            stats.activeCycle
                                ? stats.activeCycle.name
                                : 'Sem ciclo'
                        }
                        caption={
                            stats.activeCycle
                                ? `${currency.format(
                                      stats.activeCycle.paid,
                                  )} pagos · ${currency.format(
                                      stats.activeCycle.pending,
                                  )} pendentes`
                                : 'Crie seu primeiro ciclo'
                        }
                        accent="#2563EB"
                    >
                        {stats.activeCycle && (
                            <ProgressBar
                                value={stats.activeCycle.paid}
                                max={stats.activeCycle.expected_amount || 1}
                                height={4}
                            />
                        )}
                    </StatCard>

                    <StatCard
                        label="A pagar"
                        value={currency.format(stats.payable.amount)}
                        caption={`${stats.payable.count} contas · vence hoje`}
                    />

                    <StatCard
                        label="Tarefas"
                        value={`${stats.tasks.done} / ${stats.tasks.total}`}
                        caption="concluídas esta semana"
                        accent="#7C3AED"
                    />

                    <StatCard
                        label="Dispensa"
                        value={`${stats.dispensa.alerts} itens`}
                        caption="abaixo do mínimo"
                        accent="#D97706"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-[var(--hc-gray-200)] bg-white p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-[var(--hc-gray-900)]">
                                    Ciclos de Pagamento
                                </h2>
                                <Link
                                    href="/financeiro"
                                    className="text-sm text-[var(--hc-gray-400)]"
                                >
                                    Ver financeiro
                                </Link>
                            </div>
                            <div className="flex flex-col divide-y divide-[var(--hc-gray-100)]">
                                {cycles.length === 0 && (
                                    <div className="py-6 text-sm text-[var(--hc-gray-400)]">
                                        Nenhum ciclo criado ainda.
                                    </div>
                                )}
                                {cycles.map((cycle) => (
                                    <div
                                        key={cycle.id}
                                        className="flex items-center gap-4 py-3"
                                    >
                                        <span className="w-20 font-mono text-sm text-[var(--hc-gray-500)]">
                                            {cycle.name}
                                        </span>
                                        <div className="flex-1">
                                            <ProgressBar
                                                value={
                                                    cycle.paid + cycle.pending
                                                }
                                                max={
                                                    cycle.expected_amount || 1
                                                }
                                                height={6}
                                            />
                                        </div>
                                        <span className="font-mono text-xs text-[var(--hc-green)]">
                                            {currency.format(cycle.paid)}
                                        </span>
                                        <span className="font-mono text-xs text-[var(--hc-gray-500)]">
                                            {currency.format(cycle.pending)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--hc-gray-200)] bg-white p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-[var(--hc-gray-900)]">
                                    Últimos lançamentos
                                </h2>
                                <Link
                                    href="/financeiro"
                                    className="text-sm text-[var(--hc-gray-400)]"
                                >
                                    Ver todos
                                </Link>
                            </div>
                            <div className="flex flex-col gap-3">
                                {transactions.length === 0 && (
                                    <div className="py-6 text-sm text-[var(--hc-gray-400)]">
                                        Nenhum lançamento registrado.
                                    </div>
                                )}
                                {transactions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-4 border-b border-[var(--hc-gray-100)] pb-3 last:border-b-0 last:pb-0"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span
                                                className="mt-1.5 size-2 shrink-0 rounded-full"
                                                style={{
                                                    background:
                                                        item.type === 'ganho'
                                                            ? '#059669'
                                                            : '#2563EB',
                                                }}
                                            />
                                            <div>
                                                <div className="text-sm text-[var(--hc-gray-900)]">
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-[var(--hc-gray-400)]">
                                                    {item.category?.name ??
                                                        'Sem categoria'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right text-xs">
                                            <div
                                                className={
                                                    item.type === 'ganho'
                                                        ? 'font-mono text-[var(--hc-green)]'
                                                        : 'font-mono text-[var(--hc-gray-700)]'
                                                }
                                            >
                                                {currency.format(item.amount)}
                                            </div>
                                            <div className="font-mono text-[var(--hc-gray-400)]">
                                                {item.due_date}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-[var(--hc-gray-200)] bg-white p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-[var(--hc-gray-900)]">
                                    Tarefas de hoje
                                </h2>
                                <Link
                                    href="/tarefas"
                                    className="text-sm text-[var(--hc-gray-400)]"
                                >
                                    Ver quadro
                                </Link>
                            </div>
                            <div className="flex flex-col gap-3">
                                {tasksToday.length === 0 && (
                                    <div className="py-6 text-sm text-[var(--hc-gray-400)]">
                                        Nenhuma tarefa para hoje.
                                    </div>
                                )}
                                {tasksToday.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between gap-3 rounded-md border border-[var(--hc-gray-200)] p-3"
                                        style={{
                                            borderLeftWidth: 3,
                                            borderLeftColor:
                                                task.color ?? '#7C3AED',
                                        }}
                                    >
                                        <span
                                            className={
                                                task.completed
                                                    ? 'line-through text-[var(--hc-gray-400)]'
                                                    : 'text-[var(--hc-gray-900)]'
                                            }
                                        >
                                            {task.title}
                                        </span>
                                        <AvatarStack
                                            users={task.assignees}
                                            size={20}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--hc-gray-200)] bg-white p-5">
                            <h2 className="mb-2 text-base font-semibold text-[var(--hc-gray-900)]">
                                Próximos compromissos
                            </h2>
                            <div className="text-sm text-[var(--hc-gray-400)]">
                                Em breve no MVP.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
