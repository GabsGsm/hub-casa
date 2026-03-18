import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ProgressBar } from '@/components/hub/progress-bar';
import { StatusPill } from '@/components/hub/status-pill';
import { currency } from '../utils';
import type { MonthProjection } from '../types';

type MonthCardProps = {
    data: MonthProjection;
    defaultExpanded: boolean;
};

export function MonthCard({ data, defaultExpanded }: MonthCardProps) {
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
