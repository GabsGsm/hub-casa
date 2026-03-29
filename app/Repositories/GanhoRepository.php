<?php

namespace App\Repositories;

use App\Models\Ganho;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class GanhoRepository
{
    /**
     * Retorna os ganhos para um mês específico.
     * Filtro por data_recebimento ou created_at.
     */
    public function getForMonth(int $casaId, int $year, int $month): Collection
    {
        $all = Ganho::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId)
            ->get();

        return $all->filter(function (Ganho $ganho) use ($year, $month) {
            $date = Carbon::parse($ganho->data_recebimento ?? $ganho->created_at);

            return $date->year === $year && $date->month === $month;
        })->map(function (Ganho $ganho) {
            $date = Carbon::parse($ganho->data_recebimento ?? $ganho->created_at);

            return [
                'id'                   => $ganho->id,
                'tipo_registro'        => 'ganho',
                'titulo'               => $ganho->titulo,
                'valor'                => (float) $ganho->valor,
                'status'               => $ganho->status,
                'data_recebimento'     => optional($ganho->data_recebimento)->format('Y-m-d'),
                'vencimento_resolvido' => $date->format('Y-m-d'),
                'observacoes'          => $ganho->observacoes,
                'categoria'            => $ganho->categoria
                    ? ['id' => $ganho->categoria->id, 'name' => $ganho->categoria->name, 'color' => $ganho->categoria->color]
                    : null,
            ];
        })->sortBy('vencimento_resolvido')->values();
    }

    /**
     * Retorna ganhos paginados com filtros.
     */
    public function getFilteredPaginated(int $casaId, array $filters, int $perPage = 30): LengthAwarePaginator
    {
        $query = Ganho::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['categoria_id'])) {
            $query->where('categoria_id', $filters['categoria_id']);
        }
        if (! empty($filters['search'])) {
            $query->where('titulo', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderByDesc('data_recebimento')->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(int $casaId, int $userId, array $data): Ganho
    {
        return Ganho::create([
            'casa_id'          => $casaId,
            'categoria_id'     => $data['categoria_id'] ?? null,
            'criado_por'       => $userId,
            'titulo'           => $data['titulo'],
            'valor'            => $data['valor'],
            'status'           => $data['status'],
            'data_recebimento' => $data['data_recebimento'] ?? null,
            'observacoes'      => $data['observacoes'] ?? null,
        ]);
    }

    public function update(Ganho $ganho, array $data): Ganho
    {
        $allowed = [
            'titulo', 'valor', 'status', 'data_recebimento',
            'categoria_id', 'observacoes',
        ];

        $ganho->fill(array_intersect_key($data, array_flip($allowed)));
        $ganho->save();

        return $ganho;
    }

    public function delete(Ganho $ganho): void
    {
        $ganho->delete();
    }

    /**
     * Retorna os N ganhos mais recentes (para dashboard).
     */
    public function getRecent(int $casaId, int $limit = 5): Collection
    {
        return Ganho::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId)
            ->orderByDesc('data_recebimento')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Ganho $g) => [
                'id'             => $g->id,
                'title'          => $g->titulo,
                'amount'         => (float) $g->valor,
                'type'           => 'ganho',
                'effective_date' => Carbon::parse($g->data_recebimento ?? $g->created_at)->format('d/m'),
                'category'       => $g->categoria
                    ? ['name' => $g->categoria->name, 'color' => $g->categoria->color]
                    : null,
            ]);
    }
}
