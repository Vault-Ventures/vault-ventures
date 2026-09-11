<?php

namespace App\Http\Controllers;

use App\Http\Requests\Readiness\CreateReadinessAssessmentRequest;
use App\Http\Resources\ReadinessAssessmentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\ReadinessAssessment;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReadinessAssessmentController extends Controller
{
    private function owned(Request $request, string $business): Business
    {
        Gate::authorize('viewAny', Business::class);
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        Gate::authorize('viewAny', [ReadinessAssessment::class, $owned]);

        return $owned;
    }

    private function data(Request $request, ReadinessAssessment $assessment, array $snapshot, ReadinessAssessmentService $service): array
    {
        return (new ReadinessAssessmentResource($assessment))->resolve($request) + ['freshness' => $service->freshness($assessment, $snapshot)];
    }

    public function index(Request $request, string $business, ReadinessAssessmentService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $snapshot = $service->currentSnapshot($owned);

        return ApiResponse::success($owned->readinessAssessments()->orderByDesc('version')->get()
            ->map(fn ($assessment) => $this->data($request, $assessment, $snapshot, $service))->all());
    }

    public function latest(Request $request, string $business, ReadinessAssessmentService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $latest = $owned->readinessAssessments()->orderByDesc('version')->first();

        return ApiResponse::success($latest ? $this->data($request, $latest, $service->currentSnapshot($owned), $service) : null);
    }

    public function show(Request $request, string $business, string $version, ReadinessAssessmentService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $assessment = $owned->readinessAssessments()->where('version', $version)->firstOrFail();
        Gate::authorize('view', $assessment);

        return ApiResponse::success($this->data($request, $assessment, $service->currentSnapshot($owned), $service));
    }

    public function store(CreateReadinessAssessmentRequest $request, string $business, ReadinessAssessmentService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        Gate::authorize('create', [ReadinessAssessment::class, $owned]);
        [$assessment, $created] = $service->assess($owned->id);

        return ApiResponse::success($this->data($request, $assessment, $service->currentSnapshot($owned), $service),
            $created ? 'Readiness assessment created.' : 'Readiness assessment reused.', $created ? 201 : 200);
    }
}
