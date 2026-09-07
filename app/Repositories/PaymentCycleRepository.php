<?php

namespace App\Repositories;

use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use Illuminate\Support\Collection;

class PaymentCycleRepository
{
    /**
     * Retorna todos os ciclos de uma casa, ordenados por nome.
     */
    public function getByHouse(int $houseId): Collection
    {
        return PaymentCycle::query()
            ->where('house_id', $houseId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Retorna as transações da casa agrupadas por payment_cycle_id,
     * excluindo impossibilitados do cálculo de totais.
     */
    public function getTransactionsTotalsGrouped(int $houseId): Collection
    {
        return FinancialTransaction::query()
            ->where('house_id', $houseId)
            ->where('status', '!=', FinancialTransaction::STATUS_IMPOSSIBLE)
            ->get()
            ->groupBy('payment_cycle_id');
    }

    /**
     * Cria um novo ciclo de pagamento.
     */
    public function create(int $houseId, int $userId, array $data): PaymentCycle
    {
        return PaymentCycle::create([
            'house_id'        => $houseId,
            'user_id'         => $userId,
            'name'            => $data['name'],
            'expected_amount' => $data['expected_amount'] ?? 0,
            'active'          => true,
        ]);
    }

    /**
     * Atualiza os campos não-nulos de um ciclo.
     */
    public function update(PaymentCycle $cycle, array $data): PaymentCycle
    {
        $allowed = ['name', 'expected_amount', 'active'];
        $cycle->fill(array_intersect_key($data, array_flip($allowed)));
        $cycle->save();

        return $cycle;
    }

    /**
     * Remove um ciclo (lançamentos vinculados terão payment_cycle_id = null por nullOnDelete).
     */
    public function delete(PaymentCycle $cycle): void
    {
        $cycle->delete();
    }
}
