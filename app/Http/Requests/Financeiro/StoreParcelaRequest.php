<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreParcelaRequest extends FormRequest
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
                'vencimento', 'ciclo_id', 'categoria_id', 'observacoes',
            ]),
        ));
    }

    public function rules(): array
    {
        return [
            'titulo'          => ['required', 'string', 'max:120'],
            'valor_parcela'   => ['required', 'numeric', 'min:0.01'],
            'numero_parcela'  => ['required', 'integer', 'min:1'],
            'status'          => ['required', 'in:aberto,pago,impossibilitado'],
            'vencimento'      => ['required', 'date'],
            'ciclo_id'        => ['nullable', 'exists:payment_cycles,id'],
            'categoria_id'    => ['nullable', 'exists:categories,id'],
            'responsavel_ids' => ['nullable', 'array'],
            'responsavel_ids.*' => ['integer', 'exists:users,id'],
            'observacoes'     => ['nullable', 'string', 'max:500'],
            // Campos para criação em lote (gerar N parcelas de uma vez)
            'total_parcelas'       => ['nullable', 'integer', 'min:2', 'max:420'],
            'vencimento_primeira'  => ['required_with:total_parcelas', 'date'],
        ];
    }
}
