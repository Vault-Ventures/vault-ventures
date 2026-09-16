<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Requests\Profiles\EnrollParticipantRoleRequest;
use App\Http\Resources\FounderProfileResource;
use App\Http\Resources\InvestorProfileResource;
use App\Http\Resources\ProfessionalProfileResource;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParticipantRoleController extends Controller
{
    public function store(EnrollParticipantRoleRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            // Serialize enrollment for this user so duplicate requests remain idempotent.
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $role = ParticipantRole::from($request->validated('role'));
            $membership = $user->roles()->firstOrCreate(['role' => $role->value]);
            $profile = match ($role) {
                ParticipantRole::Founder => $user->founderProfile()->firstOrCreate([]),
                ParticipantRole::Investor => $user->investorProfile()->firstOrCreate([]),
                ParticipantRole::Professional => $user->professionalProfile()->firstOrCreate([]),
            };
            if ($role === ParticipantRole::Investor) {
                $preference = $profile->preferences()->firstOrCreate([]);
                $validated = $request->validated();
                $prefFields = array_intersect_key($validated, array_flip([
                    'available_investment', 'minimum_investment', 'maximum_investment',
                    'industry', 'risk_level', 'business_stage', 'location',
                    'involvement', 'investment_types',
                ]));
                if (! empty($prefFields)) {
                    $preference->fill($prefFields)->save();
                }
                if (! empty($validated['investment_thesis']) && empty($user->bio)) {
                    $user->bio = $validated['investment_thesis'];
                    $user->save();
                }
                $profile->load('preferences');
            }
            if ($role === ParticipantRole::Professional) {
                $profile->load('skills');
            }
            $resource = match ($role) {
                ParticipantRole::Founder => new FounderProfileResource($profile),
                ParticipantRole::Investor => new InvestorProfileResource($profile),
                ParticipantRole::Professional => new ProfessionalProfileResource($profile),
            };

            return ApiResponse::success(
                ['role' => $role->value, 'profile' => $resource->resolve($request)],
                $membership->wasRecentlyCreated ? 'Role enrolled.' : 'Role already enrolled.',
                $membership->wasRecentlyCreated ? 201 : 200,
            );
        }, 3);
    }

    public function destroy(Request $request, string $role): JsonResponse
    {
        $roleEnum = ParticipantRole::tryFrom(strtolower(trim($role)));
        if (! $roleEnum) {
            throw ValidationException::withMessages([
                'role' => ['Invalid participant role specified.'],
            ]);
        }

        return DB::transaction(function () use ($request, $roleEnum) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);

            if (! $user->hasRole($roleEnum)) {
                throw ValidationException::withMessages([
                    'role' => ['User is not currently enrolled in the '.$roleEnum->value.' role.'],
                ]);
            }

            if ($user->roles()->count() <= 1) {
                throw ValidationException::withMessages([
                    'role' => ['Cannot remove your only active role. An account must maintain at least one role.'],
                ]);
            }

            $user->roles()->where('role', $roleEnum->value)->delete();

            $remainingRoles = $user->roles()->pluck('role')->all();

            return ApiResponse::success([
                'removed_role' => $roleEnum->value,
                'roles' => $remainingRoles,
            ], 'Role removed successfully.');
        }, 3);
    }
}
