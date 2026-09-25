<?php

namespace App\Http\Resources;

use App\Enums\ParticipantRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $rolesRelation = $this->relationLoaded('roles') ? $this->roles : $this->roles()->get();
        $roles = $rolesRelation->map(function ($r) {
            return $r->role instanceof ParticipantRole ? $r->role->value : (string) $r->role;
        })->sort()->values()->all();

        $isAdmin = $this->relationLoaded('adminAccess')
            ? $this->adminAccess !== null
            : $this->hasAdminAccess();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'phone' => $this->phone,
            'phone_verified_at' => $this->phone_verified_at?->toISOString(),
            'headline' => $this->headline,
            'bio' => $this->bio,
            'location' => $this->location,
            'avatar_url' => $this->avatar_url,
            'cover_photo_url' => $this->cover_photo_url,
            'experience' => $this->experience ?? [],
            'portfolio' => $this->portfolio ?? [],
            'preferences' => $this->preferences ?? [],
            'verification_tier' => $this->verification_tier->value,
            'verification_tier_label' => $this->verification_tier->label(),
            'roles' => $roles,
            'is_admin' => $isAdmin,
        ];
    }
}
