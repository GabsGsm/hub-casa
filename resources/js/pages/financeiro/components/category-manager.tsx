import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = { id: number; name: string; color: string | null };

type Props = {
    open: boolean;
    onClose: () => void;
    categories: Category[];
};

export function CategoryManager({ open, onClose, categories }: Props) {
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

    const createForm = useForm({ name: '', color: '#6366f1' });
    const editForm   = useForm({ name: '', color: '#6366f1' });

    function openEdit(cat: Category) {
        setEditingCat(cat);
        editForm.setData({ name: cat.name, color: cat.color ?? '#6366f1' });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/financeiro/categorias', {
            preserveScroll: true,
            onSuccess: () => createForm.reset('name'),
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingCat) return;
        editForm.put(`/financeiro/categorias/${editingCat.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingCat(null),
        });
    }

    function confirmDelete() {
        if (!pendingDelete) return;
        router.delete(`/financeiro/categorias/${pendingDelete.id}`, {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Categorias</DialogTitle>
                    </DialogHeader>

                    {/* Lista de categorias existentes */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-[#F0EFED]">
                        {categories.length === 0 && (
                            <p className="py-4 text-center text-sm text-[#9B9A96]">
                                Nenhuma categoria criada ainda.
                            </p>
                        )}
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center gap-3 py-2.5 px-1">
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                                    style={{ backgroundColor: cat.color ?? '#d1d5db' }}
                                />
                                <span className="flex-1 text-sm text-[#1A1917]">{cat.name}</span>
                                <button
                                    type="button"
                                    onClick={() => openEdit(cat)}
                                    className="flex size-7 items-center justify-center rounded-[6px] text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                >
                                    <Pencil size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPendingDelete(cat)}
                                    className="flex size-7 items-center justify-center rounded-[6px] text-[#6B6A67] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Formulário de criação */}
                    <div className="border-t border-[#F0EFED] pt-4">
                        <p className="mb-3 text-xs font-medium text-[#6B6A67] uppercase tracking-wide">
                            Nova categoria
                        </p>
                        <form onSubmit={submitCreate} className="flex items-end gap-2">
                            <div className="flex-1 grid gap-1">
                                <Label htmlFor="cat-name" className="sr-only">Nome</Label>
                                <Input
                                    id="cat-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Nome da categoria"
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="shrink-0">
                                <input
                                    type="color"
                                    value={createForm.data.color}
                                    onChange={(e) => createForm.setData('color', e.target.value)}
                                    className="h-9 w-10 cursor-pointer rounded border border-input bg-background p-1"
                                    title="Cor da categoria"
                                />
                            </div>
                            <Button type="submit" disabled={createForm.processing} size="sm">
                                <Plus size={14} />
                                Criar
                            </Button>
                        </form>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de edição inline */}
            <Dialog open={!!editingCat} onOpenChange={(o) => !o && setEditingCat(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar categoria</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="grid gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Cor</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={editForm.data.color}
                                    onChange={(e) => editForm.setData('color', e.target.value)}
                                    className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                                />
                                <span className="text-sm text-[#6B6A67]">{editForm.data.color}</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setEditingCat(null)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!pendingDelete}
                description={`Remover a categoria "${pendingDelete?.name}"? Os lançamentos associados perderão a categoria.`}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </>
    );
}
