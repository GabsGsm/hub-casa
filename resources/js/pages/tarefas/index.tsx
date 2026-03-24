import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Head, router, useForm } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { TaskCard } from '@/components/hub/task-card';
import { TaskColumn } from '@/components/hub/task-column';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { InlineAdd } from './components/inline-add';
import { TaskEditSheet } from './components/task-edit-sheet';
import { DAY_LABELS } from './constants';

type Task = {
    id: number;
    title: string;
    description: string | null;
    color: string | null;
    day_of_week: number;
    sort_order: number;
    completed: boolean;
    assignees: { id: number; name: string }[];
};

type TarefasProps = {
    house: { id: number; name: string };
    tasks: Task[];
    members: { id: number; name: string }[];
};

// ── Week helpers ──────────────────────────────────────────────────────────────
function getWeekInfo(offset: number) {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + offset * 7);
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
    const start = days[0].getDate();
    const end = days[6].getDate();
    const month = days[0].toLocaleDateString('pt-BR', { month: 'long' });
    return {
        dateLabels: days.map((d) => d.getDate().toString()),
        label: `${start}–${end} de ${month}`,
    };
}

export default function Tarefas({ tasks: initialTasks, members }: TarefasProps) {
    const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [dragOriginDay, setDragOriginDay] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

    // Sync local state with server data after each successful Inertia visit
    useEffect(() => {
        setLocalTasks(initialTasks);
    }, [initialTasks]);

    const { dateLabels, label: weekLabel } = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);
    const todayDayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

    const editForm = useForm({
        title: '',
        day_of_week: 0,
        color: '#7C3AED',
        description: '',
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const grouped = useMemo(() => {
        const groups = localTasks.reduce<Record<number, Task[]>>((acc, task) => {
            acc[task.day_of_week] = acc[task.day_of_week] ?? [];
            acc[task.day_of_week].push(task);
            return acc;
        }, {});
        Object.values(groups).forEach((list) => list.sort((a, b) => a.sort_order - b.sort_order));
        return groups;
    }, [localTasks]);

    // ── Inline add ────────────────────────────────────────────────────────────
    function handleInlineAdd(title: string, dayIndex: number) {
        router.post('/tarefas', { title, day_of_week: dayIndex, color: '#7C3AED' }, {
            preserveScroll: true,
        });
    }

    // ── Edit ──────────────────────────────────────────────────────────────────
    function startEdit(id: number) {
        const task = localTasks.find((t) => t.id === id);
        if (!task) return;
        setEditingTask(task);
        setEditAssignees(task.assignees.map((a) => a.id));
        editForm.setData({
            title: task.title,
            day_of_week: task.day_of_week,
            color: task.color ?? '#7C3AED',
            description: task.description ?? '',
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTask) return;
        editForm.transform((d) => ({ ...d, assignee_ids: editAssignees }));
        editForm.put(`/tarefas/${editingTask.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingTask(null),
        });
    }

    // ── Toggle + Delete ───────────────────────────────────────────────────────
    function toggleTask(id: number) {
        const task = localTasks.find((t) => t.id === id);
        if (!task) return;
        setLocalTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
        router.put(`/tarefas/${id}`, { completed: !task.completed }, { preserveScroll: true });
    }

    function deleteTask(id: number) {
        const task = localTasks.find((t) => t.id === id);
        setPendingDelete({
            action: () => router.delete(`/tarefas/${id}`, { preserveScroll: true }),
            label: task?.title ?? 'esta tarefa',
        });
    }

    // ── DnD ───────────────────────────────────────────────────────────────────
    function handleDragStart(event: DragStartEvent) {
        const task = localTasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
        setDragOriginDay(task?.day_of_week ?? null);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const activeId = active.id as number;
        const overId = over.id;
        const targetDay = String(overId).startsWith('col-')
            ? Number(String(overId).replace('col-', ''))
            : localTasks.find((t) => t.id === overId)?.day_of_week;
        if (targetDay === undefined) return;
        const activeTask = localTasks.find((t) => t.id === activeId);
        if (!activeTask || activeTask.day_of_week === targetDay) return;
        setLocalTasks((prev) =>
            prev.map((t) => t.id === activeId ? { ...t, day_of_week: targetDay, sort_order: 9999 } : t),
        );
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);
        setDragOriginDay(null);
        if (!over) return;
        const activeId = active.id as number;
        const overId = over.id;
        const activeTaskCurrent = localTasks.find((t) => t.id === activeId);
        if (!activeTaskCurrent) return;
        const targetDay = String(overId).startsWith('col-')
            ? Number(String(overId).replace('col-', ''))
            : localTasks.find((t) => t.id === overId)?.day_of_week ?? activeTaskCurrent.day_of_week;
        const targetColumnTasks = localTasks
            .filter((t) => t.id !== activeId && t.day_of_week === targetDay)
            .sort((a, b) => a.sort_order - b.sort_order);
        let newSortOrder: number;
        if (String(overId).startsWith('col-')) {
            newSortOrder = targetColumnTasks.length > 0 ? targetColumnTasks[targetColumnTasks.length - 1].sort_order + 1 : 0;
        } else if (activeId === Number(overId)) {
            // dropped on self — skip apenas se a coluna não mudou
            if (activeTaskCurrent.day_of_week === dragOriginDay) return;
            newSortOrder = targetColumnTasks.length > 0
                ? targetColumnTasks[targetColumnTasks.length - 1].sort_order + 1
                : 0;
        } else {
            const overIndex = targetColumnTasks.findIndex((t) => t.id === Number(overId));
            newSortOrder = overIndex !== -1 ? targetColumnTasks[overIndex].sort_order - 0.5 : targetColumnTasks.length > 0 ? targetColumnTasks[targetColumnTasks.length - 1].sort_order + 1 : 0;
        }
        if (activeTaskCurrent.day_of_week === targetDay && !String(overId).startsWith('col-')) {
            const columnTasks = localTasks.filter((t) => t.day_of_week === targetDay).sort((a, b) => a.sort_order - b.sort_order);
            const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
            const newIndex = columnTasks.findIndex((t) => t.id === Number(overId));
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(columnTasks, oldIndex, newIndex);
                setLocalTasks((prev) => {
                    const others = prev.filter((t) => t.day_of_week !== targetDay);
                    return [...others, ...reordered.map((t, i) => ({ ...t, sort_order: i }))];
                });
                newSortOrder = newIndex;
            }
        } else {
            setLocalTasks((prev) =>
                prev.map((t) => t.id === activeId ? { ...t, day_of_week: targetDay, sort_order: newSortOrder } : t),
            );
        }
        router.patch(
            `/tarefas/${activeId}/move`,
            { day_of_week: targetDay, sort_order: Math.round(newSortOrder) },
            { preserveScroll: true, onError: () => setLocalTasks(initialTasks) },
        );
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Tarefas', href: '/tarefas' },
        ]}>
            <Head title="Tarefas" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <div className="text-[28px] font-semibold leading-tight text-[#1A1917]">Tarefas</div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 cursor-help">
                                        <HelpCircle size={14} className="text-[#C8C7C3]" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Organize as tarefas da casa por dia da semana. Arraste e solte para reorganizar ou mudar de dia.</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="font-mono text-sm text-[#9B9A96]">{weekLabel}</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setWeekOffset((w) => w - 1)}
                                    className="flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                >
                                    ← Anterior
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Semana anterior</TooltipContent>
                        </Tooltip>
                        {weekOffset !== 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setWeekOffset(0)}
                                        className="rounded-[6px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                    >
                                        Hoje
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Voltar para a semana atual</TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setWeekOffset((w) => w + 1)}
                                    className="flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-sm text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                >
                                    Próxima →
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Próxima semana</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Kanban board */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-x-auto">
                        <div className="flex gap-2 pb-2" style={{ minWidth: 980 }}>
                            {DAY_LABELS.map((label, index) => (
                                <div key={label} className="flex flex-1 flex-col" style={{ minWidth: 140 }}>
                                    <TaskColumn
                                        dayIndex={index}
                                        label={label}
                                        dateLabel={dateLabels[index]}
                                        isToday={weekOffset === 0 && index === todayDayIndex}
                                        tasks={grouped[index] ?? []}
                                        onToggle={toggleTask}
                                        onEdit={startEdit}
                                        onDelete={deleteTask}
                                    />
                                    <div className="px-1 pb-2">
                                        <InlineAdd dayIndex={index} onAdd={handleInlineAdd} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeTask ? (
                            <TaskCard
                                id={activeTask.id}
                                title={activeTask.title}
                                description={activeTask.description}
                                completed={activeTask.completed}
                                color={activeTask.color}
                                assignees={activeTask.assignees}
                                overlay
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* ── Sheet: Editar Tarefa ──────────────────────────────────────── */}
            <TaskEditSheet
                task={editingTask}
                members={members}
                data={editForm.data}
                errors={editForm.errors}
                processing={editForm.processing}
                assigneeIds={editAssignees}
                setData={(k, v) => editForm.setData(k as any, v as any)}
                onAssigneesChange={setEditAssignees}
                onClose={() => setEditingTask(null)}
                onSubmit={submitEdit}
                onDelete={deleteTask}
            />

            {/* ── Confirm: Remover Tarefa ───────────────────────────────────── */}
            <ConfirmDialog
                open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}"?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
