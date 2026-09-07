<?php

namespace App\Repositories;

use App\Models\Parcela;
use App\Models\Parcelamento;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ParcelamentoRepository
{
    /**
     * Retorna as parcelas do mês com dados do parcelamento pai.
     */
    public function getParcelasForMonth(int $casaId, int $year, int $month): Collection
    {
        return Parcela::query()
            ->whereHas('parcelamento', fn ($q) => $q->where('casa_id', $casaId))
            ->with([
                'parcelamento.categoria:id,name,color',
                'parcelamento.ciclo:id,name',
                'parcelamento.responsaveis:id,name',
            ])
            ->whereYear('vencimento', $year)
            ->whereMonth('vencimento', $month)
            ->orderBy('vencimento')
            ->get()
            ->map(fn (Parcela $p) => $this->buildParcelaPayload($p));
    }

    /**
     * Retorna os N lançamentos de parcela mais recentes (para dashboard).
     */
    public function getRecent(int $casaId, int $limit = 5): Collection
    {
        return Parcela::query()
            ->whereHas('parcelamento', fn ($q) => $q->where('casa_id', $casaId))
            ->with('parcelamento.categoria:id,name,color')
            ->orderByDesc('vencimento')
            ->limit($limit)
            ->get()
            ->map(fn (Parcela $p) => [
                'id'             => $p->id,
                'title'          => "{$p->parcelamento->titulo} ({$p->numero_parcela}/{$p->parcelamento->total_parcelas})",
                'amount'         => (float) $p->valor_parcela,
                'type'           => 'parcela',
                'effective_date' => $p->vencimento->format('d/m'),
                'category'       => $p->parcelamento->categoria
                    ? ['name' => $p->parcelamento->categoria->name, 'color' => $p->parcelamento->categoria->color]
                    : null,
            ]);
    }

    /**
     * Retorna todos os parcelamentos de uma casa com suas parcelas.
     */
    public function getByHouse(int $casaId): Collection
    {
        return Parcelamento::query()
            ->with([
                'categoria:id,name,color',
                'ciclo:id,name',
                'responsaveis:id,name',
                'parcelas',
            ])
            ->where('casa_id', $casaId)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Cria um parcelamento com N parcelas.
     */
    public function create(
        int $casaId,
        int $userId,
        array $data,
        int $totalParcelas,
        string $vencimentoPrimeira,
        array $responsavelIds = [],
    ): Parcelamento {
        $valorParcela = (float) $data['valor_parcela'];

        $parcelamento = Parcelamento::create([
            'casa_id'        => $casaId,
            'ciclo_id'       => $data['ciclo_id'] ?? null,
            'categoria_id'   => $data['categoria_id'] ?? null,
            'criado_por'     => $userId,
            'titulo'         => $data['titulo'],
            'valor_total'    => $valorParcela * $totalParcelas,
            'total_parcelas' => $totalParcelas,
            'observacoes'    => $data['observacoes'] ?? null,
        ]);

        if (! empty($responsavelIds)) {
            $parcelamento->responsaveis()->sync($responsavelIds);
        }

        // Gerar as N parcelas
        $baseDate = Carbon::parse($vencimentoPrimeira);
        $origDay  = $baseDate->day;

        for ($i = 1; $i <= $totalParcelas; $i++) {
            $vencDate = $baseDate->copy();
            if ($i > 1) {
                $vencDate = Carbon::create($baseDate->year, $baseDate->month, 1)
                    ->addMonths($i - 1);
                $vencDate->day = min($origDay, $vencDate->daysInMonth);
            }

            Parcela::create([
                'parcelamento_id' => $parcelamento->id,
                'numero_parcela'  => $i,
                'valor_parcela'   => $valorParcela,
                'status'          => $data['status'] ?? Parcela::STATUS_ABERTO,
                'vencimento'      => $vencDate->format('Y-m-d'),
            ]);
        }

        return $parcelamento->load('parcelas');
    }

    /**
     * Atualiza dados do grupo (parcelamento).
     */
    public function updateParcelamento(Parcelamento $parcelamento, array $data, ?array $responsavelIds): Parcelamento
    {
        $allowed = ['titulo', 'ciclo_id', 'categoria_id', 'observacoes'];

        $parcelamento->fill(array_intersect_key($data, array_flip($allowed)));
        $parcelamento->save();

        if ($responsavelIds !== null) {
            $parcelamento->responsaveis()->sync($responsavelIds);
        }

        return $parcelamento;
    }

    /**
     * Atualiza uma parcela individual (status, valor, vencimento).
     */
    public function updateParcela(Parcela $parcela, array $data): Parcela
    {
        $allowed = ['valor_parcela', 'status', 'vencimento'];

        $parcela->fill(array_intersect_key($data, array_flip($allowed)));
        $parcela->save();

        // Se mudou valor, recalcula valor_total do parcelamento pai
        if (isset($data['valor_parcela'])) {
            $parcelamento = $parcela->parcelamento;
            $parcelamento->valor_total = $parcelamento->parcelas()->sum('valor_parcela');
            $parcelamento->save();
        }

        return $parcela;
    }

    /**
     * Remove um parcelamento inteiro (cascadeia para as parcelas).
     */
    public function deleteParcelamento(Parcelamento $parcelamento): void
    {
        $parcelamento->responsaveis()->detach();
        $parcelamento->delete(); // cascadeOnDelete remove as parcelas
    }

    /**
     * Remove uma parcela individual e atualiza o parcelamento pai.
     */
    public function deleteParcela(Parcela $parcela): void
    {
        $parcelamento = $parcela->parcelamento;
        $parcela->delete();

        // Atualiza contadores do pai
        $parcelamento->total_parcelas = $parcelamento->parcelas()->count();
        $parcelamento->valor_total    = $parcelamento->parcelas()->sum('valor_parcela');
        $parcelamento->save();

        // Se não sobrou nenhuma parcela, remove o parcelamento
        if ($parcelamento->total_parcelas === 0) {
            $parcelamento->responsaveis()->detach();
            $parcelamento->delete();
        }
    }

    // -------------------------------------------------------------------------
    // Privados
    // -------------------------------------------------------------------------

    private function buildParcelaPayload(Parcela $p): array
    {
        $par = $p->parcelamento;

        return [
            'id'                   => $p->id,
            'parcelamento_id'      => $par->id,
            'tipo_registro'        => 'parcela',
            'titulo'               => $par->titulo,
            'valor'                => (float) $p->valor_parcela,
            'numero_parcela'       => $p->numero_parcela,
            'total_parcelas'       => $par->total_parcelas,
            'status'               => $p->status,
            'vencimento'           => $p->vencimento->format('Y-m-d'),
            'vencimento_resolvido' => $p->vencimento->format('Y-m-d'),
            'observacoes'          => $par->observacoes,
            'ciclo'                => $par->ciclo
                ? ['id' => $par->ciclo->id, 'name' => $par->ciclo->name]
                : null,
            'categoria'            => $par->categoria
                ? ['id' => $par->categoria->id, 'name' => $par->categoria->name, 'color' => $par->categoria->color]
                : null,
            'responsaveis'         => $par->responsaveis
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->toArray(),
        ];
    }
}
