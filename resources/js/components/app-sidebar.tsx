import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckSquare,
    CreditCard,
    LayoutDashboard,
    Package,
    ShoppingCart,
} from 'lucide-react';
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
    { title: 'Home',       href: dashboard(),    icon: LayoutDashboard, color: '#1A1917' },
    { title: 'Financeiro', href: '/financeiro',  icon: CreditCard,      color: '#2563EB' },
    { title: 'Tarefas',    href: '/tarefas',     icon: CheckSquare,     color: '#7C3AED' },
    { title: 'Agenda',     href: '/agenda',      icon: CalendarDays,    color: '#D97706' },
    { title: 'Compras',    href: '/compras',     icon: ShoppingCart,    color: '#1A1917' },
    { title: 'Dispensa',   href: '/dispensa',    icon: Package,         color: '#1A1917' },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Logo — exactly h-14, gap-2, px-4 like figma */}
            <SidebarHeader className="border-b border-[#E4E3E0]">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 gap-2 rounded-none px-4 hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="py-3">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-[#E4E3E0]">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
