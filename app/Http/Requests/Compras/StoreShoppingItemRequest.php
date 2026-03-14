<?php

namespace App\Http\Requests\Compras;

use Illuminate\Foundation\Http\FormRequest;

class StoreShoppingItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'quantity' => ['nullable', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:pendente,comprado,impossibilitado'],
            'recurrence' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:60'],
            'priority' => ['nullable', 'in:normal,high'],
        ];
    }
}
