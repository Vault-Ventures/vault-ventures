<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessRequirementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'funding_amount' => $this->funding_amount,
            'skills' => $this->skills->pluck('name')->all(),
            'accepted_investment_types' => $this->accepted_investment_types ?? [],
            'micro_proposed_terms' => $this->micro_proposed_terms,
            'large_standard_proposed_terms' => $this->large_standard_proposed_terms,
            'required_experience_level' => $this->required_experience_level,
            'required_availability' => $this->required_availability,
            'compensation_preferences' => $this->compensation_preferences ?? [],
        ];
    }
}
