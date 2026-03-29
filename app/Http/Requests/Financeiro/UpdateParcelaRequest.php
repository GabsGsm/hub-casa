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
            'valor_parcela' => ['nullable', 'numeric', 'min:0.01'],
            'status'        => ['nullable', 'in:aberto,pago,impossibilitado'],
            'vencimento'    => ['nullable', 'date'],
        ];
    }
}
