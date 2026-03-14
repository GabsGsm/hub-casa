<?php

namespace App\Services;

use App\Models\Category;
use App\Models\FinancialTransaction;
use App\Models\House;
use App\Models\PaymentCycle;
use App\Models\User;
use App\Repositories\FinancialTransactionRepository;
use App\Repositories\PaymentCycleRepository;
use Illuminate\Support\Collection;

class FinanceiroService
{
    public function __construct(
        private readonly PaymentCycleRepository $cycleRepo,
        private readonly FinancialTransactionRepository $transactionRepo,
    ) {}

    /**
     * Monta todos os dados necessários para a página /financeiro.
     */
    public function getPageData(House $house): array
    {
        $cycles       = $this->cycleRepo->getByHouse($house->id);
        $transactions = $this->transactionRepo->getByHouse($house->id);
        $cycleTotals  = $this->cycleRepo->getTransactionsTotalsGrouped($house->id);

        return [
            'house'        => ['id' => $house->id, 'name' => $house->name],
            'cycles'       => $this->buildCyclesPayload($cycles, $cycleTotals),
            'transactions' => $this->buildTransactionsPayload($transactions),
            'categories'   => Category::query()
                ->where('house_id', $house->id)
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
            'members'      => $house->users()->get(['id', 'name']),
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
        $this->assertCycleBelongsToHouse($house->id, $cycle->id);

        return $this->cycleRepo->update($cycle, $data);
    }

    /**
     * Remove um ciclo garantindo que pertence à casa.
     */
    public function deleteCycle(House $house, PaymentCycle $cycle): void
    {
        $this->assertCycleBelongsToHouse($house->id, $cycle->id);
        $this->cycleRepo->delete($cycle);
    }

    /**
     * Remove uma transação.
     */
    public function deleteTransaction(User $user, FinancialTransaction $transaction): void
    {
        $this->authorize($user, $transaction);
        $this->transactionRepo->delete($transaction);
    }

    /**
     * Cria uma nova transação financeira.
     * Garante que ciclo e categoria pertencem à mesma casa.
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
     * Verifica autorização e integridade de ciclo/categoria.
     */
    public function updateTransaction(
        House $house,
        User $user,
        FinancialTransaction $transaction,
        array $data,
    ): FinancialTransaction {
        $this->authorize($user, $transaction);
        $this->assertCycleBelongsToHouse($house->id, $data['payment_cycle_id'] ?? null);
        $this->assertCategoryBelongsToHouse($house->id, $data['category_id'] ?? null);

        $assigneeIds = array_key_exists('assignee_ids', $data)
            ? ($data['assignee_ids'] ?? [])
            : null;

        return $this->transactionRepo->update($transaction, $data, $assigneeIds);
    }

    /**
     * Verifica se o usuário pode editar a transação.
     * Regras: mesmo house + (admin OU criador OU assignee).
     */
    public function authorize(User $user, FinancialTransaction $transaction): void
    {
        if ($transaction->house_id !== $user->house_id) {
            abort(403);
        }

        if ($user->isAdmin() || $transaction->created_by === $user->id) {
            return;
        }

        if ($transaction->assignees()->where('user_id', $user->id)->exists()) {
            return;
        }

        abort(403);
    }

    // -------------------------------------------------------------------------
    // Privados
    // -------------------------------------------------------------------------

    private function buildCyclesPayload(Collection $cycles, Collection $cycleTotals): Collection
    {
        return $cycles->map(function (PaymentCycle $cycle) use ($cycleTotals) {
            $transactions = $cycleTotals->get($cycle->id, collect());

            $paid = $transactions
                ->where('status', FinancialTransaction::STATUS_PAID)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            $pending = $transactions
                ->where('status', '!=', FinancialTransaction::STATUS_PAID)
                ->where('type', '!=', FinancialTransaction::TYPE_INCOME)
                ->sum('amount');

            return [
                'id'              => $cycle->id,
                'name'            => $cycle->name,
                'day_of_month'    => $cycle->day_of_month,
                'expected_amount' => (float) $cycle->expected_amount,
                'paid'            => (float) $paid,
                'pending'         => (float) $pending,
            ];
        });
    }

    private function buildTransactionsPayload(Collection $transactions): Collection
    {
        return $transactions->map(fn (FinancialTransaction $t) => [
            'id'                 => $t->id,
            'title'              => $t->title,
            'amount'             => (float) $t->amount,
            'type'               => $t->type,
            'status'             => $t->status,
            'due_date'           => optional($t->due_date)->format('Y-m-d'),
            'recurrence'         => $t->recurrence,
            'installments_count' => $t->installments_count,
            'cycle'              => $t->cycle ? [
                'id'           => $t->cycle->id,
                'name'         => $t->cycle->name,
                'day_of_month' => $t->cycle->day_of_month,
            ] : null,
            'category'           => $t->category ? [
                'id'    => $t->category->id,
                'name'  => $t->category->name,
                'color' => $t->category->color,
            ] : null,
            'assignees'          => $t->assignees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ]),
        ]);
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
