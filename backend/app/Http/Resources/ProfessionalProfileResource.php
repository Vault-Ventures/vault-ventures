<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessionalProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'industry_experience' => $this->industry_experience,
            'experience_level' => $this->experience_level,
            'availability' => $this->availability,
            'location' => $this->location,
            'compensation_preferences' => $this->compensation_preferences,
            'skills' => $this->skills->pluck('name')->values()->all(),
        ];
    }
}
