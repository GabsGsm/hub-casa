import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
    label,
    value,
    caption,
    accent,
    children,
    className = '',
}: {
    label: string;
    value?: ReactNode;
    caption?: ReactNode;
    accent?: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-2 rounded-[12px] border border-[#E4E3E0] bg-white p-5', className)}>
            <p className="text-xs uppercase tracking-wide text-[#9B9A96]">{label}</p>
            {value !== undefined && (
                <div
                    className="font-mono text-[28px] font-semibold leading-none"
                    style={{ color: accent ?? '#1A1917' }}
                >
                    {value}
                </div>
            )}
            {caption && (
                <div className="font-mono text-xs" style={{ color: '#9B9A96' }}>
                    {caption}
                </div>
            )}
            {children}
        </div>
    );
}
