<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\InvestorPreference;
use App\Models\User;

class InvestorPreferencePolicy
{
    public function view(User $user, InvestorPreference $preference): bool
    {
        return $preference->investorProfile->user_id === $user->id && $user->hasRole(ParticipantRole::Investor);
    }

    public function update(User $user, InvestorPreference $preference): bool
    {
        return $this->view($user, $preference);
    }
}
