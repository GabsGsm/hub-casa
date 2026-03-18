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
    const isDivida = data.type === 'divida';

    const dueDayOfMonth = data.due_date
        ? new Date(data.due_date + 'T00:00').getDate()
        : null;

    function handleTypeChange(v: string) {
        setData('type', v);
        if (v === 'divida') setData('recurrence', '');
        else setData('installments_count', '');
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
                        value={data.installments_count}
                        onChange={(e) => setData('installments_count', e.target.value)}
                        required
                        placeholder="Ex: 12"
                    />
                    <p className="text-xs text-[#9B9A96]">
                        Parcelas seguintes são projetadas automaticamente no Histórico
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label>Recorrência</Label>
                    <Select
                        value={valOrNone(data.recurrence)}
                        onValueChange={(v) => setData('recurrence', noneOrVal(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">Não recorrente</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                        </SelectContent>
                    </Select>
                    {data.recurrence === 'mensal' && dueDayOfMonth && (
                        <p className="text-xs text-[#2563EB]">
                            Projetado todo dia {dueDayOfMonth} de cada mês
                        </p>
                    )}
                    {data.recurrence === 'mensal' && !data.due_date && (
                        <p className="text-xs text-[#9B9A96]">
                            Defina o vencimento para fixar o dia da recorrência
                        </p>
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
        </>
    );
}
