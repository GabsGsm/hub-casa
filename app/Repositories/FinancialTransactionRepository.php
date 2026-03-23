<?php

namespace App\Repositories;

use App\Models\FinancialTransaction;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class FinancialTransactionRepository
{
    /**
     * Retorna todas as transações de uma casa com relações carregadas.
     */
    public function getByHouse(int $houseId): Collection
    {
        return FinancialTransaction::query()
            ->with('category:id,name,color', 'cycle:id,name', 'assignees:id,name')
            ->where('house_id', $houseId)
            ->orderByDesc('due_date')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Retorna os lançamentos resolvidos para um mês específico.
     * Porta a lógica que estava em resolveTransactionsForMonth (utils.ts) para o backend.
     *
     * @param  int  $month  Mês 1-indexed (1=Janeiro)
     */
    public function getResolvedForMonth(int $houseId, int $year, int $month): Collection
    {
        $all = FinancialTransaction::query()
            ->with('category:id,name,color', 'cycle:id,name', 'assignees:id,name')
            ->where('house_id', $houseId)
            ->get();

        $result = collect();

        $now              = Carbon::now();
        $isCurrentMonth   = ($year === $now->year && $month === $now->month);

        foreach ($all as $t) {
            $effectiveDate = Carbon::parse($t->due_date ?? $t->created_at);
            $oy       = $effectiveDate->year;
            $om       = $effectiveDate->month; // 1-indexed
            $origDay  = $effectiveDate->day;

            if ($t->is_recurring) {
                $created       = Carbon::parse($t->created_at);
                $afterCreation = ($year > $created->year)
                    || ($year === $created->year && $month >= $created->month);

                if (! $afterCreation) {
                    continue;
                }

                $dueDateMatchesQuery = ($oy === $year && $om === $month);

                if ($isCurrentMonth && ! $dueDateMatchesQuery) {
                    // Mês virou: o due_date está desatualizado — reseta no BD
                    $newDay      = min($t->recurrence_day ?? $origDay, Carbon::create($year, $month, 1)->daysInMonth);
                    $newDueDate  = Carbon::create($year, $month, $newDay);
                    $t->due_date = $newDueDate;
                    $t->status   = FinancialTransaction::STATUS_OPEN;
                    $t->saveQuietly(); // salva sem disparar eventos/observers

                    $result->push($this->buildPayload($t, $newDueDate->format('Y-m-d'), null, FinancialTransaction::STATUS_OPEN));
                } elseif (! $isCurrentMonth) {
                    // Projeção (futuro ou passado): sempre aberto
                    $result->push($this->buildPayload(
                        $t,
                        $this->projectedDate($origDay, $year, $month),
                        null,
                        FinancialTransaction::STATUS_OPEN,
                    ));
                } else {
                    // Mês atual e due_date já corresponde: usa status real
                    $result->push($this->buildPayload($t, $effectiveDate->format('Y-m-d')));
                }
            } elseif ($t->type === FinancialTransaction::TYPE_DEBT && $t->installments_total) {
                $installNum0 = ($year - $oy) * 12 + ($month - $om); // 0-based

                if ($installNum0 < 0 || $installNum0 >= $t->installments_total) {
                    continue;
                }

                $installNum1 = $installNum0 + 1;                   // 1-based
                $current     = $t->installment_current ?? 1;

                // Parcelas anteriores ao tracker: já pagas
                // Parcela atual: status real do BD
                // Parcelas futuras: ainda abertas
                if ($installNum1 < $current) {
                    $effectiveStatus = FinancialTransaction::STATUS_PAID;
                } elseif ($installNum1 === $current) {
                    $effectiveStatus = $t->status;
                } else {
                    $effectiveStatus = FinancialTransaction::STATUS_OPEN;
                }

                $result->push($this->buildPayload(
                    $t,
                    $this->projectedDate($origDay, $year, $month),
                    $installNum1,
                    $effectiveStatus,
                ));
            } else {
                if ($oy === $year && $om === $month) {
                    $result->push($this->buildPayload($t, $effectiveDate->format('Y-m-d')));
                }
            }
        }

        return $result->sortBy('resolved_date')->values();
    }

    /**
     * Retorna transações paginadas com filtros para a tab "Todos os Lançamentos".
     */
    public function getFilteredPaginated(int $houseId, array $filters, int $perPage = 30): LengthAwarePaginator
    {
        $query = FinancialTransaction::query()
            ->with('category:id,name,color', 'cycle:id,name', 'assignees:id,name')
            ->where('house_id', $houseId);

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['cycle_id'])) {
            $query->where('payment_cycle_id', $filters['cycle_id']);
        }
        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }

        return $query
            ->orderByDesc('due_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Cria uma transação e sincroniza os responsáveis.
     */
    public function create(int $houseId, int $userId, array $data, array $assigneeIds = []): FinancialTransaction
    {
        $transaction = FinancialTransaction::create([
            'house_id'           => $houseId,
            'payment_cycle_id'   => $data['payment_cycle_id'] ?? null,
            'category_id'        => $data['category_id'] ?? null,
            'created_by'         => $userId,
            'title'              => $data['title'],
            'amount'             => $data['amount'],
            'type'               => $data['type'],
            'status'             => $data['status'],
            'due_date'           => $data['due_date'] ?? null,
            'is_recurring'        => $data['is_recurring'] ?? false,
            'recurrence_day'      => $data['recurrence_day'] ?? null,
            'installments_total'  => $data['installments_total'] ?? null,
            'installment_current' => 1, // sempre começa na 1ª parcela
            'installment_amount'  => $data['installment_amount'] ?? null,
            'notes'               => $data['notes'] ?? null,
        ]);

        if (! empty($assigneeIds)) {
            $transaction->assignees()->sync($assigneeIds);
        }

        return $transaction;
    }

    /**
     * Atualiza os campos da transação e sincroniza responsáveis quando fornecido.
     */
    public function update(FinancialTransaction $transaction, array $data, ?array $assigneeIds): FinancialTransaction
    {
        $allowed = [
            'title', 'amount', 'type', 'status', 'due_date', 'payment_cycle_id',
            'category_id', 'is_recurring', 'recurrence_day', 'installments_total',
            'installment_amount', 'notes',
        ];

        $previousStatus = $transaction->status;
        $transaction->fill(array_intersect_key($data, array_flip($allowed)));

        // Avança o tracker de parcela quando uma dívida é marcada como paga.
        // O status retorna a 'aberto' para a próxima parcela; a parcela anterior
        // fica registrada como paga via installment_current > installment_num.
        $newStatus  = $transaction->status;
        $isDebt     = $transaction->type === FinancialTransaction::TYPE_DEBT;
        $markingPaid = $newStatus === FinancialTransaction::STATUS_PAID
                       && $previousStatus !== FinancialTransaction::STATUS_PAID;
        $hasMore    = $transaction->installments_total
                      && ($transaction->installment_current ?? 1) < $transaction->installments_total;

        if ($isDebt && $markingPaid && $hasMore) {
            $transaction->installment_current = ($transaction->installment_current ?? 1) + 1;
            $transaction->status              = FinancialTransaction::STATUS_OPEN;
        }

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

    // -------------------------------------------------------------------------
    // Privados
    // -------------------------------------------------------------------------

    private function projectedDate(int $origDay, int $year, int $month): string
    {
        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
        $day = min($origDay, $daysInMonth);

        return Carbon::create($year, $month, $day)->format('Y-m-d');
    }

    private function buildPayload(
        FinancialTransaction $t,
        string $resolvedDate,
        ?int $installmentNum = null,
        ?string $statusOverride = null,
    ): array {
        return [
            'id'                 => $t->id,
            'title'              => $t->title,
            'amount'             => (float) $t->amount,
            'type'               => $t->type,
            'status'             => $statusOverride ?? $t->status,
            'created_at'         => $t->created_at->format('Y-m-d'),
            'due_date'           => optional($t->due_date)->format('Y-m-d'),
            'is_recurring'       => (bool) $t->is_recurring,
            'recurrence_day'     => $t->recurrence_day,
            'installments_total'  => $t->installments_total,
            'installment_current' => $t->installment_current ?? 1,
            'installment_amount'  => $t->installment_amount ? (float) $t->installment_amount : null,
            'notes'              => $t->notes,
            'resolved_date'      => $resolvedDate,
            'installment_num'    => $installmentNum,
            'cycle'              => $t->cycle
                ? ['id' => $t->cycle->id, 'name' => $t->cycle->name]
                : null,
            'category'           => $t->category
                ? ['id' => $t->category->id, 'name' => $t->category->name, 'color' => $t->category->color]
                : null,
            'assignees'          => $t->assignees
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->values(),
        ];
    }
}
