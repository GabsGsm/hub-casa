import { cn } from '@/lib/utils';

type ProgressBarProps = {
    value: number;
    max: number;
    height?: number;
    color?: string;
    animate?: boolean;
    className?: string;
};

export function ProgressBar({
    value,
    max,
    height = 6,
    color = '#2563EB',
    animate = true,
    className,
}: ProgressBarProps) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const over = max > 0 && value > max;

    return (
        <div
            className={cn('w-full overflow-hidden rounded-full bg-[#F0EFED]', className)}
            style={{ height }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: over ? '#DC2626' : color,
                    transition: animate ? 'width 400ms ease-out' : undefined,
                    borderRadius: height,
                }}
            />
        </div>
    );
}
