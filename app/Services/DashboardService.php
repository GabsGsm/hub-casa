<?php

namespace App\Services;

use App\Models\House;
use App\Models\PaymentCycle;
use App\Repositories\AgendaEventRepository;
use App\Repositories\GanhoRepository;
use App\Repositories\GastoRepository;
use App\Repositories\ProdutoRepository;
use App\Repositories\ParcelamentoRepository;
use App\Repositories\PaymentCycleRepository;
use App\Repositories\TaskRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
    public function __construct(
        private readonly GastoRepository $gastoRepo,
        private readonly GanhoRepository $ganhoRepo,
        private readonly ParcelamentoRepository $parcelamentoRepo,
        private readonly PaymentCycleRepository $cycleRepo,
        private readonly TaskRepository $taskRepo,
        private readonly ProdutoRepository $produtoRepo,
        private readonly AgendaEventRepository $agendaRepo,
    ) {}

    public function getPageData(House $house): array
    {
        $now   = Carbon::now();
        $today = Carbon::today();

        $gastos   = $this->gastoRepo->getResolvedForMonth($house->id, $now->year, $now->month);
        $ganhos   = $this->ganhoRepo->getForMonth($house->id, $now->year, $now->month);
        $parcelas = $this->parcelamentoRepo->getParcelasForMonth($house->id, $now->year, $now->month);

        $despesas      = $gastos->merge($parcelas);
        $cyclesPayload = $this->buildCyclesPayload($house->id, $despesas);
        $activeCycle   = $this->resolveActiveCycle($cyclesPayload);
        $payable       = $this->resolvePayable($despesas);

        $tasksToday = $this->taskRepo->getTodayTasks($house->id);
        $taskStats  = $this->taskRepo->getStats($house->id);

        $recentTransactions = $this->getRecentLancamentos($house->id, 5);

        $dispensaAlerts = $this->produtoRepo->countEstoqueBaixo($house->id);
        $upcomingEvents = $this->agendaRepo->getUpcoming($house->id, 4);

        return [
            'house' => ['id' => $house->id, 'name' => $house->name],
            'stats' => [
                'activeCycle' => $activeCycle,
                'payable'     => $payable,
                'tasks'       => $taskStats,
                'dispensa'    => ['alerts' => $dispensaAlerts],
            ],
            'cycles'         => $cyclesPayload,
            'transactions'   => $recentTransactions,
            'tasksToday'     => $tasksToday,
            'todayLabel'     => $today->locale('pt_BR')->translatedFormat('l, d'),
            'upcomingEvents' => $upcomingEvents,
        ];
    }

    // -------------------------------------------------------------------------

    private function buildCyclesPayload(int $houseId, Collection $despesas): Collection
    {
        $cycles  = $this->cycleRepo->getByHouse($houseId);
        $grouped = $despesas->groupBy(fn ($t) => $t['ciclo']['id'] ?? 0);

        $payload = $cycles->map(function (PaymentCycle $cycle) use ($grouped) {
            $items   = $grouped->get($cycle->id, collect())->filter(fn ($t) => $t['status'] !== 'impossibilitado');
            $paid    = (float) $items->where('status', 'pago')->sum('valor');
            $pending = (float) $items->where('status', '!=', 'pago')->sum('valor');

            return [
                'id' => $cycle->id, 'name' => $cycle->name,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid' => $paid, 'pending' => $pending, 'committed' => $paid + $pending,
            ];
        });

        $noCycle = $grouped->get(0, collect())->filter(fn ($t) => $t['status'] !== 'impossibilitado');
        $nP = (float) $noCycle->where('status', 'pago')->sum('valor');
        $nPe = (float) $noCycle->where('status', '!=', 'pago')->sum('valor');

        if ($nP > 0 || $nPe > 0) {
            $payload->push([
                'id' => 0, 'name' => 'Sem ciclo', 'expected_amount' => 0.0,
                'paid' => $nP, 'pending' => $nPe, 'committed' => $nP + $nPe,
            ]);
        }

        return $payload;
    }

    private function resolveActiveCycle(Collection $cyclesPayload): ?array
    {
        return $cyclesPayload
            ->filter(fn ($c) => $c['id'] !== 0)
            ->sortByDesc(fn ($c) => $c['pending'] * 10000 + $c['committed'])
            ->first() ?? $cyclesPayload->first();
    }

    private function resolvePayable(Collection $despesas): array
    {
        $due = $despesas->filter(fn ($t) => $t['status'] !== 'pago' && $t['status'] !== 'impossibilitado');

        return ['amount' => (float) $due->sum('valor'), 'count' => $due->count()];
    }

    private function getRecentLancamentos(int $houseId, int $limit): Collection
    {
        return $this->gastoRepo->getRecent($houseId, $limit)
            ->merge($this->ganhoRepo->getRecent($houseId, $limit))
            ->merge($this->parcelamentoRepo->getRecent($houseId, $limit))
            ->sortByDesc('effective_date')
            ->take($limit)
            ->values();
    }
}
