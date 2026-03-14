import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
    label,
    value,
    caption,
    accent,
    children,
}: {
    label: string;
    value: ReactNode;
    caption?: ReactNode;
    accent?: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex h-full flex-col gap-3 rounded-xl border border-[var(--hc-gray-200)] bg-white p-4">
            <span className="text-xs uppercase tracking-[0.08em] text-[var(--hc-gray-400)]">
                {label}
            </span>
            <div
                className={cn(
                    'text-[28px] font-semibold font-mono leading-none',
                    accent ? '' : 'text-[var(--hc-gray-900)]',
                )}
                style={accent ? { color: accent } : undefined}
            >
                {value}
            </div>
            {caption && (
                <div className="text-xs text-[var(--hc-gray-400)]">
                    {caption}
                </div>
            )}
            {children}
        </div>
    );
}
