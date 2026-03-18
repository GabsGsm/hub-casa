import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { ProgressBar } from '@/components/hub/progress-bar';

type PantryItem = {
    id: number;
    name: string;
    quantity_current: number;
    quantity_min: number;
    unit: string;
    category: string | null;
    updated_at: string | null;
};

type ItemCardProps = {
    item: PantryItem;
    onEdit: (item: PantryItem) => void;
    onAdjustQty: (item: PantryItem, delta: number) => void;
    onDelete: (id: number) => void;
};

export function ItemCard({ item, onEdit, onAdjustQty, onDelete }: ItemCardProps) {
    const isLow = item.quantity_current <= item.quantity_min;
    const pct = item.quantity_min > 0
        ? Math.min((item.quantity_current / (item.quantity_min * 2)) * 100, 100)
        : item.quantity_current > 0 ? 100 : 0;

    return (
        <div
            className={`group relative overflow-hidden rounded-[12px] border bg-white p-4 transition-shadow hover:shadow-sm ${
                isLow ? 'border-[#FCA5A5]' : 'border-[#E4E3E0]'
            }`}
        >
            {/* Alert badge */}
            {isLow && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5">
                    <AlertTriangle size={10} className="text-[#DC2626]" />
                    <span className="text-[10px] font-medium text-[#DC2626]">Baixo</span>
                </div>
            )}

            {/* Name + category */}
            <div
                className="mb-3 cursor-pointer"
                onClick={() => onEdit(item)}
            >
                <p className="text-sm font-medium text-[#1A1917]">{item.name}</p>
                {item.category && (
                    <span className="mt-0.5 inline-block rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                        {item.category}
                    </span>
                )}
            </div>

            {/* Quantity controls */}
            <div className="mb-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onAdjustQty(item, -1)}
                    className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] transition-colors hover:bg-[#F0EFED]"
                >
                    <Minus size={12} />
                </button>
                <span className="min-w-[60px] text-center font-mono text-sm text-[#1A1917]">
                    {item.quantity_current} {item.unit}
                </span>
                <button
                    type="button"
                    onClick={() => onAdjustQty(item, 1)}
                    className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] transition-colors hover:bg-[#F0EFED]"
                >
                    <Plus size={12} />
                </button>
            </div>

            {/* Progress bar + min */}
            <ProgressBar
                value={item.quantity_current}
                max={item.quantity_min * 2 || 1}
                height={6}
                color={isLow ? '#DC2626' : '#059669'}
            />
            <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#9B9A96]">
                    Mínimo: {item.quantity_min} {item.unit}
                </span>
                {item.updated_at && (
                    <span className="font-mono text-[10px] text-[#C8C7C3]">
                        Atualizado {item.updated_at}
                    </span>
                )}
            </div>

            {/* Delete on hover */}
            <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="absolute bottom-3 right-3 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
            >
                <Trash2 size={12} className="text-[#9B9A96]" />
            </button>
        </div>
    );
}
