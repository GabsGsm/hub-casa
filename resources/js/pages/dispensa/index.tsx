import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, HelpCircle, Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { ProgressBar } from '@/components/hub/progress-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '@/lib/inventory-constants';

// ── Types ─────────────────────────────────────────────────────────────────────
type Produto = {
    id: number;
    nome: string;
    unidade: string;
    categoria: string | null;
    prioridade: string;
    estoque_atual: number;
    estoque_minimo: number;
    estoque_baixo: boolean;
    falta_para_minimo: number;
    atualizado_em: string | null;
};

type DispensaProps = {
    produtos: Produto[];
    alertas: number;
};

export default function Dispensa({ produtos, alertas }: DispensaProps) {
    const [categoryFilter, setCategoryFilter] = useState<string>('todos');
    const [createOpen, setCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Produto | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);

    const createForm = useForm({
        nome: '', estoque_atual: '', estoque_minimo: '', unidade: 'un', categoria: '',
    });
    const editForm = useForm({
        nome: '', estoque_atual: '', estoque_minimo: '', unidade: 'un', categoria: '',
    });

    const lowStock = useMemo(() => produtos.filter((p) => p.estoque_baixo), [produtos]);

    const usedCategories = useMemo(() => {
        const cats = new Set<string>();
        for (const p of produtos) { if (p.categoria) cats.add(p.categoria); }
        return Array.from(cats).sort();
    }, [produtos]);

    const filtered = useMemo(() => {
        if (categoryFilter === 'todos') return produtos;
        if (categoryFilter === 'baixo') return lowStock;
        return produtos.filter((p) => p.categoria === categoryFilter);
    }, [produtos, categoryFilter, lowStock]);

    function openEdit(item: Produto) {
        setEditingItem(item);
        editForm.setData({
            nome: item.nome,
            estoque_atual: String(item.estoque_atual),
            estoque_minimo: String(item.estoque_minimo),
            unidade: item.unidade,
            categoria: item.categoria ?? '',
        });
        setSheetOpen(true);
    }

    function adjustQty(item: Produto, delta: number) {
        router.patch(`/dispensa/${item.id}/estoque`, { delta }, { preserveScroll: true });
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

    const filterChips = [
        { key: 'todos', label: 'Todos', count: produtos.length },
        { key: 'baixo', label: 'Baixo estoque', count: lowStock.length },
        ...usedCategories.map((c) => ({
            key: c, label: c, count: produtos.filter((p) => p.categoria === c).length,
        })),
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Dispensa', href: '/dispensa' },
        ]}>
            <Head title="Dispensa" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Dispensa</h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 cursor-help"><HelpCircle size={14} className="text-[#C8C7C3]" /></span>
                                </TooltipTrigger>
                                <TooltipContent>Controle o estoque da casa. Defina quantidades mínimas para ser alertado.</TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-sm text-[#9B9A96]">Controle de estoque da casa.</p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus size={14} /> Novo produto
                    </Button>
                </div>

                {alertas > 0 && (
                    <div className="flex items-center gap-3 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                        <AlertTriangle size={16} className="shrink-0 text-[#DC2626]" />
                        <p className="text-sm text-[#DC2626]">
                            <span className="font-medium">{alertas} {alertas === 1 ? 'produto' : 'produtos'}</span> abaixo do estoque mínimo.
                        </p>
                    </div>
                )}

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
                            }`}>{count}</span>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#9B9A96]">Nenhum produto na dispensa.</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative overflow-hidden rounded-[12px] border bg-white p-4 transition-shadow hover:shadow-sm ${
                                    item.estoque_baixo ? 'border-[#FCA5A5]' : 'border-[#E4E3E0]'
                                }`}
                            >
                                {item.estoque_baixo && (
                                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5">
                                        <AlertTriangle size={10} className="text-[#DC2626]" />
                                        <span className="text-[10px] font-medium text-[#DC2626]">Baixo</span>
                                    </div>
                                )}
                                <div className="mb-3 cursor-pointer" onClick={() => openEdit(item)}>
                                    <p className="text-sm font-medium text-[#1A1917]">{item.nome}</p>
                                    {item.categoria && (
                                        <span className="mt-0.5 inline-block rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                                            {item.categoria}
                                        </span>
                                    )}
                                </div>
                                <div className="mb-3 flex items-center gap-2">
                                    <button type="button" onClick={() => adjustQty(item, -1)}
                                        className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] hover:bg-[#F0EFED]">
                                        <Minus size={12} />
                                    </button>
                                    <span className="min-w-[60px] text-center font-mono text-sm text-[#1A1917]">
                                        {item.estoque_atual} {item.unidade}
                                    </span>
                                    <button type="button" onClick={() => adjustQty(item, 1)}
                                        className="flex size-7 items-center justify-center rounded-[6px] border border-[#E4E3E0] text-[#6B6A67] hover:bg-[#F0EFED]">
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <ProgressBar value={item.estoque_atual} max={item.estoque_minimo * 2 || 1} height={6}
                                    color={item.estoque_baixo ? '#DC2626' : '#059669'} />
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-[#9B9A96]">Mínimo: {item.estoque_minimo} {item.unidade}</span>
                                    {item.atualizado_em && (
                                        <span className="font-mono text-[10px] text-[#C8C7C3]">Atualizado {item.atualizado_em}</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => handleDelete(item.id, item.nome)}
                                    className="absolute bottom-3 right-3 rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
                                    <Trash2 size={12} className="text-[#9B9A96]" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sheet: Criar */}
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader><SheetTitle>Novo produto</SheetTitle></SheetHeader>
                    <form onSubmit={submitCreate} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input autoFocus value={createForm.data.nome}
                                onChange={(e) => createForm.setData('nome', e.target.value)} placeholder="Ex: Arroz" />
                            <InputError message={createForm.errors.nome} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Estoque atual</Label>
                                <Input type="number" min={0} step="0.1" value={createForm.data.estoque_atual}
                                    onChange={(e) => createForm.setData('estoque_atual', e.target.value)} placeholder="0" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Estoque mínimo</Label>
                                <Input type="number" min={0} step="0.1" value={createForm.data.estoque_minimo}
                                    onChange={(e) => createForm.setData('estoque_minimo', e.target.value)} placeholder="1" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Unidade</Label>
                            <Select value={createForm.data.unidade} onValueChange={(v) => createForm.setData('unidade', v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select value={createForm.data.categoria || '__none__'}
                                onValueChange={(v) => createForm.setData('categoria', v === '__none__' ? '' : v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem categoria</SelectItem>
                                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <SheetFooter>
                            <Button type="submit" disabled={!createForm.data.nome.trim() || createForm.processing}>
                                Adicionar produto
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Sheet: Editar */}
            <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) setEditingItem(null); setSheetOpen(open); }}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader><SheetTitle>Editar produto</SheetTitle></SheetHeader>
                    <form onSubmit={submitEdit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input autoFocus value={editForm.data.nome}
                                onChange={(e) => editForm.setData('nome', e.target.value)} />
                            <InputError message={editForm.errors.nome} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Estoque atual</Label>
                                <Input type="number" min={0} step="0.1" value={editForm.data.estoque_atual}
                                    onChange={(e) => editForm.setData('estoque_atual', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Estoque mínimo</Label>
                                <Input type="number" min={0} step="0.1" value={editForm.data.estoque_minimo}
                                    onChange={(e) => editForm.setData('estoque_minimo', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Unidade</Label>
                            <Select value={editForm.data.unidade} onValueChange={(v) => editForm.setData('unidade', v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select value={editForm.data.categoria || '__none__'}
                                onValueChange={(v) => editForm.setData('categoria', v === '__none__' ? '' : v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sem categoria</SelectItem>
                                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {editingItem && (
                            <div className="mt-2 border-t border-[#F0EFED] pt-4">
                                <button type="button"
                                    onClick={() => { handleDelete(editingItem.id, editingItem.nome); setSheetOpen(false); }}
                                    className="flex items-center gap-1.5 text-sm text-[#DC2626] hover:underline">
                                    <Trash2 size={13} /> Remover produto
                                </button>
                            </div>
                        )}
                        <SheetFooter><Button type="submit" disabled={editForm.processing}>Salvar alterações</Button></SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}" da dispensa?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)} />
        </AppLayout>
    );
}