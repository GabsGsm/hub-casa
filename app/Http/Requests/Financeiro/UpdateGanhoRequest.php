<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGanhoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_map(
            fn ($v) => $v === '' ? null : $v,
            $this->only(['data_recebimento', 'categoria_id', 'observacoes']),
        ));
    }

    public function rules(): array
    {
        return [
            'titulo'           => ['nullable', 'string', 'max:120'],
            'valor'            => ['nullable', 'numeric', 'min:0.01'],
            'status'           => ['nullable', 'in:aberto,pago,impossibilitado'],
            'data_recebimento' => ['nullable', 'date'],
            'categoria_id'     => ['nullable', 'exists:categories,id'],
            'observacoes'      => ['nullable', 'string', 'max:500'],
        ];
    }
}
