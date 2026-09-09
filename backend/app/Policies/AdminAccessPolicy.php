<?php

namespace App\Policies;

use App\Models\AdminAccess;
use App\Models\User;

class AdminAccessPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function view(User $user, AdminAccess $access): bool
    {
        return $user->hasAdminAccess();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, AdminAccess $access): bool
    {
        return false;
    }

    public function delete(User $user, AdminAccess $access): bool
    {
        return false;
    }
}
