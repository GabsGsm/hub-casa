import { Head, router, useForm } from '@inertiajs/react';
import { HelpCircle, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { ProgressBar } from '@/components/hub/progress-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '@/lib/inventory-constants';
import { ItemRow } from './components/item-row';

// ── Types ─────────────────────────────────────────────────────────────────────
type ShoppingItem = {
    id: number;
    name: string;
    quantity: string;
    unit: string;
    status: string; // 'pendente' | 'comprado' | 'impossibilitado'
    recurrence: string | null;
    category: string | null;
    priority: string; // 'normal' | 'high'
};

type ComprasProps = {
    items: ShoppingItem[];
};

type Filter = 'todos' | 'pendente' | 'comprado' | 'impossibilitado';

export default function Compras({ items }: ComprasProps) {
    const [filter, setFilter] = useState<Filter>('todos');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const [inlineValue, setInlineValue] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);
    const inlineRef = useRef<HTMLInputElement>(null);

    // ── Forms ────────────────────────────────────────────────────────────────
    const editForm = useForm({
        name: '',
        quantity: '1',
        unit: 'un',
        status: 'pendente',
        category: '',
        priority: 'normal',
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const total = items.length;
    const done = items.filter((i) => i.status === 'comprado').length;

    // ── Filtered items ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (filter === 'todos') return items;
        return items.filter((i) => i.status === filter);
    }, [items, filter]);

    const pendentes = filtered.filter((i) => i.status === 'pendente');
    const comprados = filtered.filter((i) => i.status === 'comprado');
    const impossibilitados = filtered.filter((i) => i.status === 'impossibilitado');

    // ── Handlers ──────────────────────────────────────────────────────────────
    function handleInlineAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!inlineValue.trim()) return;
        router.post('/compras', { name: inlineValue.trim() }, {
            preserveScroll: true,
            onSuccess: () => setInlineValue(''),
        });
    }

    function toggleStatus(item: ShoppingItem) {
        const next = item.status === 'comprado' ? 'pendente' : 'comprado';
        router.put(`/compras/${item.id}`, { status: next }, { preserveScroll: true });
    }

    function handleDelete(id: number, label: string) {
        setPendingDelete({
            action: () => router.delete(`/compras/${id}`, { preserveScroll: true }),
            label,
        });
    }

    function openEdit(item: ShoppingItem) {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            status: item.status,
            category: item.category ?? '',
            priority: item.priority,
        });
        setSheetOpen(true);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(`/compras/${editingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => { setEditingItem(null); setSheetOpen(false); },
        });
    }

    // ── Filter chips ──────────────────────────────────────────────────────────
    const filters: { key: Filter; label: string; count?: number }[] = [
        { key: 'todos', label: 'Todos', count: total },
        { key: 'pendente', label: 'Pendentes', count: items.filter(i => i.status === 'pendente').length },
        { key: 'comprado', label: 'Comprados', count: done },
        { key: 'impossibilitado', label: 'Impeditivos', count: items.filter(i => i.status === 'impossibilitado').length },
    ];

    const filterTooltips: Record<Filter, string> = {
        todos:           'Exibe todos os itens da lista de compras',
        pendente:        'Itens que ainda precisam ser comprados',
        comprado:        'Itens já adquiridos',
        impossibilitado: 'Itens que não puderam ser comprados (ex: indisponível, sem orçamento)',
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Compras', href: '/compras' },
        ]}>
            <Head title="Compras" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Compras</h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 cursor-help">
                                        <HelpCircle size={14} className="text-[#C8C7C3]" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Lista de compras compartilhada da casa. Marque itens como comprados ao adquiri-los.</TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-sm text-[#9B9A96]">Lista de compras da casa.</p>
                    </div>
                </div>

                {/* Progress */}
                {total > 0 && (
                    <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white px-5 py-4">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={14} className="text-[#059669]" />
                                <span className="text-sm font-medium text-[#1A1917]">Progresso</span>
                            </div>
                            <span className="font-mono text-sm text-[#059669]">
                                {done}/{total} comprados
                            </span>
                        </div>
                        <ProgressBar value={done} max={total} color="#059669" height={8} />
                    </div>
                )}

                {/* Inline add */}
                <form onSubmit={handleInlineAdd} className="flex items-center gap-2">
                    <Input
                        ref={inlineRef}
                        value={inlineValue}
                        onChange={(e) => setInlineValue(e.target.value)}
                        placeholder="Adicionar item... (Ex: Arroz 5kg)"
                        className="flex-1 rounded-[10px] border-[#E4E3E0] bg-white"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="submit" disabled={!inlineValue.trim()} className="gap-2 shrink-0">
                                <Plus size={14} />
                                Adicionar
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Adicionar item à lista de compras (ou pressione Enter)</TooltipContent>
                    </Tooltip>
                </form>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                    {filters.map(({ key, label, count }) => (
                        <Tooltip key={key}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setFilter(key)}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        filter === key
                                            ? 'bg-[#1A1917] text-white'
                                            : 'bg-[#F0EFED] text-[#6B6A67] hover:bg-[#E4E3E0]'
                                    }`}
                                >
                                    {label}
                                    {count !== undefined && (
                                        <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                                            filter === key ? 'bg-white/20' : 'bg-white text-[#9B9A96]'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{filterTooltips[key]}</TooltipContent>
                        </Tooltip>
                    ))}
                </div>

                {/* List */}
                <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[#9B9A96]">
                            Nenhum item na lista.
                        </div>
                    ) : (
                        <div>
                            {/* Pendentes */}
                            {pendentes.length > 0 && (
                                <div>
                                    {filter === 'todos' && (
                                        <div className="border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-2">
                                            <span className="text-xs font-medium uppercase tracking-wide text-[#6B6A67]">
                                                Pendentes · {pendentes.length}
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-2">
                                        {pendentes.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                onEdit={openEdit}
                                                onToggleStatus={toggleStatus}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Impossibilitados */}
                            {impossibilitados.length > 0 && (
                                <div>
                                    <div className={`border-b border-[#E4E3E0] bg-[#FFFBEB] px-5 py-2 ${pendentes.length > 0 ? 'border-t' : ''}`}>
                                        <span className="text-xs font-medium uppercase tracking-wide text-[#D97706]">
                                            Impeditivos · {impossibilitados.length}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        {impossibilitados.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                onEdit={openEdit}
                                                onToggleStatus={toggleStatus}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comprados */}
                            {comprados.length > 0 && (
                                <div>
                                    <div className={`border-b border-[#E4E3E0] bg-[#F0FDF4] px-5 py-2 ${pendentes.length > 0 || impossibilitados.length > 0 ? 'border-t' : ''}`}>
                                        <span className="text-xs font-medium uppercase tracking-wide text-[#15803D]">
                                            Comprados · {comprados.length}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        {comprados.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                onEdit={openEdit}
                                                onToggleStatus={toggleStatus}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sheet: Editar ────────────────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) setEditingItem(null); setSheetOpen(open); }}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Editar item</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submitEdit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                autoFocus
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Quantidade</Label>
                                <Input
                                    value={editForm.data.quantity}
                                    onChange={(e) => editForm.setData('quantity', e.target.value)}
                                />
                                <InputError message={editForm.errors.quantity} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unidade</Label>
                                <Select value={editForm.data.unit} onValueChange={(v) => editForm.setData('unit', v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNIT_OPTIONS.map((u) => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select
                                value={editForm.data.category || '__none__'}
                                onValueChange={(v) => editForm.setData('category', v === '__none__' ? '' : v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sem categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem categoria</SelectItem>
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Prioridade</Label>
                            <Select value={editForm.data.priority} onValueChange={(v) => editForm.setData('priority', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="comprado">Comprado</SelectItem>
                                    <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editingItem && (
                            <div className="mt-2 border-t border-[#F0EFED] pt-4">
                                <button
                                    type="button"
                                    onClick={() => { handleDelete(editingItem.id, editingItem.name); setSheetOpen(false); }}
                                    className="flex items-center gap-1.5 text-sm text-[#DC2626] hover:underline"
                                >
                                    <Trash2 size={13} />
                                    Remover item
                                </button>
                            </div>
                        )}

                        <SheetFooter>
                            <Button type="submit" disabled={editForm.processing}>
                                Salvar alterações
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ── Confirm: Remover item ─────────────────────────────────────── */}
            <ConfirmDialog
                open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}" da lista?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
