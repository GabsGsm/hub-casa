import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusPill } from '@/components/hub/status-pill';
import { currency, MONTH_NAMES_FULL } from '../utils';
import type { Cycle, ResolvedTransaction } from '../types';

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
    return (
        <div className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
            <h3 className="text-sm font-medium text-[#1A1917]">{title}</h3>
            <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 font-mono text-xs text-[#9B9A96]">{count}</span>
            <div className="h-px flex-1 bg-[#E4E3E0]" />
        </div>
    );
}

// ── Row item ─────────────────────────────────────────────────────────────────
function HistoricoRow({ t, isFuture }: { t: ResolvedTransaction; isFuture: boolean }) {
    const dueDay        = t.resolved_date ? new Date(t.resolved_date + 'T00:00').getDate() : null;
    const isParcelamento = !!t.installment_num;
    const isRecorrente  = t.is_recurring;

    return (
        <div className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[#F8F8F7]">
            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1A1917]">{t.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {t.category && (
                        <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-xs text-[#6B6A67]">
                            {t.category.name}
                        </span>
                    )}
                    {isParcelamento && (
                        <span className="font-mono text-xs text-[#9B9A96]">
                            {t.installment_num} de {t.installments_total} parcelas
                        </span>
                    )}
                </div>
            </div>

            {/* Due day — recorrentes only */}
            {isRecorrente && !isParcelamento && dueDay && (
                <span className="shrink-0 text-right font-mono text-xs text-[#9B9A96]">
                    vence dia {dueDay}
                </span>
            )}

            {/* Mini progress — parcelamentos */}
            {isParcelamento && (
                <div className="hidden w-24 shrink-0 items-center gap-2 sm:flex">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F0EFED]">
                        <div
                            className="h-full rounded-full bg-[#2563EB]"
                            style={{
                                width: `${((t.installment_num ?? 0) / (t.installments_total ?? 1)) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="font-mono text-xs text-[#9B9A96]">
                        {t.installment_num}/{t.installments_total}
                    </span>
                </div>
            )}

            {/* Amount */}
            <span className="w-28 shrink-0 text-right font-mono text-sm font-medium text-[#1A1917]">
                -{currency.format(t.amount)}
            </span>

            {/* Status or projection badge */}
            <div className="w-24 shrink-0 text-right">
                {isFuture ? (
                    <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-mono text-[10px] font-medium text-[#D97706]">
                        projetado
                    </span>
                ) : (
                    <StatusPill status={t.status} />
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
type HistoricoViewProps = {
    cycles: Cycle[];
    transactions: ResolvedTransaction[];
    year: number;
    month: number; // 1-indexed
};

export function HistoricoView({ cycles, transactions, year, month }: HistoricoViewProps) {
    const isFuture = (() => {
        const now = new Date();
        return year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
    })();

    function navigate(delta: number) {
        let m = month + delta;
        let y = year;
        if (m < 1)  { m = 12; y -= 1; }
        if (m > 12) { m = 1;  y += 1; }
        router.visit(`/financeiro?year=${y}&month=${m}`, {
            only: ['transactions', 'year', 'month'],
            preserveScroll: true,
        });
    }

    function goToCurrentMonth() {
        const now = new Date();
        router.visit(`/financeiro?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, {
            only: ['transactions', 'year', 'month'],
            preserveScroll: true,
        });
    }

    const recorrentes   = transactions.filter((t) => t.is_recurring && t.type !== 'ganho');
    const parcelamentos = transactions.filter((t) => t.type === 'divida');
    const outros        = transactions.filter((t) => !t.is_recurring && t.type === 'gasto');
    const receitas      = transactions.filter((t) => t.type === 'ganho');

    const totalCiclos   = cycles.reduce((s, c) => s + c.expected_amount, 0);
    const totalReceitas = totalCiclos + receitas.reduce((s, t) => s + t.amount, 0);
    const totalDespesas = [...recorrentes, ...parcelamentos, ...outros]
        .filter((t) => t.status !== 'impossibilitado')
        .reduce((s, t) => s + t.amount, 0);
    const saldo = totalReceitas - totalDespesas;

    const isCurrentMonth = (() => {
        const now = new Date();
        return year === now.getFullYear() && month === now.getMonth() + 1;
    })();

    return (
        <div>
            {/* Month navigation */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]"
                    >
                        <ChevronLeft size={16} className="text-[#6B6A67]" />
                    </button>
                    <span className="w-44 text-center text-[16px] font-medium text-[#1A1917]">
                        {MONTH_NAMES_FULL[month - 1]} {year}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]"
                    >
                        <ChevronRight size={16} className="text-[#6B6A67]" />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {!isCurrentMonth && (
                        <button
                            type="button"
                            onClick={goToCurrentMonth}
                            className="text-sm text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                        >
                            Mês atual
                        </button>
                    )}
                    {isFuture && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-[#D97706]">
                            Projeção futura
                        </span>
                    )}
                </div>
            </div>

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                    { label: 'Receitas', value: totalReceitas, color: '#059669' },
                    { label: 'Despesas', value: totalDespesas, color: '#DC2626' },
                    { label: 'Saldo', value: saldo, color: saldo >= 0 ? '#059669' : '#DC2626' },
                ].map((s) => (
                    <div key={s.label} className="rounded-[12px] border border-[#E4E3E0] bg-white p-4">
                        <p className="mb-1 text-xs text-[#9B9A96]">{s.label}</p>
                        <span
                            className="font-mono text-[20px] font-semibold leading-none"
                            style={{ color: s.color }}
                        >
                            {s.value < 0 ? '-' : ''}
                            {currency.format(Math.abs(s.value))}
                        </span>
                    </div>
                ))}
            </div>

            {/* Recorrentes section */}
            <div className="mb-6">
                <SectionHeader title="Recorrentes" count={recorrentes.length} color="#7C3AED" />
                <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                    {recorrentes.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[#9B9A96]">
                            Nenhum lançamento recorrente neste mês
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E4E3E0]">
                            {recorrentes.map((t) => (
                                <HistoricoRow key={`${t.id}-${t.installment_num ?? 0}`} t={t} isFuture={isFuture} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Parcelamentos section */}
            <div className="mb-6">
                <SectionHeader title="Parcelamentos & Dívidas" count={parcelamentos.length} color="#2563EB" />
                {parcelamentos.length > 0 ? (
                    <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                        <div className="divide-y divide-[#E4E3E0]">
                            {parcelamentos.map((t) => (
                                <HistoricoRow key={`${t.id}-${t.installment_num ?? 0}`} t={t} isFuture={isFuture} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[12px] border border-dashed border-[#E4E3E0] bg-white px-5 py-6 text-center">
                        <p className="text-sm text-[#9B9A96]">Nenhum parcelamento neste mês</p>
                    </div>
                )}
            </div>

            {/* Outros gastos — only if non-empty */}
            {outros.length > 0 && (
                <div className="mb-6">
                    <SectionHeader title="Gastos avulsos" count={outros.length} color="#6B6A67" />
                    <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                        <div className="divide-y divide-[#E4E3E0]">
                            {outros.map((t) => (
                                <HistoricoRow key={t.id} t={t} isFuture={isFuture} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
