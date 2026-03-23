import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { CyclePill } from '@/components/hub/cycle-pill';
import { StatusPill } from '@/components/hub/status-pill';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { currency } from '../utils';
import type { Cycle, PaginatedTransactions } from '../types';

type TodosViewProps = {
    allTransactions: PaginatedTransactions;
    cycles: Cycle[];
    categories: { id: number; name: string; color: string | null }[];
    filters?: Record<string, string>;
};

export function TodosView({ allTransactions, cycles, categories, filters = {} }: TodosViewProps) {
    const [search, setSearch]       = useState(filters.search ?? '');
    const [type, setType]           = useState(filters.type ?? '');
    const [status, setStatus]       = useState(filters.status ?? '');
    const [cycleId, setCycleId]     = useState(filters.cycle_id ?? '');
    const [categoryId, setCategoryId] = useState(filters.category_id ?? '');

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {};
        const merged = { search, type, status, cycle_id: cycleId, category_id: categoryId, ...overrides };
        for (const [k, v] of Object.entries(merged)) {
            if (v) params[k] = v;
        }
        router.visit('/financeiro/lancamentos/todos', {
            data: params,
            only: ['allTransactions', 'filters'],
            preserveScroll: true,
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    function handleSelectChange(key: string, value: string) {
        const setter: Record<string, (v: string) => void> = {
            type:        setType,
            status:      setStatus,
            cycle_id:    setCycleId,
            category_id: setCategoryId,
        };
        setter[key]?.(value);
        applyFilters({ [key]: value === '__none__' ? '' : value });
    }

    const { data: items, links } = allTransactions;

    return (
        <div>
            {/* Filtros */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9B9A96]" />
                        <Input
                            className="h-9 w-48 pl-8 text-sm"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </form>

                <Select value={type || '__none__'} onValueChange={(v) => handleSelectChange('type', v)}>
                    <SelectTrigger className="h-9 w-36 text-sm">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Todos os tipos</SelectItem>
                        <SelectItem value="gasto">Gasto</SelectItem>
                        <SelectItem value="ganho">Ganho</SelectItem>
                        <SelectItem value="divida">Dívida</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={status || '__none__'} onValueChange={(v) => handleSelectChange('status', v)}>
                    <SelectTrigger className="h-9 w-36 text-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Todos os status</SelectItem>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="impossibilitado">Impossibilitado</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={cycleId || '__none__'} onValueChange={(v) => handleSelectChange('cycle_id', v)}>
                    <SelectTrigger className="h-9 w-40 text-sm">
                        <SelectValue placeholder="Ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Todos os ciclos</SelectItem>
                        {cycles.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={categoryId || '__none__'} onValueChange={(v) => handleSelectChange('category_id', v)}>
                    <SelectTrigger className="h-9 w-40 text-sm">
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Todas as categorias</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="overflow-hidden rounded-[12px] border border-[#E4E3E0] bg-white">
                <div className="hidden border-b border-[#E4E3E0] bg-[#F8F8F7] px-5 py-3 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:gap-4">
                    {['Descrição', 'Valor', 'Vencimento', 'Ciclo', 'Status'].map((h) => (
                        <span key={h} className="text-xs uppercase tracking-wide text-[#9B9A96]">{h}</span>
                    ))}
                </div>

                {items.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-[#9B9A96]">
                        Nenhum lançamento encontrado.
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={`${item.id}-${item.installment_num ?? 0}`}
                            className="grid grid-cols-1 items-center gap-2 border-b border-[#E4E3E0] px-5 py-2.5 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:gap-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-[#1A1917]">{item.title}</p>
                                    {item.is_recurring && (
                                        <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#7C3AED]">
                                            Recorrente
                                        </span>
                                    )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-full bg-[#F0EFED] px-2 py-0.5 text-xs text-[#6B6A67]">
                                        {item.category?.name ?? 'Sem categoria'}
                                    </span>
                                    {item.installment_num && (
                                        <span className="font-mono text-xs text-[#9B9A96]">
                                            {item.installment_num}/{item.installments_total} parcelas
                                        </span>
                                    )}
                                </div>
                            </div>

                            <span
                                className="font-mono text-sm"
                                style={{ color: item.type === 'ganho' ? '#059669' : '#1A1917' }}
                            >
                                {item.type === 'ganho' ? '+' : ''}
                                {currency.format(item.amount)}
                            </span>

                            <span className="font-mono text-sm text-[#6B6A67]">
                                {item.resolved_date ?? '—'}
                            </span>

                            <div>
                                <CyclePill label={item.cycle?.name ?? 'Sem ciclo'} />
                            </div>

                            <div>
                                <StatusPill status={item.status} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Paginação */}
            {links.length > 3 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
                    {links.map((link, i) => (
                        <button
                            key={i}
                            type="button"
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url, { only: ['allTransactions'] })}
                            className={`rounded-[6px] px-3 py-1.5 text-sm transition-colors ${
                                link.active
                                    ? 'bg-[#1A1917] text-white'
                                    : link.url
                                      ? 'border border-[#E4E3E0] text-[#6B6A67] hover:bg-[#F0EFED]'
                                      : 'cursor-default border border-[#E4E3E0] text-[#C8C7C3]'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
