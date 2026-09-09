<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProfileResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'founderProfile', 'investorProfile.preferences', 'professionalProfile.skills']);
        foreach ([$user->founderProfile, $user->investorProfile, $user->professionalProfile] as $profile) {
            if ($profile !== null) {
                Gate::authorize('view', $profile);
            }
        }

        return ApiResponse::success((new ProfileResource($user))->resolve($request));
    }
}
