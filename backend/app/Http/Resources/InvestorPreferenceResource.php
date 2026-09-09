<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvestorPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'available_investment' => $this->available_investment,
            'minimum_investment' => $this->minimum_investment,
            'maximum_investment' => $this->maximum_investment,
            'industry' => $this->industry,
            'risk_level' => $this->risk_level,
            'business_stage' => $this->business_stage,
            'location' => $this->location,
            'involvement' => $this->involvement,
            'investment_types' => $this->investment_types,
        ];
    }
}
