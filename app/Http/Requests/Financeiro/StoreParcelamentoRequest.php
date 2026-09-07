<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreParcelamentoRequest extends FormRequest
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
                'ciclo_id', 'categoria_id', 'observacoes',
            ]),
        ));
    }

    public function rules(): array
    {
        return [
            'titulo'              => ['required', 'string', 'max:120'],
            'valor_parcela'       => ['required', 'numeric', 'min:0.01'],
            'total_parcelas'      => ['required', 'integer', 'min:2', 'max:420'],
            'vencimento_primeira' => ['required', 'date'],
            'status'              => ['nullable', 'in:aberto,pago,impossibilitado'],
            'ciclo_id'            => ['nullable', 'exists:payment_cycles,id'],
            'categoria_id'        => ['nullable', 'exists:categories,id'],
            'responsavel_ids'     => ['nullable', 'array'],
            'responsavel_ids.*'   => ['integer', 'exists:users,id'],
            'observacoes'         => ['nullable', 'string', 'max:500'],
        ];
    }
}
