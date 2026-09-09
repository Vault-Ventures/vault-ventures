<?php

namespace App\Http\Requests\Profiles;

use Illuminate\Validation\Rule;

final class UpdateProfessionalProfileRequest extends ProfileRequest
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
            'industry_experience' => ['sometimes', 'nullable', 'array', 'list'],
            'industry_experience.*' => ['required', 'string', 'max:100'],
            'experience_level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'availability' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'compensation_preferences' => ['sometimes', 'array', 'list'],
            'compensation_preferences.*' => ['required', 'string', 'distinct', Rule::in(['salary', 'equity'])],
            'skills' => ['sometimes', 'array', 'list', 'max:50'],
            'skills.*' => ['required', 'string', 'max:100'],
        ];
    }
}
