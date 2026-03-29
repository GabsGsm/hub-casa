import { Head, Link, usePage } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { AvatarStack } from '@/components/hub/avatar-stack';
import { ProgressBar } from '@/components/hub/progress-bar';
import { RingChart } from '@/components/hub/ring-chart';
import { StatCard } from '@/components/hub/stat-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { DashboardProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard() }];

function fmt(n: number) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard({ stats, cycles, transactions, tasksToday, todayLabel, upcomingEvents }: DashboardProps) {
    const { auth } = usePage().props;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">

                {/* ── Greeting ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">
                            {greeting}, {auth.user.name}
                        </h1>
                        <p className="mt-1 font-mono text-sm capitalize text-[#9B9A96]">{todayLabel}</p>
                    </div>
                    <div className="hidden items-center gap-1 md:flex">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/settings/profile"
                                    className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]"
                                >
                                    <Settings size={16} className="text-[#9B9A96]" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>Configurações</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        label="Ciclo Ativo"
                        accent="#2563EB"
                        tooltip="Resumo do ciclo de pagamento ativo. Mostra o total esperado, o valor já pago e o que ainda está pendente."
                        value={stats.activeCycle ? `R$ ${fmt(stats.activeCycle.expected_amount)}` : 'Sem ciclo'}
                        caption={
                            stats.activeCycle
                                ? `R$ ${fmt(stats.activeCycle.paid)} pagos · R$ ${fmt(stats.activeCycle.pending)} pendentes`
                                : undefined
                        }
                    >
                        {stats.activeCycle && (
                            <ProgressBar value={stats.activeCycle.paid} max={stats.activeCycle.expected_amount || 1} height={4} />
                        )}
                    </StatCard>

                    <StatCard
                        label="A Pagar"
                        tooltip="Total de contas pendentes de pagamento no mês atual."
                        value={`R$ ${fmt(stats.payable.amount)}`}
                        caption={
                            <span style={{ color: '#DC2626' }}>
                                {stats.payable.count} {stats.payable.count === 1 ? 'conta' : 'contas'} · este mês
                            </span>
                        }
                    />

                    <StatCard label="Tarefas" tooltip="Progresso das tarefas da semana atual. Mostra quantas foram concluídas.">
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

                    <StatCard
                        label="Dispensa"
                        tooltip="Quantidade de itens na dispensa com estoque abaixo do mínimo definido."
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
                        <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Ciclos de Pagamento</h2>
                            </div>
                            <div>
                                {cycles.length === 0 ? (
                                    <div className="px-5 py-4 text-sm text-[#9B9A96]">Nenhum ciclo de pagamento cadastrado.</div>
                                ) : (
                                    cycles.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center gap-4 border-b border-[#E4E3E0] px-5 last:border-0"
                                            style={{ height: 48 }}
                                        >
                                            <span className={`w-20 shrink-0 font-mono text-sm ${c.id === 0 ? 'italic text-[#9B9A96]' : 'text-[#6B6A67]'}`}>
                                                {c.name}
                                            </span>
                                            <div className="flex-1">
                                                <ProgressBar
                                                    value={c.paid}
                                                    max={c.id === 0 ? (c.paid + c.pending) || 1 : c.expected_amount || 1}
                                                    height={6}
                                                    color={c.id === 0 ? '#9B9A96' : undefined}
                                                />
                                            </div>
                                            <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#059669] sm:block">
                                                R$ {fmt(c.paid)}
                                            </span>
                                            <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-[#9B9A96] sm:block">
                                                R$ {fmt(c.pending)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Últimos Lançamentos */}
                        <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Últimos Lançamentos</h2>
                            </div>
                            <div>
                                {transactions.length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-[#9B9A96]">Nenhum lançamento registrado.</div>
                                ) : (
                                    transactions.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex cursor-pointer items-center gap-3 border-b border-[#E4E3E0] px-5 py-3 transition-colors last:border-0 hover:bg-[#F8F8F7]"
                                        >
                                            <div
                                                className="size-2 shrink-0 rounded-full"
                                                style={{
                                                    background:
                                                        item.type === 'ganho' ? '#059669'
                                                        : item.type === 'parcela' ? '#DC2626'
                                                        : '#2563EB',
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
                                                <p className="font-mono text-xs text-[#9B9A96]">{item.effective_date}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-end px-5 py-3">
                                <Link href="/financeiro" className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]">
                                    Ver todos →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-4">

                        {/* Tarefas de hoje */}
                        <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                            <div className="flex items-center justify-between border-b border-[#E4E3E0] px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-medium text-[#1A1917]">Tarefas de hoje</h2>
                                    <p className="mt-0.5 text-xs capitalize text-[#9B9A96]">{todayLabel}</p>
                                </div>
                                <Link href="/tarefas" className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]">
                                    Ver quadro
                                </Link>
                            </div>
                            <div className="py-1">
                                {tasksToday.length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-[#9B9A96]">Nenhuma tarefa para hoje.</div>
                                ) : (
                                    tasksToday.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F8F8F7]"
                                            style={{ borderLeft: `2px solid ${task.color ?? '#7C3AED'}` }}
                                        >
                                            <div
                                                className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                    task.completed ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-[#E4E3E0]'
                                                }`}
                                            >
                                                {task.completed && (
                                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span
                                                className={`flex-1 text-sm ${task.completed ? 'line-through text-[#9B9A96] opacity-50' : 'text-[#1A1917]'}`}
                                            >
                                                {task.title}
                                            </span>
                                            <AvatarStack users={task.assignees} size={20} bg={task.completed ? '#C8C7C3' : '#1A1917'} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Próximos Compromissos */}
                        <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                            <div className="border-b border-[#E4E3E0] px-5 py-4">
                                <h2 className="text-sm font-medium text-[#1A1917]">Próximos compromissos</h2>
                            </div>
                            {upcomingEvents.length === 0 ? (
                                <div className="px-5 py-4 text-sm text-[#9B9A96]">Nenhum compromisso próximo.</div>
                            ) : (
                                <div>
                                    {upcomingEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center gap-3 border-b border-[#E4E3E0] px-5 py-3 transition-colors last:border-0 hover:bg-[#F8F8F7]"
                                        >
                                            <div className="w-16 shrink-0">
                                                <p className="font-mono text-xs text-[#D97706]">{event.time}</p>
                                                <p className="font-mono text-[10px] text-[#9B9A96]">{event.date}</p>
                                            </div>
                                            <div className="size-1.5 rounded-full bg-[#D97706]" />
                                            <span className="flex-1 text-sm text-[#1A1917]">{event.title}</span>
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