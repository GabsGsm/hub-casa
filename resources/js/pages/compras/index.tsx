import { Head, router, useForm } from '@inertiajs/react';
import { Check, HelpCircle, Package, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { ProgressBar } from '@/components/hub/progress-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';

// ── Types ─────────────────────────────────────────────────────────────────────
type ProdutoRef = {
    id: number;
    nome: string;
    unidade: string;
    categoria: string | null;
    estoque_atual: number;
    estoque_minimo: number;
};

type ItemCompra = {
    id: number;
    produto_id: number;
    nome: string;
    unidade: string;
    categoria: string | null;
    prioridade: string;
    quantidade_desejada: number;
    quantidade_comprada: number;
    falta: number;
    progresso: number;
    status: 'pendente' | 'completo' | 'cancelado';
    observacoes: string | null;
    estoque_atual: number;
    estoque_minimo: number;
};

type ComprasProps = {
    itens: ItemCompra[];
    produtos: ProdutoRef[];
};

type Filter = 'todos' | 'pendente' | 'completo' | 'cancelado';

export default function Compras({ itens, produtos }: ComprasProps) {
    const [filter, setFilter] = useState<Filter>('todos');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [compraDialogOpen, setCompraDialogOpen] = useState(false);
    const [compraItem, setCompraItem] = useState<ItemCompra | null>(null);
    const [compraQtd, setCompraQtd] = useState('');
    const [inlineValue, setInlineValue] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ action: () => void; label: string } | null>(null);
    const inlineRef = useRef<HTMLInputElement>(null);

    const addForm = useForm({
        produto_id: '', nome: '', unidade: 'un', categoria: '', quantidade_desejada: '1',
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const total = itens.length;
    const done = itens.filter((i) => i.status === 'completo').length;

    const filtered = useMemo(() => {
        if (filter === 'todos') return itens;
        return itens.filter((i) => i.status === filter);
    }, [itens, filter]);

    const pendentes = filtered.filter((i) => i.status === 'pendente');
    const completos = filtered.filter((i) => i.status === 'completo');
    const cancelados = filtered.filter((i) => i.status === 'cancelado');

    // ── Handlers ──────────────────────────────────────────────────────────────

    /** Inline add rápido: cria produto + adiciona na lista */
    function handleInlineAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!inlineValue.trim()) return;
        router.post('/compras', { nome: inlineValue.trim(), quantidade_desejada: 1 }, {
            preserveScroll: true,
            onSuccess: () => setInlineValue(''),
        });
    }

    /** Add via dialog: produto existente ou novo */
    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/compras', {
            preserveScroll: true,
            onSuccess: () => { addForm.reset(); setAddDialogOpen(false); },
        });
    }

    /** Abre dialog de compra parcial */
    function openCompraDialog(item: ItemCompra) {
        setCompraItem(item);
        setCompraQtd(String(item.falta));
        setCompraDialogOpen(true);
    }

    /** Registra compra parcial/completa */
    function submitCompra(e: React.FormEvent) {
        e.preventDefault();
        if (!compraItem) return;
        const qtd = parseFloat(compraQtd);
        if (isNaN(qtd) || qtd <= 0) return;
        router.post(`/compras/${compraItem.id}/registrar`, { quantidade: qtd }, {
            preserveScroll: true,
            onSuccess: () => { setCompraItem(null); setCompraDialogOpen(false); },
        });
    }

    function cancelarItem(item: ItemCompra) {
        router.patch(`/compras/${item.id}/cancelar`, {}, { preserveScroll: true });
    }

    function handleDelete(id: number, label: string) {
        setPendingDelete({
            action: () => router.delete(`/compras/${id}`, { preserveScroll: true }),
            label,
        });
    }

    function handleProdutoSelect(produtoId: string) {
        addForm.setData('produto_id', produtoId);
        if (produtoId) {
            const p = produtos.find((pr) => pr.id === Number(produtoId));
            if (p) {
                addForm.setData('nome', p.nome);
                addForm.setData('unidade', p.unidade);
                addForm.setData('categoria', p.categoria ?? '');
                // Sugestão: quantidade que falta para o mínimo
                const falta = Math.max(1, p.estoque_minimo - p.estoque_atual);
                addForm.setData('quantidade_desejada', String(falta));
            }
        }
    }

    const filters: { key: Filter; label: string; count: number }[] = [
        { key: 'todos', label: 'Todos', count: total },
        { key: 'pendente', label: 'Pendentes', count: itens.filter((i) => i.status === 'pendente').length },
        { key: 'completo', label: 'Comprados', count: done },
        { key: 'cancelado', label: 'Cancelados', count: itens.filter((i) => i.status === 'cancelado').length },
    ];

    // ── Render Row ────────────────────────────────────────────────────────────
    function renderItem(item: ItemCompra) {
        const isComplete = item.status === 'completo';
        const isCancelled = item.status === 'cancelado';

        return (
            <div key={item.id}
                className="group flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#F8F8F7]">

                {/* Ação principal */}
                {!isComplete && !isCancelled && (
                    <button type="button" onClick={() => openCompraDialog(item)}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#E4E3E0] text-[#9B9A96] transition-colors hover:border-[#059669] hover:text-[#059669]">
                        <ShoppingCart size={10} />
                    </button>
                )}
                {isComplete && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#059669] bg-[#059669]">
                        <Check size={10} strokeWidth={3} className="text-white" />
                    </div>
                )}
                {isCancelled && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#D97706] bg-[#D97706]">
                        <X size={10} strokeWidth={3} className="text-white" />
                    </div>
                )}

                {/* Prioridade */}
                {item.prioridade === 'alta' && !isComplete && !isCancelled && (
                    <div className="size-1.5 shrink-0 rounded-full bg-[#DC2626]" />
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <span className={`text-sm ${isComplete ? 'text-[#9B9A96] line-through' : isCancelled ? 'text-[#D97706] line-through' : 'text-[#1A1917]'}`}>
                        {item.nome}
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {item.categoria && (
                            <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-[10px] text-[#6B6A67]">
                                {item.categoria}
                            </span>
                        )}
                        {item.estoque_minimo > 0 && (
                            <span className="font-mono text-[10px] text-[#9B9A96]">
                                estoque: {item.estoque_atual}/{item.estoque_minimo} {item.unidade}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progresso de compra */}
                {!isCancelled && (
                    <div className="flex w-32 shrink-0 items-center gap-2">
                        <div className="flex-1">
                            <ProgressBar value={item.quantidade_comprada} max={item.quantidade_desejada || 1}
                                height={4} color={isComplete ? '#059669' : '#2563EB'} />
                        </div>
                        <span className="font-mono text-xs text-[#9B9A96]">
                            {item.quantidade_comprada}/{item.quantidade_desejada}
                        </span>
                    </div>
                )}

                {/* Ações */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isComplete && !isCancelled && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" onClick={() => cancelarItem(item)}
                                    className="rounded p-1 hover:bg-amber-50 hover:text-amber-500">
                                    <X size={13} className="text-[#9B9A96]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Cancelar item</TooltipContent>
                        </Tooltip>
                    )}
                    <button type="button" onClick={() => handleDelete(item.id, item.nome)}
                        className="rounded p-1 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={13} className="text-[#9B9A96]" />
                    </button>
                </div>
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[28px] font-semibold leading-tight text-[#1A1917]">Compras</h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 cursor-help"><HelpCircle size={14} className="text-[#C8C7C3]" /></span>
                                </TooltipTrigger>
                                <TooltipContent>Lista de compras com progresso parcial. Ao registrar compras, o estoque é atualizado automaticamente.</TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-sm text-[#9B9A96]">Lista de compras da casa.</p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                        <Package size={14} /> Adicionar da dispensa
                    </Button>
                </div>

                {/* Progress geral */}
                {total > 0 && (
                    <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white px-5 py-4">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={14} className="text-[#059669]" />
                                <span className="text-sm font-medium text-[#1A1917]">Progresso</span>
                            </div>
                            <span className="font-mono text-sm text-[#059669]">{done}/{total} completos</span>
                        </div>
                        <ProgressBar value={done} max={total} color="#059669" height={8} />
                    </div>
                )}

                {/* Inline add rápido */}
                <form onSubmit={handleInlineAdd} className="flex items-center gap-2">
                    <Input ref={inlineRef} value={inlineValue}
                        onChange={(e) => setInlineValue(e.target.value)}
                        placeholder="Adicionar item rápido... (Ex: Arroz 5kg)"
                        className="flex-1 rounded-[10px] border-[#E4E3E0] bg-white" />
                    <Button type="submit" disabled={!inlineValue.trim()} className="shrink-0 gap-2">
                        <Plus size={14} /> Adicionar
                    </Button>
                </form>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                    {filters.map(({ key, label, count }) => (
                        <button key={key} type="button" onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                filter === key
                                    ? 'bg-[#1A1917] text-white'
                                    : 'bg-[#F0EFED] text-[#6B6A67] hover:bg-[#E4E3E0]'
                            }`}>
                            {label}
                            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                                filter === key ? 'bg-white/20' : 'bg-white text-[#9B9A96]'
                            }`}>{count}</span>
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[#9B9A96]">Nenhum item na lista.</div>
                    ) : (
                        <div>
                            {pendentes.length > 0 && (
                                <div>
                                    {filter === 'todos' && (
                                        <div className="border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-2">
                                            <span className="text-xs font-medium uppercase tracking-wide text-[#6B6A67]">
                                                Pendentes · {pendentes.length}
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-2">{pendentes.map(renderItem)}</div>
                                </div>
                            )}
                            {cancelados.length > 0 && (
                                <div>
                                    <div className={`border-b border-[#E4E3E0] bg-[#FFFBEB] px-5 py-2 ${pendentes.length > 0 ? 'border-t' : ''}`}>
                                        <span className="text-xs font-medium uppercase tracking-wide text-[#D97706]">
                                            Cancelados · {cancelados.length}
                                        </span>
                                    </div>
                                    <div className="p-2">{cancelados.map(renderItem)}</div>
                                </div>
                            )}
                            {completos.length > 0 && (
                                <div>
                                    <div className={`border-b border-[#E4E3E0] bg-[#F0FDF4] px-5 py-2 ${(pendentes.length > 0 || cancelados.length > 0) ? 'border-t' : ''}`}>
                                        <span className="text-xs font-medium uppercase tracking-wide text-[#15803D]">
                                            Comprados · {completos.length}
                                        </span>
                                    </div>
                                    <div className="p-2">{completos.map(renderItem)}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog: Adicionar item (produto existente ou novo) */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Adicionar à lista</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Produto existente</Label>
                            <Select value={addForm.data.produto_id || '__none__'}
                                onValueChange={(v) => handleProdutoSelect(v === '__none__' ? '' : v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Novo produto</SelectItem>
                                    {produtos.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.nome} ({p.estoque_atual} {p.unidade})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {!addForm.data.produto_id && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Nome do novo produto</Label>
                                    <Input value={addForm.data.nome}
                                        onChange={(e) => addForm.setData('nome', e.target.value)}
                                        placeholder="Ex: Leite integral" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Unidade</Label>
                                        <Select value={addForm.data.unidade}
                                            onValueChange={(v) => addForm.setData('unidade', v)}>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz'].map((u) => (
                                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Categoria</Label>
                                        <Select value={addForm.data.categoria || '__none__'}
                                            onValueChange={(v) => addForm.setData('categoria', v === '__none__' ? '' : v)}>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Sem categoria</SelectItem>
                                                {['Alimentação', 'Limpeza', 'Higiene', 'Pet', 'Bebidas', 'Outros'].map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="grid gap-2">
                            <Label>Quantidade a comprar</Label>
                            <Input type="number" min={0.01} step="0.01"
                                value={addForm.data.quantidade_desejada}
                                onChange={(e) => addForm.setData('quantidade_desejada', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={addForm.processing}>Adicionar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Registrar compra parcial */}
            <Dialog open={compraDialogOpen} onOpenChange={(open) => { if (!open) setCompraItem(null); setCompraDialogOpen(open); }}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Registrar compra</DialogTitle>
                    </DialogHeader>
                    {compraItem && (
                        <form onSubmit={submitCompra} className="grid gap-4 pt-2">
                            <div className="rounded-[8px] bg-[#F8F8F7] p-3">
                                <p className="text-sm font-medium text-[#1A1917]">{compraItem.nome}</p>
                                <div className="mt-1 flex items-center gap-3">
                                    <span className="font-mono text-xs text-[#9B9A96]">
                                        {compraItem.quantidade_comprada}/{compraItem.quantidade_desejada} {compraItem.unidade}
                                    </span>
                                    <ProgressBar value={compraItem.quantidade_comprada}
                                        max={compraItem.quantidade_desejada || 1} height={4} color="#2563EB" />
                                </div>
                                <p className="mt-1 font-mono text-xs text-[#6B6A67]">
                                    Falta: {compraItem.falta} {compraItem.unidade}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantidade comprada agora</Label>
                                <Input type="number" min={0.01} step="0.01"
                                    value={compraQtd} onChange={(e) => setCompraQtd(e.target.value)}
                                    autoFocus />
                                <p className="text-xs text-[#9B9A96]">
                                    O estoque do produto será atualizado automaticamente.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={!compraQtd || parseFloat(compraQtd) <= 0}>
                                    Registrar
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!pendingDelete}
                description={`Tem certeza que deseja remover "${pendingDelete?.label}" da lista?`}
                onConfirm={() => { pendingDelete?.action(); setPendingDelete(null); }}
                onCancel={() => setPendingDelete(null)} />
        </AppLayout>
    );
}