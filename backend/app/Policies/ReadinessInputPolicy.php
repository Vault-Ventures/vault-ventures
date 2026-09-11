<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\ReadinessInputVersion;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ReadinessInputPolicy
{
    public function viewAny(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('view', $business);
    }

    public function create(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('update', $business);
    }

    public function view(User $user, ReadinessInputVersion $input): bool
    {
        return Gate::forUser($user)->allows('view', $input->business);
    }

    public function update(User $user, ReadinessInputVersion $input): bool
    {
        return false;
    }

    public function delete(User $user, ReadinessInputVersion $input): bool
    {
        return false;
    }
}
