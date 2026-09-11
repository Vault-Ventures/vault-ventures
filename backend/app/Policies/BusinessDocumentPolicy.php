<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\BusinessDocument;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class BusinessDocumentPolicy
{
    public function viewAny(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('view', $business);
    }

    public function create(User $user, Business $business): bool
    {
        return Gate::forUser($user)->allows('update', $business);
    }

    public function download(User $user, BusinessDocument $document): bool
    {
        return Gate::forUser($user)->allows('view', $document->business);
    }
}
