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
use Illuminate\Support\Facades\DB;

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
                $profile->preferences()->firstOrCreate([]);
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
}
