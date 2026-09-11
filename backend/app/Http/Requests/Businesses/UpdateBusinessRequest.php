<?php

namespace App\Http\Requests\Businesses;

final class UpdateBusinessRequest extends BusinessRequest
{
    public function rules(): array
    {
        return $this->businessRules();
    }
}
