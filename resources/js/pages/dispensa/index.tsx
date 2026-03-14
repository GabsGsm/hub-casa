import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
type PantryItem = {
    id: number;
    name: string;
    quantity_current: number;
    quantity_min: number;
    unit: string;
    category: string | null;
    updated_at: string | null;
};

type DispensaProps = {
    items: PantryItem[];
};

const UNIT_OPTIONS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz'];
const CATEGORY_OPTIONS = ['Alimentação', 'Limpeza', 'Higiene', 'Pet', 'Bebidas', 'Outros'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dispensa({ items }: DispensaProps) {
    const [categoryFilter, setCategoryFilter] = useState<string>('todos');
    const [createOpen, setCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // ── Create form ───────────────────────────────────────────────────────────
    const createForm = useForm({
        name: '',
        quantity_current: '',
        quantity_min: '',
        unit: 'un',
        category: '',
    });

    // ── Edit form ─────────────────────────────────────────────────────────────
    const editForm = useForm({
        name: '',
        quantity_current: '',
        quantity_min: '',
        unit: 'un',
        category: '',
    });

    // ── Low stock items ───────────────────────────────────────────────────────
    const lowStockItems = useMemo(
        () => items.filter((i) => i.quantity_current <= i.quantity_min),
        [items],
    );

    // ── Categories ────────────────────────────────────────────────────────────
    const usedCategories = useMemo(() => {
        const cats = new Set<string>();
        for (const item of items) {
            if (item.category) cats.add(item.category);
        }
        return Array.from(cats).sort();
    }, [items]);

    // ── Filtered ─────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (categoryFilter === 'todos') return items;
        if (categoryFilter === 'baixo') return lowStockItems;
        return items.filter((i) => i.category === categoryFilter);
    }, [items, categoryFilter, lowStockItems]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    function openEdit(item: PantryItem) {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            quantity_current: String(item.quantity_current),
            quantity_min: String(item.quantity_min),
            unit: item.unit,
            category: item.category ?? '',
        });
        setSheetOpen(true);
    }

    function adjustQty(item: PantryItem, delta: number) {
        const newQty = Math.max(0, item.quantity_current + delta);
        router.put(`/dispensa/${item.id}`, { quantity_current: newQty }, { preserveScroll: true });
    }

    function handleDelete(id: number) {
        if (!confirm('Remover este item da dispensa?')) return;
        router.delete(`/dispensa/${id}`, { preserveScroll: true });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/dispensa', {
            preserveScroll: true,
            onSuccess: () => { createForm.reset(); setCreateOpen(false); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(`/dispensa/${editingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => { setEditingItem(null); setSheetOpen(false); },
        });
    }

    // ── Filter chips ──────────────────────────────────────────────────────────
    const filterChips = [
        { key: 'todos', label: 'Todos', count: items.length },
        { key: 'baixo', label: 'Baixo estoque', count: lowStockItems.length },
        ...usedCategories.map((c) => ({
            key: c,
            label: c,
            count: items.filter((i) => i.category === c).length,
        })),
    ];

    // ── Item Card ─────────────────────────────────────────────────────────────
    function ItemCard({ item }: { item: PantryItem }) {
        const isLow = item.quantity_current <= item.quantity_min;
        const pct = item.quantity_min > 0
            ? Math.min((item.quantity_current / (item.quantity_min * 2)) * 100, 100)
            : item.quantity_current > 0 ? 100 : 0;

        return (
            <div
                className={`group relative overflow-hidden rounded-[12px] border bg-white p-4 transition-shadow hover:shadow-sm ${
                    isLow ? 'border-[#FCA5A5]' : 'border-[#E4E3E0]'
                }`}
            >
                {/* Alert badge */}
                {isLow && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5">
                        <AlertTriangle size={10} className="text-[#DC2626]" />
                        <span className="text-[10px] font-medium text-[#DC2626]">Baixo</span>
                    </div>
                )}

                {/* Name + category */}
                <div
                    className="mb-3 cursor-pointer"
                    onClick={() => openEdit(item)}
                >
                    <p className="text-sm font-medium text-[#1A1917]">{item.name}</p>
                    {item.category && (
                        <span className="mt-0.5 inline-block rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                            {item.category}
                        </span>
                    )}
                </div>

                {/* Quantity controls */}
                <div className="mb-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => adjustQty(item, -1)}
                        className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] transition-colors hover:bg-[#F0EFED]"
                    >
                        <Minus size={12} />
                    </button>
                    <span className="min-w-[60px] text-center font-mono text-sm text-[#1A1917]">
                        {item.quantity_current} {item.unit}
                    </span>
                    <button
                        type="button"
                        onClick={() => adjustQty(item, 1)}
                        className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] transition-colors hover:bg-[#F0EFED]"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                {/* Progress bar + min */}
                <ProgressBar
                    value={item.quantity_current}
                    max={item.quantity_min * 2 || 1}
                    height={6}
                    color={isLow ? '#DC2626' : '#059669'}
                />
                <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#9B9A96]">
                        Mínimo: {item.quantity_min} {item.unit}
                    </span>
                    {item.updated_at && (
                        <span className="font-mono text-[10px] text-[#C8C7C3]">
                            Atualizado {item.updated_at}
                        </span>
                    )}
                </div>

                {/* Delete on hover */}
                <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="absolute bottom-3 right-3 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                >
                    <Trash2 size={12} className="text-[#9B9A96]" />
                </button>
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Dispensa', href: '/dispensa' },
        ]}>
            <Head title="Dispensa" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Dispensa</h1>
                        <p className="text-sm text-[#9B9A96]">Controle de estoque da casa.</p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus size={14} />
                        Novo item
                    </Button>
                </div>

                {/* Alert banner */}
                {lowStockItems.length > 0 && (
                    <div className="flex items-center gap-3 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                        <AlertTriangle size={16} className="shrink-0 text-[#DC2626]" />
                        <p className="text-sm text-[#DC2626]">
                            <span className="font-medium">{lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}</span>
                            {' '}abaixo do estoque mínimo:{' '}
                            {lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}
                            {lowStockItems.length > 3 && ` e mais ${lowStockItems.length - 3}`}.
                        </p>
                    </div>
                )}

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                    {filterChips.map(({ key, label, count }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCategoryFilter(key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                categoryFilter === key
                                    ? 'bg-[#1A1917] text-white'
                                    : key === 'baixo' && count > 0
                                    ? 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FCA5A5]/20'
                                    : 'bg-[#F0EFED] text-[#6B6A67] hover:bg-[#E4E3E0]'
                            }`}
                        >
                            {key === 'baixo' && count > 0 && <AlertTriangle size={10} />}
                            {label}
                            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                                categoryFilter === key ? 'bg-white/20' : 'bg-white text-[#9B9A96]'
                            }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Grid of item cards */}
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#9B9A96]">
                        Nenhum item na dispensa.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sheet: Criar ─────────────────────────────────────────────── */}
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Novo item na dispensa</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submitCreate} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                autoFocus
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Ex: Arroz"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Quantidade atual</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={createForm.data.quantity_current}
                                    onChange={(e) => createForm.setData('quantity_current', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantidade mínima</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={createForm.data.quantity_min}
                                    onChange={(e) => createForm.setData('quantity_min', e.target.value)}
                                    placeholder="1"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Unidade</Label>
                            <Select value={createForm.data.unit} onValueChange={(v) => createForm.setData('unit', v)}>
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
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select
                                value={createForm.data.category || '__none__'}
                                onValueChange={(v) => createForm.setData('category', v === '__none__' ? '' : v)}
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
                        <SheetFooter>
                            <Button
                                type="submit"
                                disabled={!createForm.data.name.trim() || createForm.processing}
                            >
                                Adicionar item
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

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
                                <Label>Quantidade atual</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={editForm.data.quantity_current}
                                    onChange={(e) => editForm.setData('quantity_current', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantidade mínima</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={editForm.data.quantity_min}
                                    onChange={(e) => editForm.setData('quantity_min', e.target.value)}
                                />
                            </div>
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
