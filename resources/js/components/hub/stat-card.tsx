import * as React from 'react';
import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function StatCard({
    label,
    value,
    caption,
    accent,
    children,
    className = '',
    tooltip,
}: {
    label: string;
    value?: ReactNode;
    caption?: ReactNode;
    accent?: string;
    children?: ReactNode;
    className?: string;
    tooltip?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-2 rounded-[12px] border border-[#E4E3E0] bg-white p-5', className)}>
            <div className="flex items-center gap-1">
                <p className="text-xs uppercase tracking-wide text-[#9B9A96]">{label}</p>
                {tooltip && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-help">
                                <HelpCircle size={11} className="text-[#C8C7C3]" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{tooltip}</TooltipContent>
                    </Tooltip>
                )}
            </div>
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
