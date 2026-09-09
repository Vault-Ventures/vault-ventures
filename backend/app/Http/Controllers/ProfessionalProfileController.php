<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Requests\Profiles\UpdateProfessionalProfileRequest;
use App\Http\Resources\ProfessionalProfileResource;
use App\Http\Responses\ApiResponse;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProfessionalProfileController extends Controller
{
    public function update(UpdateProfessionalProfileRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasRole(ParticipantRole::Professional), 403);

        return DB::transaction(function () use ($request) {
            $profile = $request->user()->professionalProfile()->lockForUpdate()->firstOrFail();
            Gate::authorize('update', $profile);
            $profile->fill($request->safe()->except('skills'));
            $profile->save();
            if (array_key_exists('skills', $request->validated())) {
                $ids = [];
                foreach ($request->validated('skills') as $name) {
                    $name = trim(preg_replace('/\\s+/u', ' ', $name));
                    $normalized = mb_strtolower($name);
                    // Keep the first display name; the unique key arbitrates concurrent inserts.
                    Skill::upsert([['normalized_name' => $normalized, 'name' => $name]], ['normalized_name'], ['normalized_name']);
                    $skill = Skill::where('normalized_name', $normalized)->lockForUpdate()->firstOrFail();
                    $ids[] = $skill->id;
                }
                $profile->skills()->sync(array_values(array_unique($ids)));
            }

            return ApiResponse::success(
                (new ProfessionalProfileResource($profile->load('skills')))->resolve($request),
                'Profile updated.',
            );
        }, 3);
    }
}
