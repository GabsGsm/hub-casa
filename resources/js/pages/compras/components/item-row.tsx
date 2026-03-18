import { Ban, Check, Trash2 } from 'lucide-react';

type ShoppingItem = {
    id: number;
    name: string;
    quantity: string;
    unit: string;
    status: string; // 'pendente' | 'comprado' | 'impossibilitado'
    recurrence: string | null;
    category: string | null;
    priority: string; // 'normal' | 'high'
};

type ItemRowProps = {
    item: ShoppingItem;
    onEdit: (item: ShoppingItem) => void;
    onToggleStatus: (item: ShoppingItem) => void;
    onDelete: (id: number, name: string) => void;
};

export function ItemRow({ item, onEdit, onToggleStatus, onDelete }: ItemRowProps) {
    const isPurchased = item.status === 'comprado';
    const isBlocked = item.status === 'impossibilitado';

    return (
        <div
            className="group flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F8F8F7]"
            onClick={() => onEdit(item)}
        >
            {/* Checkbox / blocked icon */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleStatus(item); }}
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isPurchased
                        ? 'border-[#059669] bg-[#059669]'
                        : isBlocked
                          ? 'border-[#D97706] bg-[#D97706]'
                          : 'border-[#E4E3E0] hover:border-[#059669]'
                }`}
            >
                {isPurchased && <Check size={10} strokeWidth={3} className="text-white" />}
                {isBlocked && <Ban size={10} strokeWidth={3} className="text-white" />}
            </button>

            {/* Priority dot */}
            {item.priority === 'high' && !isPurchased && !isBlocked && (
                <div className="size-1.5 shrink-0 rounded-full bg-[#DC2626]" />
            )}

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
                <span className={`text-sm ${isPurchased ? 'text-[#9B9A96] line-through' : isBlocked ? 'text-[#D97706]' : 'text-[#1A1917]'}`}>
                    {item.name}
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#9B9A96]">
                        {item.quantity} {item.unit}
                    </span>
                    {item.category && (
                        <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                            {item.category}
                        </span>
                    )}
                </div>
            </div>

            {/* Delete */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.name); }}
                className="shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
            >
                <Trash2 size={13} className="text-[#9B9A96]" />
            </button>
        </div>
    );
}
