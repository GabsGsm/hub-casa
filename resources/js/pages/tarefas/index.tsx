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
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TaskCard } from '@/components/hub/task-card';
import { TaskColumn } from '@/components/hub/task-column';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

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
    weekLabel: string;
};

const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

const colorPresets = [
    '#7C3AED',
    '#2563EB',
    '#059669',
    '#D97706',
    '#DC2626',
    '#6B6A67',
];

type FormData = {
    title: string;
    day_of_week: number;
    color: string;
    description: string;
};

function TaskFormFields({
    data,
    setData,
    showDescription = false,
}: {
    data: FormData;
    setData: (key: string, value: string | number) => void;
    showDescription?: boolean;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="task-title">Título</Label>
                <Input
                    id="task-title"
                    autoFocus
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Ex: Limpar cozinha"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="task-day">Dia</Label>
                <select
                    id="task-day"
                    className="h-9 rounded-md border border-[var(--hc-gray-200)] bg-white px-3 text-sm text-[var(--hc-gray-900)]"
                    value={data.day_of_week}
                    onChange={(e) => setData('day_of_week', Number(e.target.value))}
                >
                    {dayLabels.map((label, index) => (
                        <option key={label} value={index}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid gap-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-2">
                    {colorPresets.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setData('color', c)}
                            className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                                backgroundColor: c,
                                borderColor: data.color === c ? c : 'transparent',
                                outline: data.color === c ? `2px solid ${c}` : 'none',
                                outlineOffset: '2px',
                            }}
                        />
                    ))}
                </div>
            </div>
            {showDescription && (
                <div className="grid gap-2">
                    <Label htmlFor="task-desc">Descrição (opcional)</Label>
                    <Textarea
                        id="task-desc"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Detalhes da tarefa..."
                        rows={3}
                    />
                </div>
            )}
        </>
    );
}

export default function Tarefas({ tasks: initialTasks, weekLabel }: TarefasProps) {
    const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const taskForm = useForm({
        title: '',
        day_of_week: 0,
        color: '#7C3AED',
        description: '',
    });

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
        Object.values(groups).forEach((list) =>
            list.sort((a, b) => a.sort_order - b.sort_order),
        );
        return groups;
    }, [localTasks]);

    const weekDates = useMemo(() => {
        const today = new Date();
        const dayIndex = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayIndex);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.getDate().toString();
        });
    }, []);

    function submitTask(e: React.FormEvent) {
        e.preventDefault();
        taskForm.post('/tarefas', {
            preserveScroll: true,
            onSuccess: () => {
                taskForm.reset();
                setDialogOpen(false);
            },
        });
    }

    function startEdit(id: number) {
        const task = localTasks.find((t) => t.id === id);
        if (!task) return;
        setEditingTask(task);
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
        editForm.put(`/tarefas/${editingTask.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingTask(null),
        });
    }

    function deleteTask(id: number) {
        if (!window.confirm('Remover esta tarefa?')) return;
        router.delete(`/tarefas/${id}`, { preserveScroll: true });
    }

    function toggleTask(id: number) {
        const task = localTasks.find((t) => t.id === id);
        if (!task) return;
        setLocalTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        );
        router.put(`/tarefas/${id}`, { completed: !task.completed }, { preserveScroll: true });
    }

    function handleDragStart(event: DragStartEvent) {
        const task = localTasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Detect target column
        const targetDay = String(overId).startsWith('col-')
            ? Number(String(overId).replace('col-', ''))
            : localTasks.find((t) => t.id === overId)?.day_of_week;

        if (targetDay === undefined) return;

        const activeTask = localTasks.find((t) => t.id === activeId);
        if (!activeTask || activeTask.day_of_week === targetDay) return;

        // Move task to new column (optimistic)
        setLocalTasks((prev) => {
            const updated = prev.map((t) =>
                t.id === activeId
                    ? { ...t, day_of_week: targetDay, sort_order: 9999 }
                    : t,
            );
            return updated;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        const activeTaskCurrent = localTasks.find((t) => t.id === activeId);
        if (!activeTaskCurrent) return;

        // Determine target day
        const targetDay = String(overId).startsWith('col-')
            ? Number(String(overId).replace('col-', ''))
            : localTasks.find((t) => t.id === overId)?.day_of_week ??
              activeTaskCurrent.day_of_week;

        // Determine new sort order within target column
        const targetColumnTasks = localTasks
            .filter((t) => t.id !== activeId && t.day_of_week === targetDay)
            .sort((a, b) => a.sort_order - b.sort_order);

        let newSortOrder: number;

        if (String(overId).startsWith('col-')) {
            // Dropped onto column → append
            newSortOrder =
                targetColumnTasks.length > 0
                    ? targetColumnTasks[targetColumnTasks.length - 1].sort_order + 1
                    : 0;
        } else if (activeId === Number(overId)) {
            // Same spot
            return;
        } else {
            // Dropped onto another task — reorder within same or different column
            const overIndex = targetColumnTasks.findIndex((t) => t.id === Number(overId));
            if (overIndex !== -1) {
                newSortOrder = targetColumnTasks[overIndex].sort_order - 0.5;
            } else {
                newSortOrder =
                    targetColumnTasks.length > 0
                        ? targetColumnTasks[targetColumnTasks.length - 1].sort_order + 1
                        : 0;
            }
        }

        // Update same-column order with arrayMove when staying in same column
        if (activeTaskCurrent.day_of_week === targetDay && !String(overId).startsWith('col-')) {
            const columnTasks = localTasks
                .filter((t) => t.day_of_week === targetDay)
                .sort((a, b) => a.sort_order - b.sort_order);
            const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
            const newIndex = columnTasks.findIndex((t) => t.id === Number(overId));
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(columnTasks, oldIndex, newIndex);
                setLocalTasks((prev) => {
                    const others = prev.filter((t) => t.day_of_week !== targetDay);
                    return [
                        ...others,
                        ...reordered.map((t, i) => ({ ...t, sort_order: i })),
                    ];
                });
                newSortOrder = newIndex;
            }
        } else {
            setLocalTasks((prev) =>
                prev.map((t) =>
                    t.id === activeId
                        ? { ...t, day_of_week: targetDay, sort_order: newSortOrder }
                        : t,
                ),
            );
        }

        router.patch(
            `/tarefas/${activeId}/move`,
            { day_of_week: targetDay, sort_order: Math.round(newSortOrder) },
            {
                preserveScroll: true,
                onError: () => setLocalTasks(initialTasks),
            },
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Tarefas', href: '/tarefas' },
            ]}
        >
            <Head title="Tarefas" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="text-[28px] font-semibold leading-tight text-[var(--hc-gray-900)]">
                            Tarefas
                        </div>
                        <div className="font-mono text-sm text-[var(--hc-gray-400)]">
                            Semana {weekLabel}
                        </div>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Nova tarefa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Nova tarefa</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitTask} className="grid gap-4 pt-2">
                                <TaskFormFields
                                    data={taskForm.data}
                                    setData={(k, v) => taskForm.setData(k as any, v)}
                                />
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={!taskForm.data.title.trim() || taskForm.processing}
                                    >
                                        Adicionar tarefa
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit dialog */}
                    <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Editar tarefa</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitEdit} className="grid gap-4 pt-2">
                                <TaskFormFields
                                    data={editForm.data}
                                    setData={(k, v) => editForm.setData(k as any, v)}
                                    showDescription
                                />
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={!editForm.data.title.trim() || editForm.processing}
                                    >
                                        Salvar alterações
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Kanban board with DnD */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-2">
                            {dayLabels.map((label, index) => (
                                <TaskColumn
                                    key={label}
                                    dayIndex={index}
                                    label={label}
                                    dateLabel={weekDates[index]}
                                    tasks={grouped[index] ?? []}
                                    onToggle={toggleTask}
                                    onEdit={startEdit}
                                    onDelete={deleteTask}
                                />
                            ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeTask ? (
                            <TaskCard
                                id={activeTask.id}
                                title={activeTask.title}
                                completed={activeTask.completed}
                                color={activeTask.color}
                                assignees={activeTask.assignees}
                                overlay
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </AppLayout>
    );
}
