import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    subtitle,
}: {
    user: User;
    showEmail?: boolean;
    subtitle?: string | null;
}) {
    const getInitials = useInitials();

    return (
        <>
            {/* Figma: size-7 rounded-full bg-[#1A1917] text-white */}
            <Avatar className="size-7 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                    className="rounded-full bg-[#1A1917] text-[10px] font-medium text-white"
                >
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium text-[#1A1917]">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-[#9B9A96]">
                        {user.email}
                    </span>
                )}
                {!showEmail && subtitle && (
                    <span className="truncate text-xs text-[#9B9A96]">
                        {subtitle}
                    </span>
                )}
            </div>
        </>
    );
}
