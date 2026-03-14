import { cn } from '@/lib/utils';

type AvatarStackProps = {
    users: { id: number; name: string }[];
    size?: number;
    max?: number;
    className?: string;
};

export function AvatarStack({
    users,
    size = 20,
    max = 3,
    className,
}: AvatarStackProps) {
    const visible = users.slice(0, max);
    const overflow = users.length - visible.length;

    return (
        <div className={cn('flex items-center -space-x-2', className)}>
            {visible.map((user) => (
                <div
                    key={user.id}
                    className="flex items-center justify-center rounded-full border border-white bg-[var(--hc-gray-900)] text-white"
                    style={{
                        width: size,
                        height: size,
                        fontSize: size * 0.4,
                    }}
                    title={user.name}
                >
                    {user.name
                        .split(' ')
                        .map((chunk) => chunk[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                </div>
            ))}
            {overflow > 0 && (
                <div
                    className="flex items-center justify-center rounded-full border border-white bg-[var(--hc-gray-200)] text-[var(--hc-gray-700)]"
                    style={{
                        width: size,
                        height: size,
                        fontSize: size * 0.4,
                    }}
                >
                    +{overflow}
                </div>
            )}
        </div>
    );
}
