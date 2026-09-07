import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Cycle } from '../types';

export type MembroValorEntry = { user_id: number; valor: number; ciclo_id: number | null };

type Member = { id: number; name: string; color: string | null };

type Props = {
    members: Member[];
    cycles: Cycle[];
    membros: MembroValorEntry[];
    valorTotal: number;
    onChange: (membros: MembroValorEntry[]) => void;
};

export function MembrosValorSelect({ members, cycles, membros, valorTotal, onChange }: Props) {
    const totalAtribuido = membros.reduce((s, m) => s + (m.valor || 0), 0);
    const diff           = Math.abs(valorTotal - totalAtribuido);
    const isBalanced     = diff < 0.01;

    function toggle(userId: number) {
        const exists = membros.find((m) => m.user_id === userId);
        if (exists) {
            onChange(membros.filter((m) => m.user_id !== userId));
        } else {
            const defaultCiclo = cycles.find((c) => c.user_id === userId)?.id ?? null;
            const newMembros = [...membros, { user_id: userId, valor: 0, ciclo_id: defaultCiclo }];
            if (valorTotal > 0) {
                const perMember = valorTotal / newMembros.length;
                onChange(newMembros.map((m) => ({ ...m, valor: parseFloat(perMember.toFixed(2)) })));
            } else {
                onChange(newMembros);
            }
        }
    }

    function updateValor(userId: number, valor: number) {
        onChange(membros.map((m) => m.user_id === userId ? { ...m, valor } : m));
    }

    function updateCiclo(userId: number, cicloId: number | null) {
        onChange(membros.map((m) => m.user_id === userId ? { ...m, ciclo_id: cicloId } : m));
    }

    if (members.length === 0) return null;

    return (
        <div className="grid gap-2">
            {/* Seleção de membros */}
            <div className="flex flex-wrap gap-1.5">
                {members.map((m) => {
                    const isSelected = membros.some((mv) => mv.user_id === m.id);
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => toggle(m.id)}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                isSelected
                                    ? 'border-transparent text-white'
                                    : 'border-[#E4E3E0] bg-white text-[#6B6A67] hover:border-[#9B9A96]'
                            }`}
                            style={isSelected ? { backgroundColor: m.color ?? '#6366f1' } : {}}
                        >
                            <span
                                className="h-2 w-2 rounded-full border border-white/30"
                                style={{ backgroundColor: m.color ?? '#6366f1' }}
                            />
                            {m.name}
                        </button>
                    );
                })}
            </div>

            {/* Inputs de valor e ciclo por membro */}
            {membros.length > 0 && (
                <div className="rounded-lg border border-[#E4E3E0] divide-y divide-[#F0EFED]">
                    {membros.map((mv) => {
                        const member       = members.find((m) => m.id === mv.user_id);
                        if (!member) return null;

                        const memberCycles = cycles.filter((c) => c.user_id === mv.user_id);
                        const pct          = valorTotal > 0 ? ((mv.valor / valorTotal) * 100).toFixed(0) : '0';

                        return (
                            <div key={mv.user_id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: member.color ?? '#6366f1' }}
                                />
                                <span className="flex-1 min-w-20 text-sm text-[#1A1917]">{member.name}</span>

                                {/* Ciclo do membro */}
                                {memberCycles.length > 0 && (
                                    <Select
                                        value={mv.ciclo_id ? String(mv.ciclo_id) : '__none__'}
                                        onValueChange={(v) => updateCiclo(mv.user_id, v === '__none__' ? null : Number(v))}
                                    >
                                        <SelectTrigger className="h-7 w-32 text-xs">
                                            <SelectValue placeholder="Sem ciclo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sem ciclo</SelectItem>
                                            {memberCycles.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <span className="w-8 text-right text-xs text-[#9B9A96]">{pct}%</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={mv.valor}
                                    onChange={(e) => updateValor(mv.user_id, parseFloat(e.target.value) || 0)}
                                    className="h-7 w-24 text-right font-mono text-sm"
                                />
                            </div>
                        );
                    })}

                    {/* Barra de total */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-[#F8F8F7]">
                        <span className="flex-1 text-xs font-medium text-[#6B6A67] uppercase tracking-wide">Total</span>
                        {!isBalanced && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertTriangle size={11} />
                                {totalAtribuido > valorTotal ? 'Excede' : 'Falta'} R${' '}
                                {diff.toFixed(2)}
                            </div>
                        )}
                        <span
                            className={`font-mono text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-amber-600'}`}
                        >
                            R$ {totalAtribuido.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {membros.length === 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertTriangle size={11} />
                    Sem responsável — visível apenas na visão da casa
                </p>
            )}
        </div>
    );
}
