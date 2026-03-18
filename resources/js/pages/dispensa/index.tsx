import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
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
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '@/lib/inventory-constants';
import { ItemCard } from './components/item-card';

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

export default function Dispensa({ items }: DispensaProps) {
    const [categoryFilter, setCategoryFilter] = useState<string>('todos');
    const [createOpen, setCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

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

    function handleDelete(id: number, label: string) {
        setPendingDelete({
            action: () => router.delete(`/dispensa/${id}`, { preserveScroll: true }),
            label,
        });
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
                            <ItemCard
                                key={item.id}
                                item={item}
                                onEdit={openEdit}
                                onAdjustQty={adjustQty}
                                onDelete={(id) => handleDelete(id, item.name)}
                            />
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
                            <InputError message={createForm.errors.name} />
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
                                <InputError message={createForm.errors.quantity_current} />
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
                                <InputError message={createForm.errors.quantity_min} />
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
                            <InputError message={editForm.errors.name} />
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
                                <InputError message={editForm.errors.quantity_current} />
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
                                <InputError message={editForm.errors.quantity_min} />
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
                description={`Tem certeza que deseja remover "${pendingDelete?.label}" da dispensa?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
