<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class StoreCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:60'],
            'expected_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
