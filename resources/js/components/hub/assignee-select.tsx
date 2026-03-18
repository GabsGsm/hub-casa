import { X } from 'lucide-react';

type AssigneeSelectProps = {
    members: { id: number; name: string }[];
    selected: number[];
    onChange: (ids: number[]) => void;
    accentColor?: string;
};

export function AssigneeSelect({
    members,
    selected,
    onChange,
    accentColor = '#2563EB',
}: AssigneeSelectProps) {
    function toggle(id: number) {
        if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
        else onChange([...selected, id]);
    }

    return (
        <div className="flex flex-wrap gap-2">
            {members.map((m) => {
                const active = selected.includes(m.id);
                const initials = m.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        title={m.name}
                        className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                            active ? '' : 'border-[#E4E3E0] bg-white text-[#6B6A67] hover:border-[#C8C7C3]'
                        }`}
                        style={
                            active
                                ? { borderColor: accentColor, backgroundColor: `${accentColor}26`, color: accentColor }
                                : {}
                        }
                    >
                        <span
                            className="flex size-4 items-center justify-center rounded-full text-white"
                            style={{ fontSize: 8, background: active ? accentColor : '#9B9A96' }}
                        >
                            {initials}
                        </span>
                        {m.name.split(' ')[0]}
                        {active && <X size={10} />}
                    </button>
                );
            })}
        </div>
    );
}
