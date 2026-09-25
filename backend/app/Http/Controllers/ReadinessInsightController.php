<?php

namespace App\Http\Controllers;

use App\Http\Requests\Readiness\CreateReadinessInsightRequest;
use App\Http\Resources\ReadinessInsightResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Models\ReadinessInsight;
use App\Services\Readiness\ReadinessInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReadinessInsightController extends Controller
{
    private function owned(Request $request, string $business): Business
    {
        Gate::authorize('viewAny', Business::class);
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        Gate::authorize('viewAny', [ReadinessInsight::class, $owned]);

        return $owned;
    }

    private function data(ReadinessInsight $insight): array
    {
        $freshness = app(ReadinessInsightService::class)->freshness($insight);

        return (new ReadinessInsightResource($insight))->resolve(request()) + ['freshness' => $freshness];
    }

    public function index(Request $request, string $business, ReadinessInsightService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $items = $owned->readinessInsights()->orderByDesc('version')->get();

        return ApiResponse::success($items->map(fn (ReadinessInsight $insight) => $this->data($insight))->all(), 'Success.', 200, $service->metadata($owned));
    }

    public function latest(Request $request, string $business, ReadinessInsightService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $latest = $owned->readinessInsights()->orderByDesc('version')->first();

        return ApiResponse::success($latest ? $this->data($latest) : null, 'Success.', 200, $service->metadata($owned));
    }

    public function show(Request $request, string $business, string $version, ReadinessInsightService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $insight = $owned->readinessInsights()->where('version', $version)->firstOrFail();
        Gate::authorize('view', $insight);

        return ApiResponse::success($this->data($insight), 'Success.', 200, $service->metadata($owned));
    }

    public function store(CreateReadinessInsightRequest $request, string $business, ReadinessInsightService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        Gate::authorize('create', [ReadinessInsight::class, $owned]);
        try {
            [$insight, $created] = $service->generate($request->user(), $owned);
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error('Readiness insights could not be generated. Please try again later.', $failure->reason, $failure->status);
        }

        return ApiResponse::success($this->data($insight), $created ? 'Readiness insight created.' : 'Readiness insight reused.', $created ? 201 : 200, $service->metadata($owned->fresh()));
    }
}
