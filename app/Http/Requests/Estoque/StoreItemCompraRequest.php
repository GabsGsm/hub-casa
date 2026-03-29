<?php

namespace App\Http\Requests\Estoque;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            // Pode referenciar produto existente ou criar novo
            'produto_id'          => ['nullable', 'exists:produtos,id'],
            'nome'                => ['required_without:produto_id', 'string', 'max:120'],
            'unidade'             => ['nullable', 'string', 'max:20'],
            'categoria'           => ['nullable', 'string', 'max:60'],
            'quantidade_desejada' => ['nullable', 'numeric', 'min:0.01'],
            'observacoes'         => ['nullable', 'string', 'max:500'],
        ];
    }
}
