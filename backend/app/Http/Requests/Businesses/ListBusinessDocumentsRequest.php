<?php

namespace App\Http\Requests\Businesses;

final class ListBusinessDocumentsRequest extends BusinessRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
