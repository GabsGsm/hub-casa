<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreParcelaSimpleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'valor_parcela'  => ['required', 'numeric', 'min:0.01'],
            'status'         => ['required', 'in:aberto,pago,impossibilitado'],
            'vencimento'     => ['required', 'date'],
        ];
    }
}
