<?php

namespace App\Http\Requests\Dispensa;

use Illuminate\Foundation\Http\FormRequest;

class StorePantryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'quantity_current' => ['required', 'numeric', 'min:0'],
            'quantity_min' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:20'],
            'category' => ['nullable', 'string', 'max:60'],
        ];
    }
}
