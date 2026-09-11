<?php

namespace App\Http\Requests\Businesses;

use App\Models\Business;
use Illuminate\Support\Facades\Validator;

final class SubmitBusinessRequest extends BusinessRequest
{
    public function rules(): array
    {
        return [];
    }

    public function assertSubmittable(Business $business): void
    {
        $rules = $this->businessRules();
        foreach (['name', 'description', 'industry', 'business_stage', 'location'] as $field) {
            $rules[$field] = array_values(array_diff($rules[$field], ['sometimes', 'nullable']));
            array_unshift($rules[$field], 'required');
        }
        Validator::make($business->only(array_keys($rules)), $rules)->validate();
    }
}
