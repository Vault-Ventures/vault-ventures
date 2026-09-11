<?php

namespace App\Http\Requests\Businesses;

final class ListBusinessesRequest extends BusinessRequest
{
    public function rules(): array
    {
        return ['page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:100']];
    }
}
