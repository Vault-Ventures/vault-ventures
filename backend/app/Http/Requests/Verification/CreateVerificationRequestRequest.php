<?php

namespace App\Http\Requests\Verification;

use App\Enums\VerificationTier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateVerificationRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'requested_tier' => ['sometimes', 'integer', Rule::in([VerificationTier::Tier1->value])],
        ];
    }
}
