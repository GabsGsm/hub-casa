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
    tasks: Task[];
    onToggle: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
};

export function TaskColumn({
    dayIndex,
    label,
    dateLabel,
    tasks,
    onToggle,
    onEdit,
    onDelete,
}: TaskColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: `col-${dayIndex}` });

    return (
        <div className="flex min-w-[180px] flex-col gap-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.08em] text-[var(--hc-gray-400)]">
                        {label}
                    </div>
                    <div className="font-mono text-lg font-semibold text-[var(--hc-gray-700)]">
                        {dateLabel}
                    </div>
                </div>
                <span className="rounded-full bg-[var(--hc-gray-100)] px-2 py-0.5 font-mono text-xs text-[var(--hc-gray-500)]">
                    {tasks.length}
                </span>
            </div>

            <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex min-h-[80px] flex-col gap-3 rounded-md transition-colors"
                    style={{
                        backgroundColor: isOver
                            ? 'var(--hc-gray-100)'
                            : undefined,
                    }}
                >
                    {tasks.length === 0 ? (
                        <div className="rounded-md border border-dashed border-[var(--hc-gray-200)] p-3 text-xs text-[var(--hc-gray-400)]">
                            Nenhuma tarefa
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
