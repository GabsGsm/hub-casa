<?php

namespace App\Repositories;

use App\Models\FinancialTransaction;
use Illuminate\Support\Collection;

class FinancialTransactionRepository
{
    /**
     * Retorna todas as transações de uma casa com relações carregadas,
     * ordenadas por vencimento e data de criação.
     */
    public function getByHouse(int $houseId): Collection
    {
        return FinancialTransaction::query()
            ->with('category:id,name,color', 'cycle:id,name,day_of_month', 'assignees:id,name')
            ->where('house_id', $houseId)
            ->orderByDesc('due_date')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Cria uma transação e sincroniza os responsáveis.
     */
    public function create(int $houseId, int $userId, array $data, array $assigneeIds = []): FinancialTransaction
    {
        $transaction = FinancialTransaction::create([
            'house_id'          => $houseId,
            'payment_cycle_id'  => $data['payment_cycle_id'] ?? null,
            'category_id'       => $data['category_id'] ?? null,
            'created_by'        => $userId,
            'title'             => $data['title'],
            'amount'            => $data['amount'],
            'type'              => $data['type'],
            'status'            => $data['status'],
            'due_date'          => $data['due_date'] ?? null,
            'recurrence'        => $data['recurrence'] ?? null,
            'installments_count'=> $data['installments_count'] ?? null,
        ]);

        if (! empty($assigneeIds)) {
            $transaction->assignees()->sync($assigneeIds);
        }

        return $transaction;
    }

    /**
     * Atualiza os campos não-nulos da transação e sincroniza responsáveis
     * quando $assigneeIds for fornecido (null = não alterar).
     */
    public function update(FinancialTransaction $transaction, array $data, ?array $assigneeIds): FinancialTransaction
    {
        $transaction->fill(array_filter($data, fn ($value) => $value !== null));
        $transaction->save();

        if ($assigneeIds !== null) {
            $transaction->assignees()->sync($assigneeIds);
        }

        return $transaction;
    }

    /**
     * Remove uma transação e desvincula responsáveis.
     */
    public function delete(FinancialTransaction $transaction): void
    {
        $transaction->assignees()->detach();
        $transaction->delete();
    }
}
