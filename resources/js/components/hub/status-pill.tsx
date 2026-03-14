import { cn } from '@/lib/utils';

/* Exact colors from Figma Financeiro.tsx statusConfig */
const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pago: { bg: '#F0FDF4', text: '#15803D', label: 'Pago' },
    aberto: { bg: '#FFFBEB', text: '#B45309', label: 'Aberto' },
    impossibilitado: { bg: '#F0EFED', text: '#6B6A67', label: 'Impossibilitado' },
};

export function StatusPill({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const cfg = statusConfig[status.toLowerCase()] ?? statusConfig.aberto;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                className,
            )}
            style={{ background: cfg.bg, color: cfg.text }}
        >
            {cfg.label}
        </span>
    );
}
