<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\BusinessAnalysis;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class BusinessAnalysisPolicy
{
    public function viewAny(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('view', $business);
    }

    public function create(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('update', $business);
    }

    public function view(User $user, BusinessAnalysis $analysis): bool
    {
        return Gate::forUser($user)->allows('view', $analysis->business);
    }

    public function update(User $user, BusinessAnalysis $analysis): bool
    {
        return false;
    }

    public function delete(User $user, BusinessAnalysis $analysis): bool
    {
        return false;
    }
}
