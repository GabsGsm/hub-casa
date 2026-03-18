import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskCardProps = {
    id: number;
    title: string;
    description?: string | null;
    completed: boolean;
    color?: string | null;
    assignees: { id: number; name: string }[];
    onToggle?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    overlay?: boolean;
};

export function TaskCard({
    id,
    title,
    description,
    completed,
    color,
    assignees,
    onToggle,
    onEdit,
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
        : { transform: CSS.Transform.toString(transform), transition };

    return (
        /* Figma TaskCard: rounded-[8px], border-left 3px, cursor grab, bg based on completed */
        <div
            ref={setNodeRef}
            onClick={() => onEdit?.()}
            style={{
                ...style,
                opacity: isDragging ? 0.4 : 1,
                borderLeft: `3px solid ${color ?? '#7C3AED'}`,
                borderTop: '1px solid #E4E3E0',
                borderRight: '1px solid #E4E3E0',
                borderBottom: '1px solid #E4E3E0',
                background: completed ? '#F8F8F7' : 'white',
                transform: isDragging
                    ? `${CSS.Transform.toString(transform)} scale(1.02)`
                    : CSS.Transform.toString(transform),
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: overlay ? undefined : transition,
            }}
            className={cn(
                'rounded-[8px] px-3 py-2.5 mb-2 select-none',
                isDragging && 'shadow-lg',
            )}
            {...attributes}
            {...listeners}
        >
            {/* Title row */}
            <div className="mb-1.5 flex items-start justify-between gap-1">
                <span
                    className={cn(
                        'flex-1 text-sm leading-snug',
                        completed
                            ? 'line-through text-[#9B9A96] opacity-50'
                            : 'text-[#1A1917]',
                    )}
                >
                    {title}
                </span>
                {description && (
                    <ChevronRight size={12} className="mt-0.5 shrink-0 text-[#9B9A96]" />
                )}
            </div>

            {/* Description preview */}
            {description && (
                <p className={cn(
                    'mb-2 line-clamp-2 text-xs leading-snug',
                    completed ? 'text-[#9B9A96] opacity-40' : 'text-[#9B9A96]',
                )}>
                    {description}
                </p>
            )}

            {/* Bottom row: avatars + circular checkbox */}
            <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-1">
                    {assignees.slice(0, 3).map((a) => {
                        const initials = a.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();
                        return (
                            <div
                                key={a.id}
                                className="flex items-center justify-center rounded-full border border-white bg-[#1A1917] font-medium text-white"
                                style={{ width: 20, height: 20, fontSize: 8 }}
                            >
                                {initials}
                            </div>
                        );
                    })}
                    {assignees.length > 3 && (
                        <div
                            className="flex items-center justify-center rounded-full border border-white bg-[#F0EFED] text-[#6B6A67]"
                            style={{ width: 20, height: 20, fontSize: 8 }}
                        >
                            +{assignees.length - 3}
                        </div>
                    )}
                </div>

                {/* Circular checkbox — exactly like figma */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle?.();
                    }}
                    className={cn(
                        'flex size-4 items-center justify-center rounded-full border transition-colors',
                        completed
                            ? 'border-[#7C3AED] bg-[#7C3AED]'
                            : 'border-[#E4E3E0] hover:border-[#7C3AED]',
                    )}
                >
                    {completed && (
                        <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M1 2.5L2.8 4L6 1"
                                stroke="white"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
