<?php

namespace App\Http\Requests\Businesses;

use App\Models\Business;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

abstract class BusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('viewAny', Business::class);
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $allowed = array_filter(array_keys($this->rules()), fn ($key) => ! str_contains($key, '.'));
            foreach (array_diff(array_keys($this->all()), $allowed) as $field) {
                $validator->errors()->add($field, 'This field is not allowed.');
            }
        }];
    }

    protected function businessRules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'industry' => ['sometimes', 'nullable', 'string', 'max:100'],
            'business_stage' => ['sometimes', 'nullable', 'string', 'max:100'],
            'risk_level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'expected_involvement' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
