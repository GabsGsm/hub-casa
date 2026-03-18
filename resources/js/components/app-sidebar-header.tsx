import { Bell, Settings } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].title : 'Hub Casa';

    return (
        <header className="flex h-14 shrink-0 items-center border-b border-[#E4E3E0] bg-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-[#9B9A96] hover:text-[#1A1917]" />
                <span className="text-sm text-[#9B9A96]">{pageTitle}</span>
            </div>
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
