<?php

namespace App\Http\Controllers;

use App\Enums\ParticipantRole;
use App\Http\Requests\Profiles\UpdateInvestorPreferenceRequest;
use App\Http\Resources\InvestorPreferenceResource;
use App\Http\Responses\ApiResponse;
use App\Models\InvestorPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class InvestorPreferenceController extends Controller
{
    private function preference(Request $request): InvestorPreference
    {
        abort_unless($request->user()->hasRole(ParticipantRole::Investor), 403);
        $profile = $request->user()->investorProfile()->firstOrFail();

        return $profile->preferences()->firstOrFail();
    }

    public function show(Request $request): JsonResponse
    {
        $preference = $this->preference($request);
        Gate::authorize('view', $preference);

        return ApiResponse::success((new InvestorPreferenceResource($preference))->resolve($request));
    }

    public function update(UpdateInvestorPreferenceRequest $request): JsonResponse
    {
        $owned = $this->preference($request);

        return DB::transaction(function () use ($request, $owned) {
            $preference = InvestorPreference::query()->lockForUpdate()->findOrFail($owned->id);
            Gate::authorize('update', $preference);
            $preference->fill($request->validated());
            // Check the merged, locked record, including values omitted from PATCH.
            $request->assertValidRange($preference);
            $preference->save();

            return ApiResponse::success((new InvestorPreferenceResource($preference))->resolve($request), 'Preferences updated.');
        }, 3);
    }
}
