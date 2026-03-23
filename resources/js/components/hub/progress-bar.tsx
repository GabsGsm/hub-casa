import { cn } from '@/lib/utils';

type ProgressBarProps = {
    value: number;
    secondaryValue?: number;
    max: number;
    height?: number;
    color?: string;
    animate?: boolean;
    className?: string;
};

export function ProgressBar({
    value,
    secondaryValue = 0,
    max,
    height = 6,
    color = '#2563EB',
    animate = true,
    className,
}: ProgressBarProps) {
    const combined = value + secondaryValue;
    const over     = max > 0 && combined > max;
    const activeColor = over ? '#DC2626' : color;

    const pct    = max > 0 ? Math.min((value    / max) * 100, 100) : 0;
    const secPct = max > 0 ? Math.min((combined / max) * 100, 100) : 0;

    const transition = animate ? 'width 400ms ease-out' : undefined;

    return (
        <div
            className={cn('relative w-full overflow-hidden rounded-full bg-[#F0EFED]', className)}
            style={{ height }}
        >
            {secondaryValue > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0, top: 0,
                        width: `${secPct}%`,
                        height: '100%',
                        background: activeColor,
                        opacity: 0.35,
                        borderRadius: height,
                        transition,
                    }}
                />
            )}
            <div
                style={{
                    position: 'absolute',
                    left: 0, top: 0,
                    width: `${pct}%`,
                    height: '100%',
                    background: activeColor,
                    borderRadius: height,
                    transition,
                }}
            />
        </div>
    );
}
