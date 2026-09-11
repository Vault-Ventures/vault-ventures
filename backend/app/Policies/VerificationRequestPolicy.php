<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VerificationRequest;

class VerificationRequestPolicy
{
    public function view(User $user, VerificationRequest $verificationRequest): bool
    {
        return $verificationRequest->user_id === $user->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function viewAnyAdmin(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function viewAdmin(User $user, VerificationRequest $verificationRequest): bool
    {
        return $user->hasAdminAccess();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function uploadEvidence(User $user, VerificationRequest $verificationRequest): bool
    {
        return $verificationRequest->user_id === $user->id;
    }
}
