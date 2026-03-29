<?php

namespace App\Repositories;

use App\Models\Parcela;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ParcelaRepository
{
    /**
     * Retorna as parcelas para um mês específico.
     * Cada parcela é um registro individual, então filtramos por vencimento.
     */
    public function getForMonth(int $casaId, int $year, int $month): Collection
    {
        return Parcela::query()
            ->with('categoria:id,name,color', 'ciclo:id,name', 'responsaveis:id,name')
            ->where('casa_id', $casaId)
            ->whereYear('vencimento', $year)
            ->whereMonth('vencimento', $month)
            ->orderBy('vencimento')
            ->get()
            ->map(fn (Parcela $p) => $this->buildPayload($p));
    }

    /**
     * Retorna parcelas paginadas com filtros.
     */
    public function getFilteredPaginated(int $casaId, array $filters, int $perPage = 30): LengthAwarePaginator
    {
        $query = Parcela::query()
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

        return $query->orderByDesc('vencimento')->paginate($perPage);
    }

    /**
     * Cria uma parcela individual.
     */
    public function create(int $casaId, int $userId, array $data, array $responsavelIds = []): Parcela
    {
        $parcela = Parcela::create([
            'casa_id'        => $casaId,
            'ciclo_id'       => $data['ciclo_id'] ?? null,
            'categoria_id'   => $data['categoria_id'] ?? null,
            'criado_por'     => $userId,
            'titulo'         => $data['titulo'],
            'numero_parcela' => $data['numero_parcela'],
            'valor_parcela'  => $data['valor_parcela'],
            'status'         => $data['status'],
            'vencimento'     => $data['vencimento'],
            'observacoes'    => $data['observacoes'] ?? null,
        ]);

        if (! empty($responsavelIds)) {
            $parcela->responsaveis()->sync($responsavelIds);
        }

        return $parcela;
    }

    /**
     * Cria N parcelas em lote (ex: 12x de R$100).
     * Gera cada parcela com vencimento mensal a partir da data informada.
     */
    public function createEmLote(
        int $casaId,
        int $userId,
        array $data,
        int $totalParcelas,
        string $vencimentoPrimeira,
        array $responsavelIds = [],
    ): Collection {
        $parcelas   = collect();
        $baseDate   = Carbon::parse($vencimentoPrimeira);
        $origDay    = $baseDate->day;

        for ($i = 1; $i <= $totalParcelas; $i++) {
            $vencDate = $baseDate->copy();
            if ($i > 1) {
                $vencDate = Carbon::create($baseDate->year, $baseDate->month, 1)
                    ->addMonths($i - 1);
                $daysInMonth = $vencDate->daysInMonth;
                $vencDate->day = min($origDay, $daysInMonth);
            }

            $parcela = Parcela::create([
                'casa_id'        => $casaId,
                'ciclo_id'       => $data['ciclo_id'] ?? null,
                'categoria_id'   => $data['categoria_id'] ?? null,
                'criado_por'     => $userId,
                'titulo'         => $data['titulo'],
                'numero_parcela' => $i,
                'valor_parcela'  => $data['valor_parcela'],
                'status'         => Parcela::STATUS_ABERTO,
                'vencimento'     => $vencDate->format('Y-m-d'),
                'observacoes'    => $data['observacoes'] ?? null,
            ]);

            if (! empty($responsavelIds)) {
                $parcela->responsaveis()->sync($responsavelIds);
            }

            $parcelas->push($parcela);
        }

        return $parcelas;
    }

    public function update(Parcela $parcela, array $data, ?array $responsavelIds): Parcela
    {
        $allowed = [
            'titulo', 'valor_parcela', 'numero_parcela', 'status',
            'vencimento', 'ciclo_id', 'categoria_id', 'observacoes',
        ];

        $parcela->fill(array_intersect_key($data, array_flip($allowed)));
        $parcela->save();

        if ($responsavelIds !== null) {
            $parcela->responsaveis()->sync($responsavelIds);
        }

        return $parcela;
    }

    public function delete(Parcela $parcela): void
    {
        $parcela->responsaveis()->detach();
        $parcela->delete();
    }

    /**
     * Conta o total de parcelas com o mesmo título/casa (para exibir "3 de 12").
     */
    public function countIrmas(Parcela $parcela): int
    {
        return Parcela::where('casa_id', $parcela->casa_id)
            ->where('titulo', $parcela->titulo)
            ->where('criado_por', $parcela->criado_por)
            ->count();
    }

    /**
     * Retorna as N parcelas mais recentes (para dashboard).
     */
    public function getRecent(int $casaId, int $limit = 5): Collection
    {
        return Parcela::query()
            ->with('categoria:id,name,color')
            ->where('casa_id', $casaId)
            ->orderByDesc('vencimento')
            ->limit($limit)
            ->get()
            ->map(fn (Parcela $p) => [
                'id'             => $p->id,
                'title'          => "{$p->titulo} ({$p->numero_parcela}ª)",
                'amount'         => (float) $p->valor_parcela,
                'type'           => 'parcela',
                'effective_date' => $p->vencimento->format('d/m'),
                'category'       => $p->categoria
                    ? ['name' => $p->categoria->name, 'color' => $p->categoria->color]
                    : null,
            ]);
    }

    // -------------------------------------------------------------------------

    private function buildPayload(Parcela $p): array
    {
        $totalIrmas = Parcela::where('casa_id', $p->casa_id)
            ->where('titulo', $p->titulo)
            ->where('criado_por', $p->criado_por)
            ->count();

        return [
            'id'                   => $p->id,
            'tipo_registro'        => 'parcela',
            'titulo'               => $p->titulo,
            'valor'                => (float) $p->valor_parcela,
            'numero_parcela'       => $p->numero_parcela,
            'total_parcelas'       => $totalIrmas,
            'status'               => $p->status,
            'vencimento'           => $p->vencimento->format('Y-m-d'),
            'vencimento_resolvido' => $p->vencimento->format('Y-m-d'),
            'observacoes'          => $p->observacoes,
            'ciclo'                => $p->ciclo
                ? ['id' => $p->ciclo->id, 'name' => $p->ciclo->name]
                : null,
            'categoria'            => $p->categoria
                ? ['id' => $p->categoria->id, 'name' => $p->categoria->name, 'color' => $p->categoria->color]
                : null,
            'responsaveis'         => $p->responsaveis
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->toArray(),
        ];
    }
}
