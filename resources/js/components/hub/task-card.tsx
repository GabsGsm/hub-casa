import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarStack } from '@/components/hub/avatar-stack';

type TaskCardProps = {
    id: number;
    title: string;
    completed: boolean;
    color?: string | null;
    assignees: { id: number; name: string }[];
    onToggle?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    /** Quando true renderiza como overlay (não aplica transform/transition) */
    overlay?: boolean;
};

export function TaskCard({
    id,
    title,
    completed,
    color,
    assignees,
    onToggle,
    onEdit,
    onDelete,
    overlay = false,
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = overlay
        ? {}
        : {
              transform: CSS.Transform.toString(transform),
              transition,
          };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                borderLeftWidth: 3,
                borderLeftColor: color ?? '#7C3AED',
                opacity: isDragging ? 0.4 : 1,
            }}
            className={cn(
                'rounded-md border border-[var(--hc-gray-200)] bg-white p-3 text-sm',
                completed && 'opacity-60',
                isDragging && 'shadow-lg',
            )}
        >
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 cursor-grab touch-none text-[var(--hc-gray-300)] hover:text-[var(--hc-gray-500)] active:cursor-grabbing"
                    tabIndex={-1}
                >
                    <GripVertical className="size-3.5" />
                </button>
                <div className="flex flex-1 items-start justify-between gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className={cn(
                            'text-left font-medium text-[var(--hc-gray-900)]',
                            completed && 'line-through',
                        )}
                    >
                        {title}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="text-[var(--hc-gray-300)] hover:text-[var(--hc-gray-600)]"
                                tabIndex={-1}
                            >
                                <Pencil className="size-3.5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="text-[var(--hc-gray-300)] hover:text-[var(--hc-red)]"
                                tabIndex={-1}
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                        <input
                            type="checkbox"
                            checked={completed}
                            onChange={onToggle}
                            className="mt-0.5 size-4 shrink-0 rounded border-[var(--hc-gray-300)]"
                        />
                    </div>
                </div>
            </div>
            {assignees.length > 0 && (
                <div className="mt-2 pl-5">
                    <AvatarStack users={assignees} size={20} />
                </div>
            )}
        </div>
    );
}
