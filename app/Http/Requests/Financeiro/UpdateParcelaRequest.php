<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateParcelaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'valor_parcela'     => ['nullable', 'numeric', 'min:0.01'],
            'status'            => ['nullable', 'in:aberto,pago,impossibilitado'],
            'vencimento'        => ['nullable', 'date'],
            'membros'             => ['nullable', 'array'],
            'membros.*.user_id'   => ['required_with:membros', 'integer', 'exists:users,id'],
            'membros.*.valor'     => ['required_with:membros', 'numeric', 'min:0'],
            'membros.*.ciclo_id'  => ['nullable', 'exists:payment_cycles,id'],
        ];
    }
}
