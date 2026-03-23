<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_map(
            fn ($v) => $v === '' ? null : $v,
            $this->only([
                'due_date', 'payment_cycle_id', 'category_id',
                'recurrence_day', 'installments_total', 'installment_amount', 'notes',
            ]),
        ));
    }

    public function rules(): array
    {
        return [
            'title'              => ['nullable', 'string', 'max:120'],
            'amount'             => ['nullable', 'numeric', 'min:0'],
            'type'               => ['nullable', 'in:gasto,ganho,divida'],
            'status'             => ['nullable', 'in:aberto,pago,impossibilitado'],
            'due_date'           => ['nullable', 'date'],
            'payment_cycle_id'   => ['nullable', 'exists:payment_cycles,id'],
            'category_id'        => ['nullable', 'exists:categories,id'],
            'assignee_ids'       => ['nullable', 'array'],
            'assignee_ids.*'     => ['integer', 'exists:users,id'],
            'is_recurring'       => ['nullable', 'boolean'],
            'recurrence_day'     => ['nullable', 'integer', 'min:1', 'max:31'],
            'installments_total' => ['nullable', 'integer', 'min:1', 'max:420'],
            'installment_amount' => ['nullable', 'numeric', 'min:0'],
            'notes'              => ['nullable', 'string', 'max:500'],
        ];
    }
}
