<?php

namespace App\Services;

use App\Concerns\AuthorizesHouseResource;
use App\Models\Category;
use App\Models\FinancialTransaction;
use App\Models\House;
use App\Models\PaymentCycle;
use App\Models\User;
use App\Repositories\FinancialTransactionRepository;
use App\Repositories\PaymentCycleRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FinanceiroService
{
    use AuthorizesHouseResource;

    public function __construct(
        private readonly PaymentCycleRepository $cycleRepo,
        private readonly FinancialTransactionRepository $transactionRepo,
    ) {}

    /**
     * Monta todos os dados necessários para a página /financeiro.
     *
     * @param  int  $month  Mês 1-indexed (1=Janeiro)
     */
    public function getPageData(House $house, int $year, int $month): array
    {
        $cycles       = $this->cycleRepo->getByHouse($house->id);
        $transactions = $this->transactionRepo->getResolvedForMonth($house->id, $year, $month);
        $cycleTotals  = $transactions->groupBy(fn ($t) => $t['cycle']['id'] ?? null);

        return [
            'house'        => ['id' => $house->id, 'name' => $house->name],
            'cycles'       => $this->buildCyclesPayload($cycles, $cycleTotals),
            'transactions' => $transactions->values(),
            'categories'   => Category::query()
                ->where('house_id', $house->id)
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
            'members'      => $house->users()->get(['id', 'name']),
            'year'         => $year,
            'month'        => $month,
        ];
    }

    /**
     * Cria um novo ciclo de pagamento para a casa.
     */
    public function createCycle(House $house, User $user, array $data): PaymentCycle
    {
        return $this->cycleRepo->create($house->id, $user->id, $data);
    }

    /**
     * Atualiza um ciclo garantindo que pertence à casa.
     */
    public function updateCycle(House $house, PaymentCycle $cycle, array $data): PaymentCycle
    {
        if ($cycle->house_id !== $house->id) {
            abort(403);
        }

        return $this->cycleRepo->update($cycle, $data);
    }

    /**
     * Remove um ciclo garantindo que pertence à casa.
     */
    public function deleteCycle(House $house, PaymentCycle $cycle): void
    {
        if ($cycle->house_id !== $house->id) {
            abort(403);
        }

        $this->cycleRepo->delete($cycle);
    }

    /**
     * Remove uma transação.
     */
    public function deleteTransaction(User $user, FinancialTransaction $transaction): void
    {
        $this->ensureCanEdit($user, $transaction);
        $this->transactionRepo->delete($transaction);
    }

    /**
     * Cria uma nova transação financeira.
     */
    public function createTransaction(House $house, User $user, array $data): FinancialTransaction
    {
        $this->assertCycleBelongsToHouse($house->id, $data['payment_cycle_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['category_id'] ?? null);

        return $this->transactionRepo->create(
            $house->id,
            $user->id,
            $data,
            $data['assignee_ids'] ?? [],
        );
    }

    /**
     * Atualiza uma transação existente.
     */
    public function updateTransaction(
        House $house,
        User $user,
        FinancialTransaction $transaction,
        array $data,
    ): FinancialTransaction {
        $this->ensureCanEdit($user, $transaction);
        $this->assertCycleBelongsToHouse($house->id, $data['payment_cycle_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['category_id'] ?? null);

        $assigneeIds = array_key_exists('assignee_ids', $data)
            ? ($data['assignee_ids'] ?? [])
            : null;

        return $this->transactionRepo->update($transaction, $data, $assigneeIds);
    }

    // -------------------------------------------------------------------------
    // Privados
    // -------------------------------------------------------------------------

    private function buildCyclesPayload(Collection $cycles, Collection $cycleTotals): Collection
    {
        return $cycles->map(function (PaymentCycle $cycle) use ($cycleTotals) {
            $transactions = $cycleTotals->get($cycle->id, collect());

            $paid = collect($transactions)
                ->where('status', FinancialTransaction::STATUS_PAID)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            $pending = collect($transactions)
                ->where('status', FinancialTransaction::STATUS_OPEN)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            return [
                'id'              => $cycle->id,
                'name'            => $cycle->name,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid'            => (float) $paid,
                'pending'         => (float) $pending,
                'committed'       => (float) ($paid + $pending),
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
