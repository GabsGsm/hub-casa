import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    List,
    Plus,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { EventFormFields } from './components/event-form-fields';
import { EventRow } from './components/event-row';
import type { AgendaEvent, AgendaProps, EventFormData, View } from './types';
import {
    DAY_NAMES_FULL,
    DAY_NAMES_SHORT,
    formatDateBR,
    formatMonthYear,
    getDaysInMonth,
    getFirstDayOfWeek,
    todayStr,
} from './utils';

export default function Agenda({ events }: AgendaProps) {
    const today = todayStr();
    const [view, setView] = useState<View>('monthly');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);

    // Monthly state
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<string>(today);

    // Weekly state
    const [weekOffset, setWeekOffset] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

    // ── Create form ──────────────────────────────────────────────────────────
    const createForm = useForm<EventFormData>({
        title: '',
        description: '',
        date: today,
        time: '09:00',
    });

    const editForm = useForm<EventFormData>({
        title: '',
        description: '',
        date: today,
        time: '09:00',
    });

    // ── Events by date map ────────────────────────────────────────────────────
    const eventsByDate = useMemo(() => {
        const map: Record<string, AgendaEvent[]> = {};
        for (const ev of events) {
            map[ev.date] = map[ev.date] ?? [];
            map[ev.date].push(ev);
        }
        return map;
    }, [events]);

    // ── Week dates ────────────────────────────────────────────────────────────
    const weekDates = useMemo(() => {
        const todayDate = new Date(today + 'T00:00:00');
        const dayIndex = (todayDate.getDay() + 6) % 7; // Mon=0
        const monday = new Date(todayDate);
        monday.setDate(todayDate.getDate() - dayIndex + weekOffset * 7);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        });
    }, [today, weekOffset]);

    // ── Calendar grid ─────────────────────────────────────────────────────────
    const calendarGrid = useMemo(() => {
        const firstDow = getFirstDayOfWeek(calYear, calMonth);
        const daysInMonth = getDaysInMonth(calYear, calMonth);
        const cells: (number | null)[] = Array(firstDow).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [calYear, calMonth]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    function openCreate(date?: string) {
        setEditingEvent(null);
        createForm.reset();
        createForm.setData('date', date ?? today);
        setSheetOpen(true);
    }

    function openEdit(ev: AgendaEvent) {
        setEditingEvent(ev);
        editForm.setData({
            title: ev.title,
            description: ev.description ?? '',
            date: ev.date,
            time: ev.time,
        });
        setSheetOpen(true);
    }

    function handleDelete(id: number, label: string) {
        setPendingDelete({
            action: () => router.delete(`/agenda/${id}`, { preserveScroll: true }),
            label,
        });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/agenda', {
            preserveScroll: true,
            onSuccess: () => { createForm.reset(); setSheetOpen(false); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingEvent) return;
        editForm.put(`/agenda/${editingEvent.id}`, {
            preserveScroll: true,
            onSuccess: () => { setEditingEvent(null); setSheetOpen(false); },
        });
    }

    function prevMonth() {
        if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
        else setCalMonth(m => m - 1);
    }
    function nextMonth() {
        if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
        else setCalMonth(m => m + 1);
    }

    const selectedDayEvents = eventsByDate[selectedDay] ?? [];

    // ── Sorted events for list view ────────────────────────────────────────────
    const sortedEvents = useMemo(() =>
        [...events].sort((a, b) =>
            a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time),
        ),
        [events],
    );

    const weekLabel = useMemo(() => {
        if (weekDates.length === 0) return '';
        const first = weekDates[0];
        const last = weekDates[6];
        return `${formatDateBR(first)} – ${formatDateBR(last)}`;
    }, [weekDates]);

    // ── View toggle ───────────────────────────────────────────────────────────
    const views: { key: View; label: string; icon: React.ReactNode }[] = [
        { key: 'monthly', label: 'Mensal', icon: <CalendarDays size={14} /> },
        { key: 'weekly', label: 'Semanal', icon: <CalendarDays size={14} /> },
        { key: 'list', label: 'Lista', icon: <List size={14} /> },
    ];

    const viewTooltips: Record<View, string> = {
        monthly: 'Visualização mensal com calendário',
        weekly:  'Visualização semanal com colunas por dia',
        list:    'Lista de todos os compromissos em ordem cronológica',
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Agenda', href: '/agenda' },
        ]}>
            <Head title="Agenda" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Agenda</h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 cursor-help">
                                        <HelpCircle size={14} className="text-[#C8C7C3]" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Cadastre e visualize compromissos e eventos da casa.</TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-sm text-[#9B9A96]">Compromissos e eventos da casa.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View switcher */}
                        <div className="flex items-center rounded-[8px] border border-[#E4E3E0] bg-white p-0.5">
                            {views.map(({ key, label, icon }) => (
                                <Tooltip key={key}>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setView(key)}
                                            className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                                                view === key
                                                    ? 'bg-[#1A1917] text-white'
                                                    : 'text-[#6B6A67] hover:text-[#1A1917]'
                                            }`}
                                        >
                                            {icon}
                                            {label}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{viewTooltips[key]}</TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => openCreate()} className="gap-2">
                                    <Plus size={14} />
                                    Novo compromisso
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Adicionar um novo evento ou compromisso à agenda</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* ── MENSAL ─────────────────────────────────────────────────── */}
                {view === 'monthly' && (
                    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                        {/* Calendar */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            {/* Month nav */}
                            <div className="flex items-center justify-between border-b border-[#E4E3E0] px-5 py-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" onClick={prevMonth} className="flex size-7 items-center justify-center rounded-[6px] hover:bg-[#F0EFED]">
                                            <ChevronLeft size={16} className="text-[#6B6A67]" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Mês anterior</TooltipContent>
                                </Tooltip>
                                <span className="font-medium text-[#1A1917]">
                                    {formatMonthYear(calYear, calMonth)}
                                </span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" onClick={nextMonth} className="flex size-7 items-center justify-center rounded-[6px] hover:bg-[#F0EFED]">
                                            <ChevronRight size={16} className="text-[#6B6A67]" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Próximo mês</TooltipContent>
                                </Tooltip>
                            </div>
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-[#E4E3E0]">
                                {DAY_NAMES_SHORT.map((d) => (
                                    <div key={d} className="py-2 text-center text-xs font-medium uppercase tracking-wide text-[#9B9A96]">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            {/* Calendar cells */}
                            <div className="grid grid-cols-7">
                                {calendarGrid.map((day, i) => {
                                    if (!day) {
                                        return <div key={`empty-${i}`} className="h-14 border-b border-r border-[#F0EFED] last:border-r-0" />;
                                    }
                                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isToday = dateStr === today;
                                    const isSelected = dateStr === selectedDay;
                                    const dayEvents = eventsByDate[dateStr] ?? [];
                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => setSelectedDay(dateStr)}
                                            className={`relative flex h-14 flex-col items-start justify-start border-b border-r border-[#F0EFED] p-1.5 text-left transition-colors last:border-r-0 hover:bg-[#F8F8F7] ${isSelected ? 'bg-[#EFF6FF]' : ''}`}
                                        >
                                            <span className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-[#1A1917] text-white' : isSelected ? 'text-[#2563EB]' : 'text-[#3D3C3A]'}`}>
                                                {day}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <div className="mt-0.5 flex flex-wrap gap-0.5">
                                                    {dayEvents.slice(0, 2).map((ev) => (
                                                        <div key={ev.id} className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <span className="font-mono text-[9px] text-[#9B9A96]">+{dayEvents.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Side panel */}
                        <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                            <div className="flex items-center justify-between border-b border-[#E4E3E0] px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-[#1A1917]">
                                        {selectedDay === today ? 'Hoje' : formatDateBR(selectedDay)}
                                    </p>
                                    <p className="text-xs text-[#9B9A96]">
                                        {selectedDayEvents.length} compromisso{selectedDayEvents.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openCreate(selectedDay)}
                                    className="flex size-7 items-center justify-center rounded-[6px] hover:bg-[#F0EFED]"
                                >
                                    <Plus size={14} className="text-[#6B6A67]" />
                                </button>
                            </div>
                            <div className="p-2">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-[#9B9A96]">
                                        Nenhum compromisso.
                                    </div>
                                ) : (
                                    selectedDayEvents
                                        .slice()
                                        .sort((a, b) => a.time.localeCompare(b.time))
                                        .map((ev) => (
                                            <EventRow key={ev.id} event={ev} onEdit={openEdit} onDelete={handleDelete} />
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEMANAL ────────────────────────────────────────────────── */}
                {view === 'weekly' && (
                    <div className="flex flex-col gap-4">
                        {/* Week nav */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" onClick={() => setWeekOffset(w => w - 1)} className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] hover:bg-[#F0EFED]">
                                        <ChevronLeft size={14} className="text-[#6B6A67]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Semana anterior</TooltipContent>
                            </Tooltip>
                            <span className="font-mono text-sm text-[#3D3C3A]">{weekLabel}</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" onClick={() => setWeekOffset(w => w + 1)} className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] hover:bg-[#F0EFED]">
                                        <ChevronRight size={14} className="text-[#6B6A67]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Próxima semana</TooltipContent>
                            </Tooltip>
                            {weekOffset !== 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" onClick={() => setWeekOffset(0)} className="text-xs text-[#9B9A96] hover:text-[#1A1917]">
                                            Hoje
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Voltar para a semana atual</TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* 7-day columns */}
                        <div className="overflow-x-auto">
                            <div className="flex min-w-[700px] gap-2">
                                {weekDates.map((dateStr, i) => {
                                    const isToday = dateStr === today;
                                    const dayEvents = (eventsByDate[dateStr] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
                                    const [, , dd] = dateStr.split('-');
                                    return (
                                        <div key={dateStr} className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-[#E4E3E0] bg-white">
                                            {/* Day header */}
                                            <div className={`flex items-center justify-between border-b border-[#E4E3E0] px-3 py-2 ${isToday ? 'bg-[#1A1917]' : ''}`}>
                                                <div>
                                                    <p className={`text-[10px] uppercase tracking-widest ${isToday ? 'text-[#9B9A96]' : 'text-[#9B9A96]'}`}>
                                                        {DAY_NAMES_FULL[i === 6 ? 0 : i + 1].slice(0, 3).toUpperCase()}
                                                    </p>
                                                    <p className={`text-lg font-medium leading-none ${isToday ? 'text-white' : 'text-[#3D3C3A]'}`}>
                                                        {parseInt(dd)}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => openCreate(dateStr)}
                                                    className={`flex size-6 items-center justify-center rounded-[4px] transition-colors ${isToday ? 'hover:bg-white/10 text-white' : 'hover:bg-[#F0EFED] text-[#9B9A96]'}`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            {/* Events */}
                                            <div className="flex flex-1 flex-col gap-1 p-1.5">
                                                {dayEvents.length === 0 ? (
                                                    <div className="py-3 text-center text-[10px] text-[#C8C7C3]">vazio</div>
                                                ) : (
                                                    dayEvents.map((ev) => (
                                                        <button
                                                            key={ev.id}
                                                            type="button"
                                                            onClick={() => openEdit(ev)}
                                                            className="rounded-[6px] bg-[#FFF7ED] px-2 py-1.5 text-left transition-colors hover:bg-[#FED7AA]"
                                                        >
                                                            <p className="truncate text-[11px] font-medium text-[#92400E]">{ev.title}</p>
                                                            <p className="font-mono text-[10px] text-[#D97706]">{ev.time}</p>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LISTA ──────────────────────────────────────────────────── */}
                {view === 'list' && (
                    <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                        {sortedEvents.length === 0 ? (
                            <div className="py-12 text-center text-sm text-[#9B9A96]">
                                Nenhum compromisso cadastrado.
                            </div>
                        ) : (
                            <div>
                                {sortedEvents.map((ev, i) => {
                                    const prevDate = i > 0 ? sortedEvents[i - 1].date : null;
                                    const showDateHeader = ev.date !== prevDate;
                                    const isToday = ev.date === today;
                                    return (
                                        <div key={ev.id}>
                                            {showDateHeader && (
                                                <div className={`border-b border-[#E4E3E0] px-5 py-2 ${isToday ? 'bg-[#1A1917]' : 'bg-[#F8F8F7]'}`}>
                                                    <span className={`text-xs font-medium uppercase tracking-wide ${isToday ? 'text-white' : 'text-[#6B6A67]'}`}>
                                                        {isToday ? 'Hoje · ' : ''}{formatDateBR(ev.date)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="border-b border-[#F0EFED] px-3 last:border-0">
                                                <EventRow event={ev} onEdit={openEdit} onDelete={handleDelete} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Sheet: Criar / Editar ───────────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={(open) => {
                if (!open) { setEditingEvent(null); }
                setSheetOpen(open);
            }}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{editingEvent ? 'Editar compromisso' : 'Novo compromisso'}</SheetTitle>
                    </SheetHeader>
                    <form
                        onSubmit={editingEvent ? submitEdit : submitCreate}
                        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
                    >
                        {editingEvent ? (
                            <EventFormFields
                                data={editForm.data}
                                errors={editForm.errors}
                                setData={(k, v) => editForm.setData(k, v)}
                            />
                        ) : (
                            <EventFormFields
                                data={createForm.data}
                                errors={createForm.errors}
                                setData={(k, v) => createForm.setData(k, v)}
                            />
                        )}

                        {editingEvent && (
                            <div className="mt-2 border-t border-[#F0EFED] pt-4">
                                <button
                                    type="button"
                                    onClick={() => { handleDelete(editingEvent.id, editingEvent.title); setSheetOpen(false); }}
                                    className="flex items-center gap-1.5 text-sm text-[#DC2626] hover:underline"
                                >
                                    <Trash2 size={13} />
                                    Remover compromisso
                                </button>
                            </div>
                        )}

                        <SheetFooter>
                            <Button
                                type="submit"
                                disabled={editingEvent ? editForm.processing : createForm.processing}
                            >
                                {editingEvent ? 'Salvar alterações' : 'Criar compromisso'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ── Confirm: Remover compromisso ─────────────────────────────────── */}
            <ConfirmDialog
                open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}"?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
