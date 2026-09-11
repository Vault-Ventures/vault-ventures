<?php

namespace App\Http\Controllers;

use App\Http\Requests\Readiness\StoreReadinessInputsRequest;
use App\Http\Resources\ReadinessInputResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\ReadinessInputVersion;
use App\Services\Readiness\ReadinessAssessmentService;
use App\Services\Readiness\ReadinessInputSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ReadinessInputController extends Controller
{
    private function owned(Request $request, string $business): Business
    {
        Gate::authorize('viewAny', Business::class);

        return $request->user()->founderProfile->businesses()->findOrFail($business);
    }

    public function latest(Request $request, string $business): JsonResponse
    {
        $owned = $this->owned($request, $business);
        Gate::authorize('viewAny', [ReadinessInputVersion::class, $owned]);
        $input = $owned->readinessInputs()->orderByDesc('version')->first();

        return ApiResponse::success($input ? (new ReadinessInputResource($input))->resolve($request) : null);
    }

    public function show(Request $request, string $business, string $version): JsonResponse
    {
        $input = $this->owned($request, $business)->readinessInputs()->where('version', $version)->firstOrFail();
        Gate::authorize('view', $input);

        return ApiResponse::success((new ReadinessInputResource($input))->resolve($request));
    }

    public function store(StoreReadinessInputsRequest $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('create', [ReadinessInputVersion::class, $owned]);
            $requirements = $owned->requirements()->lockForUpdate()->firstOrFail();
            $answers = $request->validated('answers');
            ReadinessInputSchema::assertConsistent($answers, $requirements->funding_amount);
            // Locking reads avoid stale snapshots after waiting for another writer.
            $last = $owned->readinessInputs()->orderByDesc('version')->lockForUpdate()->first();
            $input = new ReadinessInputVersion;
            $input->business_id = $owned->id;
            $input->version = ($last?->version ?? 0) + 1;
            $input->schema_version = ReadinessInputSchema::VERSION;
            $input->answers = $answers;
            $input->save();
            DB::afterCommit(fn () => app(ReadinessAssessmentService::class)->recalculateSafely($owned->id));

            return ApiResponse::success((new ReadinessInputResource($input))->resolve($request), 'Readiness inputs saved.', 201);
        }, 3);
    }
}
