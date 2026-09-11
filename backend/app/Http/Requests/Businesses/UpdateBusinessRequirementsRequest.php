<?php

namespace App\Http\Requests\Businesses;

use App\Models\BusinessRequirement;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class UpdateBusinessRequirementsRequest extends BusinessRequest
{
    protected function prepareForValidation(): void
    {
        if (is_array($this->input('skills'))) {
            $this->merge(['skills' => array_map(
                fn ($name) => is_string($name) ? trim(preg_replace('/\s+/u', ' ', $name)) : $name,
                $this->input('skills'),
            )]);
        }
    }

    public function rules(): array
    {
        return [
            'funding_amount' => ['sometimes', 'nullable', 'numeric', 'regex:/^[0-9]{1,13}(\.[0-9]{1,2})?$/D'],
            'skills' => ['sometimes', 'array', 'list', 'max:50'],
            'skills.*' => ['required', 'string', 'max:100'],
            'accepted_investment_types' => ['sometimes', 'array', 'list', 'max:2'],
            'accepted_investment_types.*' => ['required', 'string', 'distinct', Rule::in(['micro', 'large_standard'])],
            'micro_proposed_terms' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'large_standard_proposed_terms' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'required_experience_level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'required_availability' => ['sometimes', 'nullable', 'string', 'max:100'],
            'compensation_preferences' => ['sometimes', 'array', 'list', 'max:2'],
            'compensation_preferences.*' => ['required', 'string', 'distinct', Rule::in(['salary', 'equity'])],
        ];
    }

    public function assertConsistentTerms(BusinessRequirement $requirements): void
    {
        $errors = [];
        foreach (['micro', 'large_standard'] as $type) {
            $field = $type.'_proposed_terms';
            if ($requirements->$field !== null && trim($requirements->$field) !== ''
                && ! in_array($type, $requirements->accepted_investment_types ?? [], true)) {
                $errors[$field] = ['Proposed terms require the corresponding accepted investment type. Clear the terms before removing that type.'];
            }
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
