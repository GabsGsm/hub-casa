<?php

namespace App\Http\Requests\Estoque;

use Illuminate\Foundation\Http\FormRequest;

class RegistrarCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'quantidade' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
