<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\ReadinessInsight;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ReadinessInsightPolicy
{
    public function viewAny(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('view', $business);
    }

    public function create(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('update', $business);
    }

    public function view(User $user, ReadinessInsight $insight): bool
    {
        return Gate::forUser($user)->allows('view', $insight->business);
    }

    public function update(User $user, ReadinessInsight $insight): bool
    {
        return false;
    }

    public function delete(User $user, ReadinessInsight $insight): bool
    {
        return false;
    }
}
