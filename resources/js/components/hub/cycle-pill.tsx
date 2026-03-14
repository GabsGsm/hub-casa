import { cn } from '@/lib/utils';

export function CyclePill({
    label,
    className,
}: {
    label: string;
    className?: string;
}) {
    const isFlexible = label.toLowerCase().includes('sem data');

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                isFlexible
                    ? 'bg-[#F2F4F7] text-[#667085]'
                    : 'bg-[#EFF6FF] text-[#2563EB]',
                className,
            )}
        >
            {label}
        </span>
    );
}
