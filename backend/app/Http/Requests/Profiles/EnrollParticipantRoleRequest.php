<?php

namespace App\Http\Requests\Profiles;

use App\Enums\ParticipantRole;
use Illuminate\Validation\Rule;

final class EnrollParticipantRoleRequest extends ProfileRequest
{
    public function rules(): array
    {
        $amount = ['sometimes', 'nullable', 'numeric', 'regex:/^[0-9]{1,13}(\\.[0-9]{1,2})?$/D'];

        return [
            'role' => ['required', 'string', Rule::enum(ParticipantRole::class)],
            'available_investment' => $amount,
            'minimum_investment' => $amount,
            'maximum_investment' => $amount,
            'industry' => ['sometimes', 'nullable', 'string', 'max:100'],
            'risk_level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'business_stage' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'involvement' => ['sometimes', 'nullable', 'string', 'max:100'],
            'investment_types' => ['sometimes', 'array', 'list'],
            'investment_types.*' => ['required', 'string', 'distinct', Rule::in(['micro', 'large_standard'])],
            'investment_thesis' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
