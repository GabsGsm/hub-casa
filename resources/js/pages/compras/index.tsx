import { Head, router, useForm } from '@inertiajs/react';
import { Ban, Check, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ProgressBar } from '@/components/hub/progress-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const UNIT_OPTIONS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz'];
const CATEGORY_OPTIONS = ['Alimentação', 'Limpeza', 'Higiene', 'Pet', 'Bebidas', 'Outros'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Compras({ items }: ComprasProps) {
    const [filter, setFilter] = useState<Filter>('todos');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const [inlineValue, setInlineValue] = useState('');
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

    function handleDelete(id: number) {
        if (!confirm('Remover este item?')) return;
        router.delete(`/compras/${id}`, { preserveScroll: true });
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

    // ── Item Row ──────────────────────────────────────────────────────────────
    function ItemRow({ item }: { item: ShoppingItem }) {
        const isPurchased = item.status === 'comprado';
        const isBlocked = item.status === 'impossibilitado';
        return (
            <div
                className="group flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F8F8F7]"
                onClick={() => openEdit(item)}
            >
                {/* Checkbox / blocked icon */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isPurchased
                            ? 'border-[#059669] bg-[#059669]'
                            : isBlocked
                              ? 'border-[#D97706] bg-[#D97706]'
                              : 'border-[#E4E3E0] hover:border-[#059669]'
                    }`}
                >
                    {isPurchased && <Check size={10} strokeWidth={3} className="text-white" />}
                    {isBlocked && <Ban size={10} strokeWidth={3} className="text-white" />}
                </button>

                {/* Priority dot */}
                {item.priority === 'high' && !isPurchased && !isBlocked && (
                    <div className="size-1.5 shrink-0 rounded-full bg-[#DC2626]" />
                )}

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                    <span className={`text-sm ${isPurchased ? 'text-[#9B9A96] line-through' : isBlocked ? 'text-[#D97706]' : 'text-[#1A1917]'}`}>
                        {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#9B9A96]">
                            {item.quantity} {item.unit}
                        </span>
                        {item.category && (
                            <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                                {item.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Delete */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                >
                    <Trash2 size={13} className="text-[#9B9A96]" />
                </button>
            </div>
        );
    }

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
                        <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Compras</h1>
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
                    <Button type="submit" disabled={!inlineValue.trim()} className="gap-2 shrink-0">
                        <Plus size={14} />
                        Adicionar
                    </Button>
                </form>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                    {filters.map(({ key, label, count }) => (
                        <button
                            key={key}
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
                                            <ItemRow key={item.id} item={item} />
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
                                            <ItemRow key={item.id} item={item} />
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
                                            <ItemRow key={item.id} item={item} />
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
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Quantidade</Label>
                                <Input
                                    value={editForm.data.quantity}
                                    onChange={(e) => editForm.setData('quantity', e.target.value)}
                                />
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
                                    onClick={() => { handleDelete(editingItem.id); setSheetOpen(false); }}
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
        </AppLayout>
    );
}
