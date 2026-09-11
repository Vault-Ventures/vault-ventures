<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\ReadinessAssessment;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ReadinessAssessmentPolicy
{
    public function viewAny(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('view', $business);
    }

    public function create(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('update', $business);
    }

    public function view(User $user, ReadinessAssessment $assessment): bool
    {
        return Gate::forUser($user)->allows('view', $assessment->business);
    }

    public function update(User $user, ReadinessAssessment $assessment): bool
    {
        return false;
    }

    public function delete(User $user, ReadinessAssessment $assessment): bool
    {
        return false;
    }
}
