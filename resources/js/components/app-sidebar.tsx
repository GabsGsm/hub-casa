import { Link } from '@inertiajs/react';
import { CalendarDays, CheckSquare, CreditCard, LayoutGrid, Package, ShoppingCart } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        color: '#1A1917',
    },
    {
        title: 'Financeiro',
        href: '/financeiro',
        icon: CreditCard,
        color: '#2563EB',
    },
    {
        title: 'Tarefas',
        href: '/tarefas',
        icon: CheckSquare,
        color: '#7C3AED',
    },
    {
        title: 'Agenda',
        href: '/agenda',
        icon: CalendarDays,
        color: '#D97706',
    },
    {
        title: 'Compras',
        href: '/compras',
        icon: ShoppingCart,
        color: '#1A1917',
    },
    {
        title: 'Dispensa',
        href: '/dispensa',
        icon: Package,
        color: '#1A1917',
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-[var(--hc-gray-200)]">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="gap-3">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
