<?php

namespace App\Repositories;

use App\Models\FinancialTransaction;
use App\Models\PaymentCycle;
use Illuminate\Support\Collection;

class PaymentCycleRepository
{
    /**
     * Retorna todos os ciclos de uma casa, ordenados por dia do mês.
     */
    public function getByHouse(int $houseId): Collection
    {
        return PaymentCycle::query()
            ->where('house_id', $houseId)
            ->orderByRaw('day_of_month is null')
            ->orderBy('day_of_month')
            ->get();
    }

    /**
     * Retorna as transações da casa agrupadas por payment_cycle_id,
     * usado para calcular os totais pago/pendente de cada ciclo.
     */
    public function getTransactionsTotalsGrouped(int $houseId): Collection
    {
        return FinancialTransaction::query()
            ->where('house_id', $houseId)
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
            'day_of_month'    => $data['day_of_month'] ?? null,
            'expected_amount' => $data['expected_amount'] ?? 0,
            'recurring'       => true,
            'active'          => true,
        ]);
    }

    /**
     * Atualiza os campos não-nulos de um ciclo.
     */
    public function update(PaymentCycle $cycle, array $data): PaymentCycle
    {
        $cycle->fill(array_filter($data, fn ($v) => $v !== null));
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
