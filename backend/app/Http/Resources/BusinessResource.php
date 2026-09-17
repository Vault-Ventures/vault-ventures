<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'industry' => $this->industry,
            'business_stage' => $this->business_stage,
            'risk_level' => $this->risk_level,
            'expected_involvement' => $this->expected_involvement,
            'location' => $this->location,
            'status' => $this->status->value,
            'logo_url' => $this->logo_url,
            'cover_photo_url' => $this->cover_photo_url,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'approved_at' => $this->whenNotNull($this->approved_at?->toISOString()),
            'rejected_at' => $this->whenNotNull($this->rejected_at?->toISOString()),
            'rejection_reason' => $this->whenNotNull($this->rejection_reason),
            'published_at' => $this->whenNotNull($this->published_at?->toISOString()),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'requirements' => (new BusinessRequirementResource($this->requirements))->resolve($request),
        ];
    }
}
