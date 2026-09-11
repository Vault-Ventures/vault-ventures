<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(ParticipantRole::Founder) && $user->founderProfile()->exists();
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function view(User $user, Business $business): bool
    {
        return $this->viewAny($user) && $business->founderProfile()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Business $business): bool
    {
        return $this->view($user, $business);
    }

    public function submit(User $user, Business $business): bool
    {
        return $this->view($user, $business);
    }
}
