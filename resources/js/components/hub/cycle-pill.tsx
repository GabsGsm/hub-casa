import { cn } from '@/lib/utils';

/* Exact from figma: CyclePill uses font-mono, EFF6FF/2563EB or F0EFED/6B6A67 */
export function CyclePill({
    label,
    className,
}: {
    label: string;
    className?: string;
}) {
    const isSemData = !label || label.toLowerCase().includes('sem data');
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-medium',
                className,
            )}
            style={
                isSemData
                    ? { background: '#F0EFED', color: '#6B6A67' }
                    : { background: '#EFF6FF', color: '#2563EB' }
            }
        >
            {label || 'Sem data'}
        </span>
    );
}
