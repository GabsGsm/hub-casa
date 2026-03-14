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
import { Plus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { TaskCard } from '@/components/hub/task-card';
import { TaskColumn } from '@/components/hub/task-column';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

const colorPresets = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#6B6A67'];

// ── Assignee Multi-select ──────────────────────────────────────────────────────
function AssigneeSelect({
    members,
    selected,
    onChange,
}: {
    members: { id: number; name: string }[];
    selected: number[];
    onChange: (ids: number[]) => void;
}) {
    function toggle(id: number) {
        if (selected.includes(id)) {
            onChange(selected.filter((s) => s !== id));
        } else {
            onChange([...selected, id]);
        }
    }
    return (
        <div className="flex flex-wrap gap-2">
            {members.map((m) => {
                const active = selected.includes(m.id);
                const initials = m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        title={m.name}
                        className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                            active
                                ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]'
                                : 'border-[#E4E3E0] bg-white text-[#6B6A67] hover:border-[#C8C7C3]'
                        }`}
                    >
                        <span
                            className="flex size-4 items-center justify-center rounded-full text-white"
                            style={{ fontSize: 8, background: active ? '#7C3AED' : '#9B9A96' }}
                        >
                            {initials}
                        </span>
                        {m.name.split(' ')[0]}
                        {active && <X size={10} />}
                    </button>
                );
            })}
        </div>
    );
}

// ── Inline Add Row ──────────────────────────────────────────────────────────────
function InlineAdd({
    dayIndex,
    onAdd,
}: {
    dayIndex: number;
    onAdd: (title: string, dayIndex: number) => void;
}) {
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function Tarefas({ tasks: initialTasks, members, weekLabel }: TarefasProps) {
    const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editAssignees, setEditAssignees] = useState<number[]>([]);

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

    const todayDayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

    // ── Inline add ───────────────────────────────────────────────────────────
    function handleInlineAdd(title: string, dayIndex: number) {
        router.post('/tarefas', { title, day_of_week: dayIndex, color: '#7C3AED' }, {
            preserveScroll: true,
        });
    }

    // ── Edit ─────────────────────────────────────────────────────────────────
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
        router.put(
            `/tarefas/${editingTask.id}`,
            { ...editForm.data, assignee_ids: editAssignees },
            {
                preserveScroll: true,
                onSuccess: () => setEditingTask(null),
            },
        );
    }

    // ── Toggle + Delete ───────────────────────────────────────────────────────
    function toggleTask(id: number) {
        const task = localTasks.find((t) => t.id === id);
        if (!task) return;
        setLocalTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
        router.put(`/tarefas/${id}`, { completed: !task.completed }, { preserveScroll: true });
    }

    function deleteTask(id: number) {
        if (!window.confirm('Remover esta tarefa?')) return;
        router.delete(`/tarefas/${id}`, { preserveScroll: true });
    }

    // ── DnD ──────────────────────────────────────────────────────────────────
    function handleDragStart(event: DragStartEvent) {
        const task = localTasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
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
            return;
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
                        <div className="text-[28px] font-semibold leading-tight text-[#1A1917]">Tarefas</div>
                        <div className="font-mono text-sm text-[#9B9A96]">Semana {weekLabel}</div>
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
                            {dayLabels.map((label, index) => (
                                <div key={label} className="flex flex-1 flex-col" style={{ minWidth: 140 }}>
                                    <TaskColumn
                                        dayIndex={index}
                                        label={label}
                                        dateLabel={weekDates[index]}
                                        isToday={index === todayDayIndex}
                                        tasks={grouped[index] ?? []}
                                        onToggle={toggleTask}
                                        onEdit={startEdit}
                                        onDelete={deleteTask}
                                    />
                                    {/* Inline add */}
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
            <Sheet open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Editar tarefa</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submitEdit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <div className="grid gap-2">
                            <Label>Título</Label>
                            <Input
                                autoFocus
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Dia</Label>
                            <select
                                className="h-9 rounded-md border border-[#E4E3E0] bg-white px-3 text-sm text-[#1A1917]"
                                value={editForm.data.day_of_week}
                                onChange={(e) => editForm.setData('day_of_week', Number(e.target.value))}
                            >
                                {dayLabels.map((label, i) => (
                                    <option key={label} value={i}>{label}</option>
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
                                        onClick={() => editForm.setData('color', c)}
                                        className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: c,
                                            borderColor: editForm.data.color === c ? c : 'transparent',
                                            outline: editForm.data.color === c ? `2px solid ${c}` : 'none',
                                            outlineOffset: '2px',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                placeholder="Detalhes da tarefa..."
                                rows={3}
                            />
                        </div>
                        {members.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Responsáveis</Label>
                                <AssigneeSelect
                                    members={members}
                                    selected={editAssignees}
                                    onChange={setEditAssignees}
                                />
                            </div>
                        )}

                        {editingTask && (
                            <div className="mt-2 border-t border-[#F0EFED] pt-4">
                                <button
                                    type="button"
                                    onClick={() => { deleteTask(editingTask.id); setEditingTask(null); }}
                                    className="text-sm text-[#DC2626] hover:underline"
                                >
                                    Remover tarefa
                                </button>
                            </div>
                        )}

                        <SheetFooter>
                            <Button
                                type="submit"
                                disabled={!editForm.data.title.trim() || editForm.processing}
                            >
                                Salvar alterações
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
