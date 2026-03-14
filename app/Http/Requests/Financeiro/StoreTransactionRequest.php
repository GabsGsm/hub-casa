<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    protected function prepareForValidation(): void
    {
        // Converte strings vazias em null para evitar falha nas regras de tipo
        $this->merge(array_map(
            fn($v) => $v === '' ? null : $v,
            $this->only(['due_date', 'payment_cycle_id', 'category_id', 'recurrence', 'installments_count']),
        ));
    }

    public function rules(): array
    {
        $isDivida = $this->input('type') === 'divida';

        return [
            'title'             => ['required', 'string', 'max:120'],
            'amount'            => ['required', 'numeric', 'min:0'],
            'type'              => ['required', 'in:gasto,ganho,divida'],
            'status'            => ['required', 'in:aberto,pago,impossibilitado'],
            'due_date'          => [$isDivida ? 'required' : 'nullable', 'date'],
            'payment_cycle_id'  => ['nullable', 'exists:payment_cycles,id'],
            'category_id'       => ['nullable', 'exists:categories,id'],
            'assignee_ids'      => ['nullable', 'array'],
            'assignee_ids.*'    => ['integer', 'exists:users,id'],
            'recurrence'        => ['nullable', 'in:mensal'],
            'installments_count'=> [$isDivida ? 'required' : 'nullable', 'integer', 'min:1', 'max:360'],
        ];
    }
}
