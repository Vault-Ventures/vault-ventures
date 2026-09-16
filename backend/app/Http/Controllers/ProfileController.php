<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profiles\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Responses\ApiResponse;
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
}
