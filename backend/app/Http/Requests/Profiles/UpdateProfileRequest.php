<?php

namespace App\Http\Requests\Profiles;

class UpdateProfileRequest extends ProfileRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'headline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'experience' => ['sometimes', 'nullable', 'array'],
            'experience.*.role' => ['sometimes', 'nullable', 'string', 'max:255'],
            'experience.*.org' => ['sometimes', 'nullable', 'string', 'max:255'],
            'experience.*.duration' => ['sometimes', 'nullable', 'string', 'max:100'],
            'experience.*.desc' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'portfolio' => ['sometimes', 'nullable', 'array'],
            'portfolio.*.title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'portfolio.*.role' => ['sometimes', 'nullable', 'string', 'max:255'],
            'portfolio.*.year' => ['sometimes', 'nullable', 'string', 'max:50'],
            'portfolio.*.desc' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'portfolio.*.skills' => ['sometimes', 'nullable', 'array'],
            'portfolio.*.skills.*' => ['string', 'max:100'],
            'portfolio.*.link' => ['sometimes', 'nullable', 'string', 'max:500'],
            'preferences' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
