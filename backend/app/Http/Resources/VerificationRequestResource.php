<?php

namespace App\Http\Resources;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerificationRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'requested_tier' => $this->requested_tier instanceof VerificationTier
                ? $this->requested_tier->value
                : (int) $this->requested_tier,
            'requested_tier_label' => $this->requested_tier instanceof VerificationTier
                ? $this->requested_tier->label()
                : null,
            'status' => $this->status instanceof VerificationRequestStatus
                ? $this->status->value
                : (string) $this->status,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
