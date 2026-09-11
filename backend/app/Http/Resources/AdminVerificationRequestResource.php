<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminVerificationRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'requested_tier' => $this->requested_tier?->value ?? $this->requested_tier,
            'requested_tier_label' => $this->requested_tier?->label(),
            'status' => $this->status?->value ?? $this->status,
            'assigned_admin_id' => $this->assigned_admin_id,
            'assigned_admin' => $this->whenLoaded('assignedAdmin', fn () => $this->assignedAdmin ? [
                'id' => $this->assignedAdmin->id,
                'name' => $this->assignedAdmin->name,
                'email' => $this->assignedAdmin->email,
            ] : null),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'evidence_count' => $this->relationLoaded('evidence') ? $this->evidence->count() : $this->evidence()->count(),
            'evidence' => VerificationEvidenceResource::collection($this->whenLoaded('evidence')),
            'rejection_reason' => $this->rejection_reason,
            'admin_notes' => $this->admin_notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
