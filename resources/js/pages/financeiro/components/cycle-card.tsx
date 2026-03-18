import { ProgressBar } from '@/components/hub/progress-bar';
import { currency } from '../utils';

type CycleCardProps = {
    name: string;
    dayOfMonth: number | null;
    expectedAmount: number;
    paid: number;
    pending: number;
    isNoCycle?: boolean;
};

export function CycleCard({ name, dayOfMonth, expectedAmount, paid, pending, isNoCycle = false }: CycleCardProps) {
    const total = isNoCycle ? paid + pending : expectedAmount;
    const over = !isNoCycle && paid + pending > expectedAmount;
    const color = isNoCycle ? '#9B9A96' : '#2563EB';
    const allPaid = !isNoCycle && pending === 0 && paid > 0;

    return (
        <div
            className={`rounded-[12px] border bg-white p-5 ${
                over ? 'border-[#DC2626]' : isNoCycle ? 'border-dashed border-[#E4E3E0]' : 'border-[#E4E3E0]'
            }`}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-[#6B6A67]">
                    {isNoCycle ? 'Sem data fixo' : `Ciclo · ${dayOfMonth ? `Dia ${dayOfMonth}` : name}`}
                </span>
                <div className="flex items-center gap-1.5">
                    <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isNoCycle ? '#9B9A96' : allPaid ? '#059669' : '#9B9A96' }}
                    />
                    <span className="text-xs text-[#6B6A67]">
                        {isNoCycle ? 'Flexível' : allPaid ? 'Concluído' : 'Ativo'}
                    </span>
                </div>
            </div>

            <p className="mb-3 font-mono text-[28px] font-semibold leading-none" style={{ color }}>
                {currency.format(total)}
            </p>

            <div className="mb-3 space-y-1.5 border-t border-[#E4E3E0] pt-3">
                <div className="flex justify-between">
                    <span className="text-sm text-[#6B6A67]">Pago</span>
                    <span className="font-mono text-sm text-[#059669]">{currency.format(paid)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-[#6B6A67]">Pendente</span>
                    <span className="font-mono text-sm text-[#D97706]">{currency.format(pending)}</span>
                </div>
            </div>

            <ProgressBar value={paid} max={total || 1} height={6} color={over ? '#DC2626' : color} />
        </div>
    );
}
