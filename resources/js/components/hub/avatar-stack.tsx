import { cn } from '@/lib/utils';

type AvatarStackProps = {
    users: { id: number; name: string }[];
    size?: number;
    max?: number;
    bg?: string;
    className?: string;
};

export function AvatarStack({
    users,
    size = 20,
    max = 3,
    bg = '#1A1917',
    className,
}: AvatarStackProps) {
    const visible = users.slice(0, max);
    const overflow = users.length - visible.length;

    return (
        <div className={cn('flex items-center -space-x-1', className)}>
            {visible.map((user) => {
                const initials = user.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                return (
                    <div
                        key={user.id}
                        title={user.name}
                        className="flex items-center justify-center rounded-full border border-white font-medium text-white"
                        style={{
                            width: size,
                            height: size,
                            fontSize: size * 0.42,
                            background: bg,
                        }}
                    >
                        {initials}
                    </div>
                );
            })}
            {overflow > 0 && (
                <div
                    className="flex items-center justify-center rounded-full border border-white bg-[#F0EFED] font-medium text-[#6B6A67]"
                    style={{ width: size, height: size, fontSize: size * 0.4 }}
                >
                    +{overflow}
                </div>
            )}
        </div>
    );
}
