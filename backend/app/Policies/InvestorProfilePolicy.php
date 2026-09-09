<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\InvestorProfile;
use App\Models\User;

class InvestorProfilePolicy
{
    public function view(User $user, InvestorProfile $profile): bool
    {
        return $profile->user_id === $user->id && $user->hasRole(ParticipantRole::Investor);
    }

    public function update(User $user, InvestorProfile $profile): bool
    {
        return $this->view($user, $profile);
    }
}
