<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\ProfessionalProfile;
use App\Models\User;

class ProfessionalProfilePolicy
{
    public function view(User $user, ProfessionalProfile $profile): bool
    {
        return $profile->user_id === $user->id && $user->hasRole(ParticipantRole::Professional);
    }

    public function update(User $user, ProfessionalProfile $profile): bool
    {
        return $this->view($user, $profile);
    }
}
