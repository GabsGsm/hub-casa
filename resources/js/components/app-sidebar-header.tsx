import { Bell, Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        /* Figma: h-14, bg-white, border-b, px-6, items-center, gap-3 */
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#E4E3E0] bg-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-[#9B9A96] hover:text-[#1A1917]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {/* Right: bell + settings exactly like figma top bar */}
            <div className="flex items-center gap-0.5">
                <button className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]">
                    <Bell size={16} className="text-[#9B9A96]" />
                </button>
                <button className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED]">
                    <Settings size={16} className="text-[#9B9A96]" />
                </button>
            </div>
        </header>
    );
}
