<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\FounderProfile;
use App\Models\User;

class FounderProfilePolicy
{
    public function view(User $user, FounderProfile $profile): bool
    {
        return $profile->user_id === $user->id && $user->hasRole(ParticipantRole::Founder);
    }

    public function update(User $user, FounderProfile $profile): bool
    {
        return $this->view($user, $profile);
    }
}
