<?php

namespace App\Http\Requests\Dispensa;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePantryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:120'],
            'quantity_current' => ['nullable', 'numeric', 'min:0'],
            'quantity_min' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
            'category' => ['nullable', 'string', 'max:60'],
        ];
    }
}
