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
            <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                    const isActive = isCurrentUrl(item.href);
                    const activeColor = item.color ?? '#1A1917';
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className="h-9 cursor-pointer select-none rounded-[6px] transition-all duration-150"
                                style={
                                    isActive
                                        ? {
                                              borderLeft: `2px solid ${activeColor}`,
                                              paddingLeft: 10,
                                              backgroundColor: '#F0EFED',
                                          }
                                        : {
                                              borderLeft: '2px solid transparent',
                                          }
                                }
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-2 px-3 py-2">
                                    {item.icon && (
                                        <item.icon
                                            size={16}
                                            className="shrink-0"
                                            style={{
                                                color: isActive ? activeColor : '#9B9A96',
                                            }}
                                        />
                                    )}
                                    <span
                                        className="text-sm"
                                        style={{
                                            color: isActive ? '#1A1917' : '#6B6A67',
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
