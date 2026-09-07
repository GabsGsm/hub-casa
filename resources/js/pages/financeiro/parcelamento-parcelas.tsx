import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/hub/confirm-dialog';
import { StatusPill } from '@/components/hub/status-pill';
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
import AppLayout from '@/layouts/app-layout';
import { MembrosValorSelect, type MembroValorEntry } from './components/membros-valor-select';
import { currency } from './utils';

type MembroValor = {
    user_id: number;
    user_name: string | null;
    user_color: string | null;
    valor: number;
    status: string;
};

type Parcela = {
    id: number;
    numero_parcela: number;
    valor_parcela: number;
    status: 'aberto' | 'pago' | 'impossibilitado';
    vencimento: string;
    membros_valor: MembroValor[];
};

type Member = { id: number; name: string; color: string | null };

type ParcelamentoInfo = {
    id: number;
    titulo: string;
    valor_total: number;
    total_parcelas: number;
    categoria: { id: number; name: string; color: string | null } | null;
    ciclo: { id: number; name: string } | null;
};

type Props = {
    parcelamento: ParcelamentoInfo;
    parcelas: Parcela[];
    members: Member[];
};

export default function ParcelamentoParcelas({ parcelamento, parcelas, members }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMembros, setEditMembros] = useState<MembroValorEntry[]>([]);
    const [pendingDelete, setPendingDelete] = useState<Parcela | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const editForm = useForm({
        valor_parcela: '',
        status: 'aberto' as string,
        vencimento: '',
    });

    const addForm = useForm({
        valor_parcela: '',
        status: 'aberto' as string,
        vencimento: '',
    });

    function openEdit(p: Parcela) {
        setEditingId(p.id);
        setEditMembros(p.membros_valor.map((mv) => ({ user_id: mv.user_id, valor: mv.valor })));
        editForm.setData({
            valor_parcela: String(p.valor_parcela),
            status: p.status,
            vencimento: p.vencimento,
        });
    }

    function submitEdit(e: React.FormEvent, parcelaId: number) {
        e.preventDefault();
        editForm.transform((d) => ({ ...d, membros: editMembros }));
        editForm.put(`/financeiro/parcelas/${parcelaId}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post(`/financeiro/parcelamentos/${parcelamento.id}/parcelas`, {
            preserveScroll: true,
            onSuccess: () => { addForm.reset(); setShowAddForm(false); },
        });
    }

    function confirmDelete() {
        if (!pendingDelete) return;
        router.delete(`/financeiro/parcelas/${pendingDelete.id}`, {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Financeiro', href: '/financeiro' },
        { title: parcelamento.titulo, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Parcelas — ${parcelamento.titulo}`} />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.visit('/financeiro')}
                        className="flex size-8 items-center justify-center rounded-[8px] text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-[22px] font-semibold text-[#1A1917]">{parcelamento.titulo}</h1>
                        <p className="text-sm text-[#9B9A96]">
                            {parcelamento.total_parcelas} parcelas · Total: {currency.format(parcelamento.valor_total)}
                            {parcelamento.categoria && (
                                <span className="ml-2 rounded-full bg-[#F0EFED] px-2 py-0.5 text-[11px]">
                                    {parcelamento.categoria.name}
                                </span>
                            )}
                            {parcelamento.ciclo && (
                                <span className="ml-1 text-[11px] text-[#9B9A96]">· {parcelamento.ciclo.name}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Tabela de parcelas */}
                <div className="overflow-hidden rounded-xl border border-[#E4E3E0] bg-white">
                    {/* Cabeçalho */}
                    <div className="hidden border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid md:grid-cols-[40px_1fr_1fr_1fr_120px] md:gap-4">
                        {['#', 'Valor', 'Vencimento', 'Status', ''].map((h) => (
                            <span key={h} className="text-xs uppercase tracking-wide text-[#9B9A96]">{h}</span>
                        ))}
                    </div>

                    {parcelas.map((p) => (
                        <div key={p.id} className="border-b border-[#E4E3E0] last:border-0">
                            {editingId === p.id ? (
                                /* Linha de edição */
                                <form
                                    onSubmit={(e) => submitEdit(e, p.id)}
                                    className="flex flex-col gap-3 px-5 py-3"
                                >
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[40px_1fr_1fr_1fr_120px] md:items-end md:gap-4">
                                        <span className="hidden font-mono text-sm text-[#9B9A96] md:block">{p.numero_parcela}</span>
                                        <div>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.data.valor_parcela}
                                                onChange={(e) => editForm.setData('valor_parcela', e.target.value)}
                                                className="h-8"
                                            />
                                            <InputError message={editForm.errors.valor_parcela} />
                                        </div>
                                        <div>
                                            <Input
                                                type="date"
                                                value={editForm.data.vencimento}
                                                onChange={(e) => editForm.setData('vencimento', e.target.value)}
                                                className="h-8"
                                            />
                                            <InputError message={editForm.errors.vencimento} />
                                        </div>
                                        <div>
                                            <Select
                                                value={editForm.data.status}
                                                onValueChange={(v) => editForm.setData('status', v)}
                                            >
                                                <SelectTrigger className="h-8 w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="aberto">Aberto</SelectItem>
                                                    <SelectItem value="pago">Pago</SelectItem>
                                                    <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" disabled={editForm.processing}>Salvar</Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Divisão de valor por membro */}
                                    {members.length > 0 && (
                                        <div className="md:ml-14">
                                            <Label className="mb-1.5 block text-xs">Responsáveis e valores</Label>
                                            <MembrosValorSelect
                                                members={members}
                                                membros={editMembros}
                                                valorTotal={parseFloat(editForm.data.valor_parcela) || 0}
                                                onChange={setEditMembros}
                                            />
                                        </div>
                                    )}
                                </form>
                            ) : (
                                /* Linha normal */
                                <div className="group px-5 py-3 hover:bg-[#F8F8F7]">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[40px_1fr_1fr_1fr_120px] md:items-center md:gap-4">
                                        <span className="font-mono text-sm text-[#9B9A96]">{p.numero_parcela}</span>
                                        <div>
                                            <span className="font-mono text-sm font-medium text-[#1A1917]">
                                                {currency.format(p.valor_parcela)}
                                            </span>
                                            {/* Badges de membros */}
                                            {p.membros_valor.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {p.membros_valor.map((mv) => (
                                                        <span
                                                            key={mv.user_id}
                                                            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                                            style={{ backgroundColor: mv.user_color ?? '#6366f1' }}
                                                            title={`${mv.user_name}: R$ ${mv.valor.toFixed(2)}`}
                                                        >
                                                            {mv.user_name?.split(' ')[0]} · R${mv.valor.toFixed(2)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-mono text-sm text-[#6B6A67]">{p.vencimento}</span>
                                        <StatusPill status={p.status} />
                                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(p)}
                                                className="rounded-[6px] px-2 py-1 text-xs text-[#6B6A67] transition-colors hover:bg-[#F0EFED] hover:text-[#1A1917]"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPendingDelete(p)}
                                                className="flex size-7 items-center justify-center rounded-[6px] text-[#6B6A67] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Linha de adicionar nova parcela */}
                    {showAddForm ? (
                        <form
                            onSubmit={submitAdd}
                            className="border-t-2 border-[#E4E3E0] grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[40px_1fr_1fr_1fr_120px] md:items-end md:gap-4"
                        >
                            <span className="hidden font-mono text-sm text-[#9B9A96] md:block">+</span>
                            <div>
                                <Label className="text-xs">Valor</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={addForm.data.valor_parcela}
                                    onChange={(e) => addForm.setData('valor_parcela', e.target.value)}
                                    className="h-8"
                                    placeholder="0,00"
                                />
                                <InputError message={addForm.errors.valor_parcela} />
                            </div>
                            <div>
                                <Label className="text-xs">Vencimento</Label>
                                <Input
                                    type="date"
                                    value={addForm.data.vencimento}
                                    onChange={(e) => addForm.setData('vencimento', e.target.value)}
                                    className="h-8"
                                />
                                <InputError message={addForm.errors.vencimento} />
                            </div>
                            <div>
                                <Label className="text-xs">Status</Label>
                                <Select
                                    value={addForm.data.status}
                                    onValueChange={(v) => addForm.setData('status', v)}
                                >
                                    <SelectTrigger className="h-8 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aberto">Aberto</SelectItem>
                                        <SelectItem value="pago">Pago</SelectItem>
                                        <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={addForm.processing}>Adicionar</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="border-t border-[#E4E3E0] px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center gap-1.5 text-sm text-[#6B6A67] transition-colors hover:text-[#1A1917]"
                            >
                                <Plus size={14} />
                                Adicionar parcela
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!pendingDelete}
                description={`Remover a parcela ${pendingDelete?.numero_parcela} (${pendingDelete ? currency.format(pendingDelete.valor_parcela) : ''})?`}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </AppLayout>
    );
}
