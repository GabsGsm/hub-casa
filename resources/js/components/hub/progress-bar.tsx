import { cn } from '@/lib/utils';

type ProgressBarProps = {
    value: number;
    max: number;
    height?: number;
    color?: string;
    overColor?: string;
    className?: string;
};

export function ProgressBar({
    value,
    max,
    height = 6,
    color = '#2563EB',
    overColor = '#DC2626',
    className,
}: ProgressBarProps) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const over = max > 0 && value > max;

    return (
        <div
            className={cn(
                'w-full overflow-hidden rounded-full bg-[var(--hc-gray-100)]',
                className,
            )}
            style={{ height }}
        >
            <div
                className="h-full transition-[width] duration-300 ease-out"
                style={{
                    width: `${pct}%`,
                    background: over ? overColor : color,
                }}
            />
        </div>
    );
}
