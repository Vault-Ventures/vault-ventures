<?php

namespace App\Http\Controllers;

use App\Http\Requests\Businesses\UpdateBusinessRequirementsRequest;
use App\Http\Resources\BusinessRequirementResource;
use App\Http\Responses\ApiResponse;
use App\Models\Skill;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BusinessRequirementController extends Controller
{
    public function update(UpdateBusinessRequirementsRequest $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('update', $owned);
            $requirements = $owned->requirements()->lockForUpdate()->firstOrFail();
            $requirements->fill($request->safe()->except('skills'));
            // Validate the merged, locked record before persisting any changes.
            $request->assertConsistentTerms($requirements);
            $requirements->save();
            if ($requirements->wasChanged('funding_amount')) {
                DB::afterCommit(fn () => app(ReadinessAssessmentService::class)->recalculateSafely($owned->id));
            }
            if (array_key_exists('skills', $request->validated())) {
                $ids = [];
                foreach ($request->validated('skills') as $name) {
                    $name = trim(preg_replace('/\s+/u', ' ', $name));
                    $normalized = mb_strtolower($name);
                    // Match Phase 1: preserve the first display name and share normalized identity.
                    Skill::upsert([['normalized_name' => $normalized, 'name' => $name]], ['normalized_name'], ['normalized_name']);
                    $ids[] = Skill::where('normalized_name', $normalized)->lockForUpdate()->firstOrFail()->id;
                }
                $requirements->skills()->sync(array_values(array_unique($ids)));
            }

            return ApiResponse::success((new BusinessRequirementResource($requirements->load('skills')))->resolve($request), 'Business requirements updated.');
        }, 3);
    }
}
