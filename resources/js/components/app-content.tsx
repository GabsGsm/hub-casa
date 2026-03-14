import * as React from 'react';
import { cn } from '@/lib/utils';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & { variant?: AppVariant };

export function AppContent({ variant = 'sidebar', children, className, ...props }: Props) {
    if (variant === 'sidebar') {
        return (
            /* Figma: flex-1, overflow-hidden, max-w-[1200px] mx-auto on inner content */
            <SidebarInset className={cn('overflow-x-hidden', className)} {...props}>
                <div className="mx-auto w-full max-w-[1200px] flex-1">
                    {children}
                </div>
            </SidebarInset>
        );
    }
    return (
        <main className={cn('mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4', className)} {...props}>
            {children}
        </main>
    );
}
