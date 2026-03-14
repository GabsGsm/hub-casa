import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
    pago: 'bg-[#ECFDF3] text-[#027A48]',
    aberto: 'bg-[#FFFAEB] text-[#B54708]',
    impossibilitado: 'bg-[#F2F4F7] text-[#667085]',
};

export function StatusPill({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusStyles[status] ?? 'bg-[#F2F4F7] text-[#667085]',
                className,
            )}
        >
            {status === 'pago'
                ? 'Pago'
                : status === 'impossibilitado'
                  ? 'Impossibilitado'
                  : 'Aberto'}
        </span>
    );
}
