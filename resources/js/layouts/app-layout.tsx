import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CheckSquare,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Settings,
    ShoppingCart,
    X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

// ── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { label: 'Home',       href: dashboard(),   icon: LayoutDashboard, color: '#1A1917', mobileVisible: true  },
    { label: 'Financeiro', href: '/financeiro', icon: CreditCard,      color: '#2563EB', mobileVisible: true  },
    { label: 'Tarefas',    href: '/tarefas',    icon: CheckSquare,     color: '#7C3AED', mobileVisible: true  },
    { label: 'Agenda',     href: '/agenda',     icon: CalendarDays,    color: '#D97706', mobileVisible: true  },
    { label: 'Compras',    href: '/compras',    icon: ShoppingCart,    color: '#1A1917', mobileVisible: true  },
    { label: 'Dispensa',   href: '/dispensa',   icon: Package,         color: '#1A1917', mobileVisible: false },
] as const;

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
    const getInitials = useInitials();
    return (
        <div
            style={{ width: size, height: size, fontSize: size * 0.38 }}
            className="flex shrink-0 items-center justify-center rounded-full bg-[#1A1917] font-medium text-white"
        >
            {getInitials(name)}
        </div>
    );
}

// ── Logo mark ─────────────────────────────────────────────────────────────────
function LogoMark() {
    return (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#1A1917]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                    d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                    fill="white"
                />
            </svg>
        </div>
    );
}

// ── Nav item — full (sidebar) ─────────────────────────────────────────────────
function NavFull({
    item,
    onClick,
}: {
    item: (typeof NAV_ITEMS)[number];
    onClick?: () => void;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const isActive = isCurrentUrl(item.href);
    const color = item.color;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex h-9 items-center gap-2.5 rounded-[6px] px-3 text-sm transition-colors',
                isActive ? 'bg-[#F0EFED]' : 'hover:bg-[#F8F8F7]',
            )}
            style={
                isActive
                    ? { borderLeft: `2px solid ${color}`, paddingLeft: 10 }
                    : { borderLeft: '2px solid transparent' }
            }
        >
            <item.icon
                size={16}
                className="shrink-0"
                style={{ color: isActive ? color : '#9B9A96' }}
            />
            <span style={{ color: isActive ? '#1A1917' : '#6B6A67' }}>
                {item.label}
            </span>
        </Link>
    );
}

// ── Nav item — icon only (tablet rail) ───────────────────────────────────────
function NavIcon({ item }: { item: (typeof NAV_ITEMS)[number] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const isActive = isCurrentUrl(item.href);
    const color = item.color;

    return (
        <Link
            href={item.href}
            title={item.label}
            className={cn(
                'flex size-10 items-center justify-center rounded-[6px] transition-colors',
                isActive ? 'bg-[#F0EFED]' : 'hover:bg-[#F8F8F7]',
            )}
        >
            <item.icon
                size={18}
                style={{ color: isActive ? color : '#9B9A96' }}
            />
        </Link>
    );
}

// ── Desktop sidebar (lg+) ─────────────────────────────────────────────────────
function DesktopSidebar() {
    const { auth, house } = usePage().props;

    return (
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[#E4E3E0] bg-white">
            {/* Logo */}
            <Link
                href={dashboard()}
                className="flex h-14 shrink-0 items-center gap-2 border-b border-[#E4E3E0] px-4 hover:bg-[#F8F8F7] transition-colors"
            >
                <LogoMark />
                <span className="truncate text-[16px] font-medium text-[#1A1917]">Hub Casa</span>
            </Link>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
                <div className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map((item) => (
                        <NavFull key={item.label} item={item} />
                    ))}
                </div>
            </nav>

            {/* User footer */}
            <div className="border-t border-[#E4E3E0] px-3 py-3">
                <div className="flex items-center gap-2">
                    <Avatar name={auth.user.name} size={28} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-[#1A1917]">{auth.user.name}</p>
                        <p className="truncate text-xs text-[#9B9A96]">{house?.name ?? ''}</p>
                    </div>
                    <Link
                        href="/settings/profile"
                        className="p-1 text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                        title="Configurações"
                    >
                        <Settings size={14} />
                    </Link>
                    <button
                        onClick={() => router.post('/logout')}
                        className="p-1 text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                        title="Sair"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

// ── Tablet icon rail (md–lg) + overlay drawer ─────────────────────────────────
function TabletRail({ drawerOpen, onToggle }: { drawerOpen: boolean; onToggle: () => void }) {
    const { auth, house } = usePage().props;

    return (
        <aside className="hidden md:flex lg:hidden w-14 shrink-0 flex-col items-center border-r border-[#E4E3E0] bg-white">
            {/* Hamburger / close */}
            <button
                onClick={onToggle}
                className="flex size-14 shrink-0 items-center justify-center border-b border-[#E4E3E0] hover:bg-[#F8F8F7] transition-colors"
            >
                {drawerOpen ? <X size={18} className="text-[#6B6A67]" /> : <Menu size={18} className="text-[#6B6A67]" />}
            </button>

            {/* Icons */}
            <nav className="flex flex-1 flex-col items-center gap-1 py-3">
                {NAV_ITEMS.map((item) => (
                    <NavIcon key={item.label} item={item} />
                ))}
            </nav>

            {/* Avatar */}
            <div className="pb-3">
                <Link href="/settings/profile" title={auth.user.name}>
                    <Avatar name={auth.user.name} size={32} />
                </Link>
            </div>
        </aside>
    );
}

// ── Tablet drawer (overlay panel beside the rail) ─────────────────────────────
function TabletDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { auth, house } = usePage().props;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 hidden md:block lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/10"
                onClick={onClose}
            />
            {/* Panel — slides from left-14 (right of rail) */}
            <aside className="absolute left-14 top-0 flex h-full w-[180px] flex-col border-r border-[#E4E3E0] bg-white shadow-lg">
                {/* Header */}
                <div className="flex h-14 items-center gap-2 border-b border-[#E4E3E0] px-4">
                    <span className="truncate text-[15px] font-medium text-[#1A1917]">Hub Casa</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2 py-3">
                    <div className="flex flex-col gap-0.5">
                        {NAV_ITEMS.map((item) => (
                            <NavFull key={item.label} item={item} onClick={onClose} />
                        ))}
                    </div>
                </nav>

                {/* User */}
                <div className="border-t border-[#E4E3E0] px-3 py-3">
                    <div className="flex items-center gap-2">
                        <Avatar name={auth.user.name} size={26} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-[#1A1917]">{auth.user.name}</p>
                            <p className="truncate text-[10px] text-[#9B9A96]">{house?.name ?? ''}</p>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            className="p-1 text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                            title="Sair"
                        >
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

// ── Mobile bottom nav (below md) ──────────────────────────────────────────────
function MobileBottomNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const mobileItems = NAV_ITEMS.filter((i) => i.mobileVisible);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#E4E3E0] bg-white md:hidden">
            {mobileItems.map((item) => {
                const isActive = isCurrentUrl(item.href);
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
                    >
                        <item.icon
                            size={20}
                            style={{ color: isActive ? item.color : '#9B9A96' }}
                        />
                        <span
                            className="text-[10px] font-medium"
                            style={{ color: isActive ? item.color : '#9B9A96' }}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({
    breadcrumbs,
    onMenuToggle,
}: {
    breadcrumbs: BreadcrumbItem[];
    onMenuToggle: () => void;
}) {
    const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].title : 'Hub Casa';

    return (
        <header className="flex h-14 shrink-0 items-center border-b border-[#E4E3E0] bg-white px-4 md:px-6">
            {/* Mobile: logo + title */}
            <div className="flex flex-1 items-center gap-3 md:hidden">
                <Link href={dashboard()}>
                    <LogoMark />
                </Link>
                <span className="text-sm font-medium text-[#1A1917]">{pageTitle}</span>
            </div>

            {/* Tablet: hamburger trigger (handled by TabletRail) — just show title */}
            <div className="hidden flex-1 items-center md:flex lg:hidden">
                <span className="text-sm text-[#9B9A96]">{pageTitle}</span>
            </div>

            {/* Desktop: page title */}
            <div className="hidden flex-1 items-center lg:flex">
                <span className="text-sm text-[#9B9A96]">{pageTitle}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
                <Link
                    href="/settings/profile"
                    className="flex size-8 items-center justify-center rounded-[6px] transition-colors hover:bg-[#F0EFED] lg:hidden"
                >
                    <Settings size={16} className="text-[#9B9A96]" />
                </Link>
            </div>
        </header>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { props } = usePage<{ flash?: { success?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash]);

    return (
        <div className="flex h-screen bg-[#F5F4F1]">
            {/* Desktop sidebar */}
            <DesktopSidebar />

            {/* Tablet rail */}
            <TabletRail drawerOpen={drawerOpen} onToggle={() => setDrawerOpen((v) => !v)} />

            {/* Tablet drawer overlay */}
            <TabletDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <TopBar breadcrumbs={breadcrumbs} onMenuToggle={() => setDrawerOpen((v) => !v)} />

                {/* Scrollable content */}
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    <div className="mx-auto w-full max-w-[1200px]">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile bottom nav */}
            <MobileBottomNav />

            <Toaster position="top-right" richColors />
        </div>
    );
}
