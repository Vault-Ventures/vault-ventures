<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user' => ['id' => $this->id, 'name' => $this->name, 'email' => $this->email],
            'roles' => $this->roles->map(fn ($membership) => $membership->role->value)->sort()->values()->all(),
            'profiles' => [
                'founder' => $this->founderProfile ? (new FounderProfileResource($this->founderProfile))->resolve($request) : null,
                'investor' => $this->investorProfile ? (new InvestorProfileResource($this->investorProfile))->resolve($request) : null,
                'professional' => $this->professionalProfile ? (new ProfessionalProfileResource($this->professionalProfile))->resolve($request) : null,
            ],
        ];
    }
}
