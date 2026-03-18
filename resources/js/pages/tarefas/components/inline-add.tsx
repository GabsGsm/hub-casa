import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

type InlineAddProps = {
    dayIndex: number;
    onAdd: (title: string, dayIndex: number) => void;
};

export function InlineAdd({ dayIndex, onAdd }: InlineAddProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!value.trim()) { setOpen(false); return; }
        onAdd(value.trim(), dayIndex);
        setValue('');
        setOpen(false);
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="flex w-full items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-xs text-[#C8C7C3] transition-colors hover:bg-[#F0EFED] hover:text-[#9B9A96]"
            >
                <Plus size={12} />
                Adicionar tarefa
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="flex items-center gap-1">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => { if (!value.trim()) setOpen(false); }}
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                placeholder="Título da tarefa..."
                className="h-7 text-xs"
            />
            <button type="submit" className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#1A1917] text-white hover:bg-[#3D3C3A]">
                <Plus size={12} />
            </button>
        </form>
    );
}
