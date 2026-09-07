<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGastoRequest extends FormRequest
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
                'vencimento', 'ciclo_id', 'categoria_id',
                'dia_recorrencia', 'observacoes',
            ]),
        ));
    }

    public function rules(): array
    {
        return [
            'titulo'          => ['nullable', 'string', 'max:120'],
            'valor'           => ['nullable', 'numeric', 'min:0.01'],
            'status'          => ['nullable', 'in:aberto,pago,impossibilitado'],
            'vencimento'      => ['nullable', 'date'],
            'recorrente'      => ['nullable', 'boolean'],
            'dia_recorrencia' => ['nullable', 'integer', 'min:1', 'max:31'],
            'ciclo_id'        => ['nullable', 'exists:payment_cycles,id'],
            'categoria_id'    => ['nullable', 'exists:categories,id'],
            'responsavel_ids' => ['nullable', 'array'],
            'responsavel_ids.*' => ['integer', 'exists:users,id'],
            'observacoes'     => ['nullable', 'string', 'max:500'],
        ];
    }
}
