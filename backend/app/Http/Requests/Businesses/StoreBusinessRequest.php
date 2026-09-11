<?php

namespace App\Http\Requests\Businesses;

final class StoreBusinessRequest extends BusinessRequest
{
    public function rules(): array
    {
        return array_replace($this->businessRules(), ['name' => ['required', 'string', 'max:255']]);
    }
}
