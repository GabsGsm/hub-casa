import { Clock, Trash2 } from 'lucide-react';
import type { AgendaEvent } from '../types';

type EventRowProps = {
    event: AgendaEvent;
    onEdit: (e: AgendaEvent) => void;
    onDelete: (id: number, label: string) => void;
};

export function EventRow({ event, onEdit, onDelete }: EventRowProps) {
    return (
        <div
            className="group flex cursor-pointer items-start gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F8F8F7]"
            onClick={() => onEdit(event)}
        >
            <div className="mt-0.5 size-2 shrink-0 rounded-full bg-[#D97706]" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#1A1917]">{event.title}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} className="text-[#9B9A96]" />
                    <span className="font-mono text-xs text-[#9B9A96]">{event.time}</span>
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(event.id, event.title); }}
                className="shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
            >
                <Trash2 size={13} className="text-[#9B9A96]" />
            </button>
        </div>
    );
}
