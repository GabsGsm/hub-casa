import { Link, usePage, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';

function AvatarCircle({ name, size = 28 }: { name: string; size?: number }) {
    const getInitials = useInitials();
    const initials = getInitials(name);
    return (
        <div
            style={{ width: size, height: size, fontSize: size * 0.38 }}
            className="flex shrink-0 items-center justify-center rounded-full bg-[#1A1917] font-medium text-white"
        >
            {initials}
        </div>
    );
}

export function NavUser() {
    const { auth } = usePage().props;
    const { house } = usePage().props;

    function handleLogout() {
        router.post('/logout');
    }

    return (
        <div className="flex items-center gap-2 px-3 py-3">
            <AvatarCircle name={auth.user.name} size={28} />
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
                onClick={handleLogout}
                className="p-1 text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                title="Sair"
            >
                <LogOut size={14} />
            </button>
        </div>
    );
}
