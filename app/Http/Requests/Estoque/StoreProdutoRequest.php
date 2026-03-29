<?php

namespace App\Http\Requests\Estoque;

use Illuminate\Foundation\Http\FormRequest;

class StoreProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'nome'           => ['required', 'string', 'max:120'],
            'unidade'        => ['nullable', 'string', 'max:20'],
            'categoria'      => ['nullable', 'string', 'max:60'],
            'prioridade'     => ['nullable', 'in:normal,alta'],
            'estoque_atual'  => ['nullable', 'numeric', 'min:0'],
            'estoque_minimo' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
