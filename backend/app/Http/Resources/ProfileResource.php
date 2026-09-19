<?php

namespace App\Http\Resources;

use App\Enums\VerificationTier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSelfOrAdmin = $request->user()?->id === $this->id || ($request->user()?->hasAdminAccess() ?? false);

        return [
            'user' => [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $isSelfOrAdmin ? $this->email : null,
                'headline' => $this->headline,
                'bio' => $this->bio,
                'location' => $this->location,
                'avatar_url' => $this->avatar_url,
                'cover_photo_url' => $this->cover_photo_url,
                'experience' => $this->experience ?? [],
                'portfolio' => $this->portfolio ?? [],
                'preferences' => $this->preferences ?? [],
                'verification_tier' => $this->verification_tier instanceof VerificationTier ? $this->verification_tier->value : (int) ($this->verification_tier ?? 0),
                'verification_tier_label' => $this->verification_tier instanceof VerificationTier ? $this->verification_tier->label() : null,
            ],
            'roles' => $this->roles->map(fn ($membership) => $membership->role->value)->sort()->values()->all(),
            'profiles' => [
                'founder' => $this->founderProfile ? (new FounderProfileResource($this->founderProfile))->resolve($request) : null,
                'investor' => $this->investorProfile ? (new InvestorProfileResource($this->investorProfile))->resolve($request) : null,
                'professional' => $this->professionalProfile ? (new ProfessionalProfileResource($this->professionalProfile))->resolve($request) : null,
            ],
        ];
    }
}

