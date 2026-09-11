<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessAnalysis\CreateBusinessAnalysisRequest;
use App\Http\Resources\BusinessAnalysisResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessAnalysis;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BusinessAnalysisController extends Controller
{
    private function owned(Request $request, string $business): Business
    {
        Gate::authorize('viewAny', Business::class);
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        Gate::authorize('viewAny', [BusinessAnalysis::class, $owned]);

        return $owned;
    }

    private function data(Request $request, BusinessAnalysis $analysis, array $state, BusinessAnalysisService $service): array
    {
        return (new BusinessAnalysisResource($analysis))->resolve($request) + ['freshness' => $service->freshness($analysis, $state)];
    }

    private function response(mixed $data, array $meta, int $status = 200): JsonResponse
    {
        $response = ApiResponse::success($data, 'Success.', $status);
        $response->setData($response->getData(true) + ['meta' => $meta]);

        return $response;
    }

    public function index(Request $request, string $business, BusinessAnalysisService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $validated = $request->validate(['page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:50']]);
        $state = $service->capture($owned);
        $page = $owned->analyses()->orderByDesc('version')->paginate($validated['per_page'] ?? 20);

        return $this->response($page->getCollection()->map(fn ($a) => $this->data($request, $a, $state, $service))->all(),
            $service->metadata($owned, $state) + ['pagination' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'last_page' => $page->lastPage()]]);
    }

    public function latest(Request $request, string $business, BusinessAnalysisService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $state = $service->capture($owned);
        $latest = $owned->analyses()->orderByDesc('version')->first();

        return $this->response($latest ? $this->data($request, $latest, $state, $service) : null, $service->metadata($owned, $state));
    }

    public function show(Request $request, string $business, string $version, BusinessAnalysisService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        $analysis = $owned->analyses()->where('version', $version)->firstOrFail();
        Gate::authorize('view', $analysis);
        $state = $service->capture($owned);

        return $this->response($this->data($request, $analysis, $state, $service), $service->metadata($owned, $state));
    }

    public function store(CreateBusinessAnalysisRequest $request, string $business, BusinessAnalysisService $service): JsonResponse
    {
        $owned = $this->owned($request, $business);
        try {
            [$analysis,$created] = $service->generate($request->user(), $owned);
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
        $state = $service->capture($owned);

        return $this->response($this->data($request,$analysis,$state,$service),$service->metadata($owned,$state),$created ? 201 : 200);
    }
}
