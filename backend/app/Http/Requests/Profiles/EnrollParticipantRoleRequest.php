<?php

namespace App\Http\Requests\Profiles;

use App\Enums\ParticipantRole;
use Illuminate\Validation\Rule;

final class EnrollParticipantRoleRequest extends ProfileRequest
{
    public function rules(): array
    {
        return ['role' => ['required', 'string', Rule::enum(ParticipantRole::class)]];
    }
}
