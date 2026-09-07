<?php

namespace App\Services;

use App\Concerns\AuthorizesHouseResource;
use App\Models\Category;
use App\Models\Ganho;
use App\Models\Gasto;
use App\Models\House;
use App\Models\Parcela;
use App\Models\Parcelamento;
use App\Models\PaymentCycle;
use App\Models\User;
use App\Repositories\GanhoRepository;
use App\Repositories\GastoRepository;
use App\Repositories\ParcelamentoRepository;
use App\Repositories\PaymentCycleRepository;
use Illuminate\Support\Collection;

class FinanceiroService
{
    use AuthorizesHouseResource;

    public function __construct(
        private readonly PaymentCycleRepository $cycleRepo,
        private readonly GastoRepository $gastoRepo,
        private readonly GanhoRepository $ganhoRepo,
        private readonly ParcelamentoRepository $parcelamentoRepo,
    ) {}

    /**
     * Monta todos os dados necessários para a página /financeiro.
     */
    public function getPageData(House $house, int $year, int $month, string $visao = 'casa', int $userId = 0): array
    {
        $isIndividual = ($visao === 'individual' && $userId > 0);

        // Ciclos: casa mostra todos; individual mostra só os do usuário
        $allCycles = $this->cycleRepo->getByHouse($house->id);
        $cycles    = $isIndividual
            ? $allCycles->where('user_id', $userId)->values()
            : $allCycles;

        $gastos   = $this->gastoRepo->getResolvedForMonth($house->id, $year, $month);
        $ganhos   = $this->ganhoRepo->getForMonth($house->id, $year, $month);
        $parcelas = $this->parcelamentoRepo->getParcelasForMonth($house->id, $year, $month);

        // Filtro individual: manter apenas lançamentos onde o userId é membro
        if ($isIndividual) {
            $gastos   = $gastos->filter(fn ($g) => collect($g['responsaveis'])->pluck('id')->contains($userId));
            $parcelas = $parcelas->filter(fn ($p) => collect($p['responsaveis'])->pluck('id')->contains($userId));
            // Ganhos: sem filtro de membro — são receitas gerais
        }

        $lancamentos = $gastos
            ->merge($ganhos)
            ->merge($parcelas)
            ->sortBy('vencimento_resolvido')
            ->values();

        $despesas    = $gastos->merge($parcelas);
        $cycleTotals = $this->buildCycleTotals($cycles, $despesas, $isIndividual ? $userId : null);

        // Resumo: visão individual usa valor do membro; casa usa valor total
        if ($isIndividual) {
            $totalReceitas = $ganhos->where('status', '!=', 'impossibilitado')->sum('valor')
                + $cycles->sum('expected_amount');

            $totalDespesas = $despesas
                ->where('status', '!=', 'impossibilitado')
                ->sum(function ($item) use ($userId) {
                    $membro = collect($item['membros_valor'] ?? [])
                        ->firstWhere('user_id', $userId);
                    return $membro ? $membro['valor'] : $item['valor'];
                });
        } else {
            $totalGanhos   = $ganhos->where('status', '!=', 'impossibilitado')->sum('valor');
            $totalCiclos   = $cycles->sum('expected_amount');
            $totalReceitas = $totalCiclos + $totalGanhos;
            $totalDespesas = $despesas->where('status', '!=', 'impossibilitado')->sum('valor');
        }

        // Passar user_color e user_id nos ciclos (para borda colorida)
        $cycleTotalsWithUser = $cycleTotals->map(function ($c) use ($allCycles) {
            $cycle = $allCycles->firstWhere('id', $c['id']);
            return array_merge($c, [
                'user_id'    => $cycle?->user_id,
                'user_color' => $cycle?->user?->color,
                'user_name'  => $cycle?->user?->name,
            ]);
        });

        return [
            'house'        => ['id' => $house->id, 'name' => $house->name],
            'cycles'       => $cycleTotalsWithUser,
            'lancamentos'  => $lancamentos,
            'resumo'       => [
                'total_receitas' => (float) $totalReceitas,
                'total_despesas' => (float) $totalDespesas,
                'saldo'          => (float) ($totalReceitas - $totalDespesas),
            ],
            'categories'   => Category::query()
                ->where('house_id', $house->id)
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
            'members'      => $house->users()->get(['id', 'name', 'color']),
            'year'         => $year,
            'month'        => $month,
            'visao'        => $visao,
        ];
    }

    // ── Gastos ────────────────────────────────────────────────────────────────

    public function createGasto(House $house, User $user, array $data): Gasto
    {
        $this->assertCycleBelongsToHouse($house->id, $data['ciclo_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        return $this->gastoRepo->create(
            $house->id,
            $user->id,
            $data,
            $data['responsavel_ids'] ?? [],
        );
    }

    public function updateGasto(House $house, User $user, Gasto $gasto, array $data): Gasto
    {
        $this->ensureCanEdit($user, $gasto);
        $this->assertCycleBelongsToHouse($house->id, $data['ciclo_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        // Se vier o novo formato membros, usa; senão usa responsavel_ids (fallback)
        $responsavelIds = null;
        if (! isset($data['membros']) && array_key_exists('responsavel_ids', $data)) {
            $responsavelIds = $data['responsavel_ids'] ?? [];
        }

        return $this->gastoRepo->update($gasto, $data, $responsavelIds);
    }

    public function deleteGasto(User $user, Gasto $gasto): void
    {
        $this->ensureCanEdit($user, $gasto);
        $this->gastoRepo->delete($gasto);
    }

    // ── Ganhos ────────────────────────────────────────────────────────────────

    public function createGanho(House $house, User $user, array $data): Ganho
    {
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        return $this->ganhoRepo->create($house->id, $user->id, $data);
    }

    public function updateGanho(House $house, User $user, Ganho $ganho, array $data): Ganho
    {
        $this->ensureCanEdit($user, $ganho);
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        return $this->ganhoRepo->update($ganho, $data);
    }

    public function deleteGanho(User $user, Ganho $ganho): void
    {
        $this->ensureCanEdit($user, $ganho);
        $this->ganhoRepo->delete($ganho);
    }

    // ── Parcelamentos ────────────────────────────────────────────────────────

    public function createParcelamento(House $house, User $user, array $data): Parcelamento
    {
        $this->assertCycleBelongsToHouse($house->id, $data['ciclo_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        return $this->parcelamentoRepo->create(
            $house->id,
            $user->id,
            $data,
            (int) $data['total_parcelas'],
            $data['vencimento_primeira'],
            $data['responsavel_ids'] ?? [],
        );
    }

    public function updateParcelamento(House $house, User $user, Parcelamento $parcelamento, array $data): Parcelamento
    {
        $this->ensureCanEdit($user, $parcelamento);
        $this->assertCycleBelongsToHouse($house->id, $data['ciclo_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['categoria_id'] ?? null);

        $responsavelIds = array_key_exists('responsavel_ids', $data)
            ? ($data['responsavel_ids'] ?? [])
            : null;

        return $this->parcelamentoRepo->updateParcelamento($parcelamento, $data, $responsavelIds);
    }

    public function deleteParcelamento(User $user, Parcelamento $parcelamento): void
    {
        $this->ensureCanEdit($user, $parcelamento);
        $this->parcelamentoRepo->deleteParcelamento($parcelamento);
    }

    // ── Parcela individual ───────────────────────────────────────────────────

    public function addParcela(User $user, Parcelamento $parcelamento, array $data): Parcela
    {
        $this->ensureCanEdit($user, $parcelamento);

        return $this->parcelamentoRepo->addParcela($parcelamento, $data);
    }

    public function updateParcela(User $user, Parcela $parcela, array $data): Parcela
    {
        $this->ensureCanEdit($user, $parcela->parcelamento);

        return $this->parcelamentoRepo->updateParcela($parcela, $data);
    }

    public function deleteParcela(User $user, Parcela $parcela): void
    {
        $this->ensureCanEdit($user, $parcela->parcelamento);
        $this->parcelamentoRepo->deleteParcela($parcela);
    }

    // ── Ciclos ────────────────────────────────────────────────────────────────

    public function createCycle(House $house, User $user, array $data): PaymentCycle
    {
        return $this->cycleRepo->create($house->id, $user->id, $data);
    }

    public function updateCycle(House $house, PaymentCycle $cycle, array $data): PaymentCycle
    {
        if ($cycle->house_id !== $house->id) {
            abort(403);
        }

        return $this->cycleRepo->update($cycle, $data);
    }

    public function deleteCycle(House $house, PaymentCycle $cycle): void
    {
        if ($cycle->house_id !== $house->id) {
            abort(403);
        }

        $this->cycleRepo->delete($cycle);
    }

    // -------------------------------------------------------------------------
    // Privados
    // -------------------------------------------------------------------------

    private function buildCycleTotals(Collection $cycles, Collection $despesas, ?int $userId = null): Collection
    {
        // Montar mapa plano: ciclo_id → [{valor, status}]
        // Quando o lançamento tem membros_valor com ciclo_id próprio, usar esses; senão, usar ciclo da transação.
        $byCiclo = [];

        foreach ($despesas as $t) {
            if (! empty($t['membros_valor'])) {
                foreach ($t['membros_valor'] as $mv) {
                    if ($userId !== null && (int) $mv['user_id'] !== $userId) {
                        continue;
                    }
                    $key           = $mv['ciclo_id'] ?? 0;
                    $byCiclo[$key][] = ['valor' => (float) $mv['valor'], 'status' => $t['status']];
                }
            } else {
                // Sem membros, usar ciclo da transação
                if ($userId !== null) {
                    continue; // não atribuído a ninguém, ignorar em individual
                }
                $key           = $t['ciclo']['id'] ?? 0;
                $byCiclo[$key][] = ['valor' => (float) $t['valor'], 'status' => $t['status']];
            }
        }

        return $cycles->map(function (PaymentCycle $cycle) use ($byCiclo) {
            $items = $byCiclo[$cycle->id] ?? [];

            $paid    = (float) array_sum(array_column(
                array_filter($items, fn ($i) => $i['status'] === 'pago'),
                'valor',
            ));
            $pending = (float) array_sum(array_column(
                array_filter($items, fn ($i) => $i['status'] === 'aberto'),
                'valor',
            ));

            return [
                'id'              => $cycle->id,
                'name'            => $cycle->name,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid'            => $paid,
                'pending'         => $pending,
                'committed'       => $paid + $pending,
            ];
        });
    }

    private function assertCycleBelongsToHouse(int $houseId, mixed $cycleId): void
    {
        if (empty($cycleId)) {
            return;
        }

        PaymentCycle::where('house_id', $houseId)
            ->where('id', $cycleId)
            ->firstOrFail();
    }

    private function assertCategoryBelongsToHouse(int $houseId, mixed $categoryId): void
    {
        if (empty($categoryId)) {
            return;
        }

        Category::where('house_id', $houseId)
            ->where('id', $categoryId)
            ->firstOrFail();
    }
}
