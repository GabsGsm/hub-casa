<?php

namespace App\Http\Requests\Financeiro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'name'            => ['nullable', 'string', 'max:60'],
            'day_of_month'    => ['nullable', 'integer', 'min:1', 'max:31'],
            'expected_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
