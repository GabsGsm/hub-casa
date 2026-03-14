import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = isCurrentUrl(item.href);
                    return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={{ children: item.title }}
                            className="h-9 rounded-[6px] px-3 transition-colors duration-150"
                            style={
                                isActive
                                    ? {
                                          borderLeftWidth: 2,
                                          borderLeftColor:
                                              item.color ?? '#1A1917',
                                          backgroundColor:
                                              'var(--hc-gray-100)',
                                      }
                                    : {
                                          borderLeftWidth: 2,
                                          borderLeftColor: 'transparent',
                                      }
                            }
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && (
                                    <item.icon
                                        className="size-4 shrink-0"
                                        style={{
                                            color: isActive
                                                ? (item.color ?? '#1A1917')
                                                : 'var(--hc-gray-400)',
                                        }}
                                    />
                                )}
                                <span
                                    style={{
                                        color: isActive
                                            ? 'var(--hc-gray-900)'
                                            : 'var(--hc-gray-500)',
                                    }}
                                >
                                    {item.title}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
