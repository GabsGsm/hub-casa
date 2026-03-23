import InputError from '@/components/input-error';
import { AssigneeSelect } from '@/components/hub/assignee-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { noneOrVal, valOrNone } from '../utils';
import type { Cycle } from '../types';

type TxFormFieldsProps = {
    data: Record<string, string>;
    errors?: Partial<Record<string, string>>;
    setData: (key: string, value: string) => void;
    cycles: Cycle[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
    assigneeIds: number[];
    onAssigneesChange: (ids: number[]) => void;
};

export function TxFormFields({
    data,
    errors,
    setData,
    cycles,
    categories,
    members,
    assigneeIds,
    onAssigneesChange,
}: TxFormFieldsProps) {
    const isDivida    = data.type === 'divida';
    const isRecurring = data.is_recurring === '1';

    function handleTypeChange(v: string) {
        setData('type', v);
        if (v === 'divida') {
            setData('is_recurring', '0');
            setData('installments_total', data.installments_total || '');
        } else {
            setData('installments_total', '');
        }
    }

    return (
        <>
            <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors?.title} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input
                        type="number"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                    <InputError message={errors?.amount} />
                </div>
                <div className="grid gap-2">
                    <Label>
                        Vencimento{isDivida && <span className="ml-0.5 text-[#DC2626]">*</span>}
                    </Label>
                    <Input
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        required={isDivida}
                    />
                    {!isDivida && !data.due_date && (
                        <p className="text-xs text-[#9B9A96]">Sem data → usa a data de criação</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={data.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="ganho">Ganho</SelectItem>
                            <SelectItem value="divida">Dívida / Parcelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isDivida ? (
                <div className="grid gap-2">
                    <Label>
                        Nº de parcelas<span className="ml-0.5 text-[#DC2626]">*</span>
                    </Label>
                    <Input
                        type="number"
                        min={1}
                        value={data.installments_total}
                        onChange={(e) => setData('installments_total', e.target.value)}
                        required
                        placeholder="Ex: 12"
                    />
                    <InputError message={errors?.installments_total} />
                    <p className="text-xs text-[#9B9A96]">
                        Parcelas seguintes são projetadas automaticamente no Histórico
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label>Recorrência</Label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setData('is_recurring', e.target.checked ? '1' : '0')}
                            className="h-4 w-4 rounded border-[#E5E4E2] accent-[#1A1917]"
                        />
                        <span className="text-sm text-[#1A1917]">Lançamento recorrente (mensal)</span>
                    </label>
                    {isRecurring && (
                        <div className="grid gap-1">
                            <Label>Dia de recorrência</Label>
                            <Input
                                type="number"
                                min={1}
                                max={31}
                                value={data.recurrence_day}
                                onChange={(e) => setData('recurrence_day', e.target.value)}
                                placeholder="Ex: 15"
                            />
                            <InputError message={errors?.recurrence_day} />
                            {data.recurrence_day && (
                                <p className="text-xs text-[#2563EB]">
                                    Projetado todo dia {data.recurrence_day} de cada mês
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Ciclo</Label>
                    <Select
                        value={valOrNone(data.payment_cycle_id)}
                        onValueChange={(v) => setData('payment_cycle_id', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem ciclo</SelectItem>
                            {cycles.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select
                        value={valOrNone(data.category_id)}
                        onValueChange={(v) => setData('category_id', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Sem categoria</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {members.length > 0 && (
                <div className="grid gap-2">
                    <Label>Responsáveis</Label>
                    <AssigneeSelect
                        members={members}
                        selected={assigneeIds}
                        onChange={onAssigneesChange}
                    />
                </div>
            )}

            <div className="grid gap-2">
                <Label>Observações</Label>
                <textarea
                    className="min-h-15 w-full rounded-md border border-[#E5E4E2] bg-white px-3 py-2 text-sm text-[#1A1917] placeholder:text-[#9B9A96] focus:outline-none focus:ring-1 focus:ring-[#1A1917]"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={2}
                    placeholder="Opcional"
                />
            </div>
        </>
    );
}
