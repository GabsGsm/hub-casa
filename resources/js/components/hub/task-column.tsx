import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from '@/components/hub/task-card';

type Task = {
    id: number;
    title: string;
    completed: boolean;
    color?: string | null;
    assignees: { id: number; name: string }[];
};

type TaskColumnProps = {
    dayIndex: number;
    label: string;
    dateLabel: string;
    isToday?: boolean;
    tasks: Task[];
    onToggle: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
};

export function TaskColumn({
    dayIndex,
    label,
    dateLabel,
    isToday = false,
    tasks,
    onToggle,
    onEdit,
    onDelete,
}: TaskColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: `col-${dayIndex}` });

    const completedCount = tasks.filter((t) => t.completed).length;

    return (
        <div
            className="flex min-w-[140px] flex-col border-r border-[#F0EFED] px-2 last:border-r-0"
            style={{ flex: '1 1 140px' }}
        >
            {/* Column header — exactly like figma KanbanColumn header */}
            <div className="py-3 px-1 mb-2">
                {isToday && (
                    <div className="mb-1 size-1 rounded-full bg-[#1A1917]" />
                )}
                <p className={`text-xs uppercase tracking-widest mb-0.5 ${isToday ? 'text-[#1A1917]' : 'text-[#9B9A96]'}`}>
                    {label}
                </p>
                <div className="flex items-center gap-1.5">
                    <span className={`text-[20px] font-medium leading-none ${isToday ? 'text-[#1A1917]' : 'text-[#3D3C3A]'}`}>
                        {dateLabel}
                    </span>
                    {tasks.length > 0 && (
                        <span className="rounded-full bg-[#F0EFED] px-1.5 py-0.5 font-mono text-xs text-[#6B6A67]">
                            {completedCount}/{tasks.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Drop zone */}
            <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex min-h-[80px] flex-1 flex-col transition-colors"
                    style={{ backgroundColor: isOver ? '#F0EFED' : undefined }}
                >
                    {tasks.length === 0 ? (
                        <div className="rounded-[8px] border border-dashed border-[#E4E3E0] p-3 text-center">
                            <span className="text-xs text-[#C8C7C3]">Nenhuma tarefa</span>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                id={task.id}
                                title={task.title}
                                completed={task.completed}
                                color={task.color}
                                assignees={task.assignees}
                                onToggle={() => onToggle(task.id)}
                                onEdit={() => onEdit(task.id)}
                                onDelete={() => onDelete(task.id)}
                            />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
