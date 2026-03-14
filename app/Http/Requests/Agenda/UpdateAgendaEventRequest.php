<?php

namespace App\Http\Requests\Agenda;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgendaEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()->house;
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
        ];
    }
}
