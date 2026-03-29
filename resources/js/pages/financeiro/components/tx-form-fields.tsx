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
import type { Cycle, TipoRegistro } from '../types';

type TxFormFieldsProps = {
    tipoRegistro: TipoRegistro;
    onTipoChange: (tipo: TipoRegistro) => void;
    data: Record<string, string>;
    errors?: Partial<Record<string, string>>;
    setData: (key: string, value: string) => void;
    cycles: Cycle[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
    assigneeIds: number[];
    onAssigneesChange: (ids: number[]) => void;
    isEditing?: boolean;
};

export function TxFormFields({
    tipoRegistro,
    onTipoChange,
    data,
    errors,
    setData,
    cycles,
    categories,
    members,
    assigneeIds,
    onAssigneesChange,
    isEditing = false,
}: TxFormFieldsProps) {
    const isRecorrente = data.recorrente === '1';

    return (
        <>
            {/* Tipo de registro — não editável depois de criado */}
            {!isEditing && (
                <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={tipoRegistro} onValueChange={(v) => onTipoChange(v as TipoRegistro)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gasto">Gasto</SelectItem>
                            <SelectItem value="ganho">Ganho</SelectItem>
                            <SelectItem value="parcela">Parcela</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Título — não editável na parcela individual (pertence ao parcelamento) */}
            {!(tipoRegistro === 'parcela' && isEditing) && (
                <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input value={data.titulo} onChange={(e) => setData('titulo', e.target.value)} />
                    <InputError message={errors?.titulo} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>{tipoRegistro === 'parcela' ? 'Valor da parcela (R$)' : 'Valor (R$)'}</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={tipoRegistro === 'parcela' ? data.valor_parcela : data.valor}
                        onChange={(e) => setData(tipoRegistro === 'parcela' ? 'valor_parcela' : 'valor', e.target.value)}
                    />
                    <InputError message={errors?.valor ?? errors?.valor_parcela} />
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

            {/* ── Campos específicos: Gasto ── */}
            {tipoRegistro === 'gasto' && (
                <>
                    <div className="grid gap-2">
                        <Label>Vencimento</Label>
                        <Input
                            type="date"
                            value={data.vencimento}
                            onChange={(e) => setData('vencimento', e.target.value)}
                        />
                        {!data.vencimento && (
                            <p className="text-xs text-[#9B9A96]">Sem data → usa a data de criação</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Recorrência</Label>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isRecorrente}
                                onChange={(e) => setData('recorrente', e.target.checked ? '1' : '0')}
                                className="h-4 w-4 rounded border-[#E5E4E2] accent-[#1A1917]"
                            />
                            <span className="text-sm text-[#1A1917]">Lançamento recorrente (mensal)</span>
                        </label>
                        {isRecorrente && (
                            <div className="grid gap-1">
                                <Label>Dia de recorrência</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={data.dia_recorrencia}
                                    onChange={(e) => setData('dia_recorrencia', e.target.value)}
                                    placeholder="Ex: 15"
                                />
                                <InputError message={errors?.dia_recorrencia} />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Campos específicos: Ganho ── */}
            {tipoRegistro === 'ganho' && (
                <div className="grid gap-2">
                    <Label>Data de recebimento</Label>
                    <Input
                        type="date"
                        value={data.data_recebimento}
                        onChange={(e) => setData('data_recebimento', e.target.value)}
                    />
                </div>
            )}

            {/* ── Campos específicos: Parcela ── */}
            {tipoRegistro === 'parcela' && (
                <>
                    {!isEditing ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>
                                    Nº de parcelas<span className="ml-0.5 text-[#DC2626]">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={2}
                                    value={data.total_parcelas}
                                    onChange={(e) => setData('total_parcelas', e.target.value)}
                                    placeholder="Ex: 12"
                                />
                                <InputError message={errors?.total_parcelas} />
                                <p className="text-xs text-[#9B9A96]">
                                    Cada parcela será criada com vencimento mensal
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Vencimento 1ª parcela<span className="ml-0.5 text-[#DC2626]">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={data.vencimento_primeira ?? data.vencimento}
                                    onChange={(e) => {
                                        setData('vencimento_primeira', e.target.value);
                                        setData('vencimento', e.target.value);
                                    }}
                                />
                                <InputError message={errors?.vencimento_primeira ?? errors?.vencimento} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Nº da parcela</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={data.numero_parcela}
                                    onChange={(e) => setData('numero_parcela', e.target.value)}
                                />
                                <InputError message={errors?.numero_parcela} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Vencimento</Label>
                                <Input
                                    type="date"
                                    value={data.vencimento}
                                    onChange={(e) => setData('vencimento', e.target.value)}
                                />
                                <InputError message={errors?.vencimento} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Campos compartilhados: Ciclo + Categoria ── */}
            {tipoRegistro !== 'ganho' && !(tipoRegistro === 'parcela' && isEditing) && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label>Ciclo</Label>
                        <Select
                            value={valOrNone(data.ciclo_id)}
                            onValueChange={(v) => setData('ciclo_id', noneOrVal(v))}
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
                            value={valOrNone(data.categoria_id)}
                            onValueChange={(v) => setData('categoria_id', noneOrVal(v))}
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
            )}

            {/* Ganho: só categoria (sem ciclo) */}
            {tipoRegistro === 'ganho' && (
                <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select
                        value={valOrNone(data.categoria_id)}
                        onValueChange={(v) => setData('categoria_id', noneOrVal(v))}
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
            )}

            {/* Responsáveis — gastos e parcelas (não na edição de parcela individual) */}
            {tipoRegistro !== 'ganho' && !(tipoRegistro === 'parcela' && isEditing) && members.length > 0 && (
                <div className="grid gap-2">
                    <Label>Responsáveis</Label>
                    <AssigneeSelect
                        members={members}
                        selected={assigneeIds}
                        onChange={onAssigneesChange}
                    />
                </div>
            )}

            {/* Observações — não na edição de parcela individual */}
            {!(tipoRegistro === 'parcela' && isEditing) && (
                <div className="grid gap-2">
                    <Label>Observações</Label>
                    <textarea
                        className="min-h-15 w-full rounded-md border border-[#E5E4E2] bg-white px-3 py-2 text-sm text-[#1A1917] placeholder:text-[#9B9A96] focus:outline-none focus:ring-1 focus:ring-[#1A1917]"
                        value={data.observacoes}
                        onChange={(e) => setData('observacoes', e.target.value)}
                        rows={2}
                        placeholder="Opcional"
                    />
                </div>
            )}
        </>
    );
}
