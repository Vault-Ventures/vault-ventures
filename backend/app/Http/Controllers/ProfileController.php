<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Requests\Profiles\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Responses\ApiResponse;
use App\Models\BusinessApplication;
use App\Models\BusinessConnection;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessInterest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = User::query()->with(['roles', 'founderProfile', 'investorProfile.preferences', 'professionalProfile.skills'])->findOrFail($request->user()->id);
        foreach ([$user->founderProfile, $user->investorProfile, $user->professionalProfile] as $profile) {
            if ($profile !== null) {
                Gate::authorize('view', $profile);
            }
        }

        return ApiResponse::success((new ProfileResource($user))->resolve($request));
    }

    public function showUser(Request $request, User $user): JsonResponse
    {
        $requester = $request->user();

        if (! $this->canViewUserProfile($requester, $user)) {
            abort(403, 'You are not authorized to view this user profile.');
        }

        $user->load(['roles', 'founderProfile', 'investorProfile.preferences', 'professionalProfile.skills']);

        return ApiResponse::success((new ProfileResource($user))->resolve($request));
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $user->fill($request->validated());
            $user->save();

            $user->load(['roles', 'founderProfile', 'investorProfile.preferences', 'professionalProfile.skills']);

            return ApiResponse::success(
                (new ProfileResource($user))->resolve($request),
                'Profile updated successfully.'
            );
        }, 3);
    }

    /**
     * Determine if a requester is authorized to view a target user's profile.
     */
    protected function canViewUserProfile(User $requester, User $target): bool
    {
        if ($requester->id === $target->id) {
            return true;
        }

        if ($requester->hasAdminAccess()) {
            return true;
        }

        // Active interest between founder and counterparty
        $hasInterest = BusinessInterest::query()
            ->where('status', 'active')
            ->where(function ($query) use ($requester, $target) {
                $query->where(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $requester->id)
                        ->where('counterparty_user_id', $target->id);
                })->orWhere(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $target->id)
                        ->where('counterparty_user_id', $requester->id);
                });
            })->exists();

        if ($hasInterest) {
            return true;
        }

        // Active connection between founder and counterparty
        $hasConnection = BusinessConnection::query()
            ->where(function ($query) use ($requester, $target) {
                $query->where(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $requester->id)
                        ->where('counterparty_user_id', $target->id);
                })->orWhere(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $target->id)
                        ->where('counterparty_user_id', $requester->id);
                });
            })->exists();

        if ($hasConnection) {
            return true;
        }

        // Active or historical business application between founder and professional
        $hasApplication = BusinessApplication::query()
            ->where(function ($query) use ($requester, $target) {
                $query->where(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $requester->id)
                        ->where('professional_user_id', $target->id);
                })->orWhere(function ($q) use ($requester, $target) {
                    $q->where('founder_user_id', $target->id)
                        ->where('professional_user_id', $requester->id);
                });
            })->exists();

        if ($hasApplication) {
            return true;
        }

        // Disclosure relationship where requester is founder of the business
        $hasDisclosureAsFounder = BusinessDisclosureRelationship::query()
            ->where('counterparty_user_id', $target->id)
            ->whereHas('business.founderProfile', function ($q) use ($requester) {
                $q->where('user_id', $requester->id);
            })->exists();

        if ($hasDisclosureAsFounder) {
            return true;
        }

        // Disclosure relationship where target is founder of the business
        $hasDisclosureAsCounterparty = BusinessDisclosureRelationship::query()
            ->where('counterparty_user_id', $requester->id)
            ->whereHas('business.founderProfile', function ($q) use ($target) {
                $q->where('user_id', $target->id);
            })->exists();

        if ($hasDisclosureAsCounterparty) {
            return true;
        }

        // Discoverable registered participants on the platform (investor, professional, or founder)
        if ($target->hasRole(ParticipantRole::Investor)
            || $target->hasRole(ParticipantRole::Professional)
            || $target->hasRole(ParticipantRole::Founder)) {
            return true;
        }

        return false;
    }
}

