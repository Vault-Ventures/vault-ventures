<?php

namespace App\Http\Requests\Profiles;

use App\Models\InvestorPreference;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class UpdateInvestorPreferenceRequest extends ProfileRequest
{
    public function rules(): array
    {
        $amount = ['sometimes', 'nullable', 'numeric', 'regex:/^[0-9]{1,13}(\\.[0-9]{1,2})?$/D'];

        return [
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
        ];
    }

    public function assertValidRange(InvestorPreference $preference): void
    {
        $minimum = $preference->minimum_investment;
        $maximum = $preference->maximum_investment;
        // Decimal casts supply two places; fixed-width strings avoid floating-point rounding.
        if ($minimum !== null && $maximum !== null
            && strcmp(str_pad(str_replace('.', '', $minimum), 15, '0', STR_PAD_LEFT),
                str_pad(str_replace('.', '', $maximum), 15, '0', STR_PAD_LEFT)) > 0) {
            throw ValidationException::withMessages([
                'minimum_investment' => ['The minimum investment must not exceed the maximum investment.'],
            ]);
        }
    }
}
