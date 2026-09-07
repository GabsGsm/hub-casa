<?php

namespace App\Repositories;

use App\Models\Gasto;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class GastoRepository
{
    /**
     * Retorna os gastos resolvidos para um mês específico.
     * Gastos recorrentes são projetados; pontuais aparecem apenas no mês do vencimento.
     */
    public function getResolvedForMonth(int $casaId, int $year, int $month): Collection
    {
        $all = Gasto::query()
            ->with('categoria:id,name,color', 'ciclo:id,name', 'responsaveis:id,name')
            ->where('casa_id', $casaId)
            ->get();

        $result = collect();
        $now            = Carbon::now();
        $isCurrentMonth = ($year === $now->year && $month === $now->month);

        foreach ($all as $gasto) {
            if ($gasto->recorrente) {
                $result->push(...$this->resolveRecorrente($gasto, $year, $month, $isCurrentMonth));
            } else {
                $result->push(...$this->resolvePontual($gasto, $year, $month));
            }
        }

        return $result->sortBy('vencimento_resolvido')->values();
    }

    /**
     * Retorna gastos paginados com filtros.
     */
    public function getFilteredPaginated(int $casaId, array $filters, int $perPage = 30): LengthAwarePaginator
    {
        $query = Gasto::query()
            ->with('categoria:id,name,color', 'ciclo:id,name', 'responsaveis:id,name')
            ->where('casa_id', $casaId);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['ciclo_id'])) {
            $query->where('ciclo_id', $filters['ciclo_id']);
        }
        if (! empty($filters['categoria_id'])) {
            $query->where('categoria_id', $filters['categoria_id']);
        }
        if (! empty($filters['search'])) {
            $query->where('titulo', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderByDesc('vencimento')->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(int $casaId, int $userId, array $data, array $responsavelIds = []): Gasto
    {
        $gasto = Gasto::create([
            'casa_id'         => $casaId,
            'ciclo_id'        => $data['ciclo_id'] ?? null,
            'categoria_id'    => $data['categoria_id'] ?? null,
            'criado_por'      => $userId,
            'titulo'          => $data['titulo'],
            'valor'           => $data['valor'],
            'status'          => $data['status'],
            'vencimento'      => $data['vencimento'] ?? null,
            'recorrente'      => $data['recorrente'] ?? false,
            'dia_recorrencia' => $data['dia_recorrencia'] ?? null,
            'observacoes'     => $data['observacoes'] ?? null,
        ]);

        if (! empty($responsavelIds)) {
            $gasto->responsaveis()->sync($responsavelIds);
        }

        return $gasto;
    }

    public function update(Gasto $gasto, array $data, ?array $responsavelIds): Gasto
    {
        $allowed = [
            'titulo', 'valor', 'status', 'vencimento', 'ciclo_id',
            'categoria_id', 'recorrente', 'dia_recorrencia', 'observacoes',
        ];

        $gasto->fill(array_intersect_key($data, array_flip($allowed)));
        $gasto->save();

        if ($responsavelIds !== null) {
            $gasto->responsaveis()->sync($responsavelIds);
        }

        return $gasto;
    }

    public function delete(Gasto $gasto): void
    {
        $gasto->responsaveis()->detach();
        $gasto->delete();
    }

    /**
     * Retorna os N gastos mais recentes (para dashboard).
     */
    public function getRecent(int $casaId, int $limit = 5): Collection
    {
        return Gasto::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId)
            ->orderByDesc('vencimento')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Gasto $g) => [
                'id'             => $g->id,
                'title'          => $g->titulo,
                'amount'         => (float) $g->valor,
                'type'           => 'gasto',
                'effective_date' => Carbon::parse($g->vencimento ?? $g->created_at)->format('d/m'),
                'category'       => $g->categoria
                    ? ['name' => $g->categoria->name, 'color' => $g->categoria->color]
                    : null,
            ]);
    }

    // -------------------------------------------------------------------------
    // Resolução de mês
    // -------------------------------------------------------------------------

    private function resolveRecorrente(Gasto $gasto, int $year, int $month, bool $isCurrentMonth): array
    {
        $created = Carbon::parse($gasto->created_at);
        $afterCreation = ($year > $created->year)
            || ($year === $created->year && $month >= $created->month);

        if (! $afterCreation) {
            return [];
        }

        $effectiveDate = Carbon::parse($gasto->vencimento ?? $gasto->created_at);
        $dueDateMatchesQuery = ($effectiveDate->year === $year && $effectiveDate->month === $month);

        if ($isCurrentMonth && ! $dueDateMatchesQuery) {
            // Mês virou: atualiza vencimento e reseta status
            $origDay    = $gasto->dia_recorrencia ?? $effectiveDate->day;
            $newDay     = min($origDay, Carbon::create($year, $month, 1)->daysInMonth);
            $newDueDate = Carbon::create($year, $month, $newDay);

            $gasto->vencimento = $newDueDate;
            $gasto->status     = Gasto::STATUS_ABERTO;
            $gasto->saveQuietly();

            return [$this->buildPayload($gasto, $newDueDate->format('Y-m-d'), Gasto::STATUS_ABERTO)];
        }

        if (! $isCurrentMonth) {
            // Projeção futura/passada: sempre aberto
            $origDay = $gasto->dia_recorrencia ?? $effectiveDate->day;

            return [$this->buildPayload(
                $gasto,
                $this->projectedDate($origDay, $year, $month),
                Gasto::STATUS_ABERTO,
            )];
        }

        // Mês atual e due_date já corresponde: usa status real
        return [$this->buildPayload($gasto, $effectiveDate->format('Y-m-d'))];
    }

    private function resolvePontual(Gasto $gasto, int $year, int $month): array
    {
        $effectiveDate = Carbon::parse($gasto->vencimento ?? $gasto->created_at);

        if ($effectiveDate->year === $year && $effectiveDate->month === $month) {
            return [$this->buildPayload($gasto, $effectiveDate->format('Y-m-d'))];
        }

        return [];
    }

    private function projectedDate(int $origDay, int $year, int $month): string
    {
        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
        $day = min($origDay, $daysInMonth);

        return Carbon::create($year, $month, $day)->format('Y-m-d');
    }

    private function buildPayload(Gasto $gasto, string $resolvedDate, ?string $statusOverride = null): array
    {
        return [
            'id'                  => $gasto->id,
            'tipo_registro'       => 'gasto',
            'titulo'              => $gasto->titulo,
            'valor'               => (float) $gasto->valor,
            'status'              => $statusOverride ?? $gasto->status,
            'vencimento'          => optional($gasto->vencimento)->format('Y-m-d'),
            'vencimento_resolvido' => $resolvedDate,
            'recorrente'          => (bool) $gasto->recorrente,
            'dia_recorrencia'     => $gasto->dia_recorrencia,
            'observacoes'         => $gasto->observacoes,
            'ciclo'               => $gasto->ciclo
                ? ['id' => $gasto->ciclo->id, 'name' => $gasto->ciclo->name]
                : null,
            'categoria'           => $gasto->categoria
                ? ['id' => $gasto->categoria->id, 'name' => $gasto->categoria->name, 'color' => $gasto->categoria->color]
                : null,
            'responsaveis'        => $gasto->responsaveis
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->toArray(),
        ];
    }
}
