<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'title'             => ['required', 'string', 'max:120'],
            'amount'            => ['required', 'numeric', 'min:0'],
            'type'              => ['required', 'string'],
            'status'            => ['required', 'in:aberto,pago,impossibilitado'],
            'due_date'          => ['nullable', 'date'],
            'payment_cycle_id'  => ['nullable', 'exists:payment_cycles,id'],
            'category_id'       => ['nullable', 'exists:categories,id'],
            'assignee_ids'      => ['nullable', 'array'],
            'assignee_ids.*'    => ['integer', 'exists:users,id'],
            'recurrence'        => ['nullable', 'in:mensal,anual,fixa,diaria'],
            'installments_count'=> ['nullable', 'integer', 'min:1', 'max:360'],
        ];
    }
}
