<?php

namespace App\Http\Controllers;

use App\Http\Resources\MatchingInsightResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\Matching\MatchingInsightService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingInsightController extends Controller
{
    public function current(Request $request, string $business, string $role, string $candidate, MatchingInsightService $service): JsonResponse
    {
        try {
            $resolved = $service->resolve($request->user(), Business::findOrFail($business), $role, (int) $candidate);
            $insight = $service->current($resolved['business'], $resolved['context']);

            return ApiResponse::success($insight ? $this->data($insight, $request, $service) : null);
        } catch (AuthorizationException) {
            return ApiResponse::error('Forbidden.', 'FORBIDDEN', 403);
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function history(Request $request, string $business, string $role, string $candidate, MatchingInsightService $service): JsonResponse
    {
        try {
            $items = $service->history($request->user(), Business::findOrFail($business), $role, (int) $candidate);

            return ApiResponse::success($items->map(fn ($item) => $this->data($item, $request, $service))->all());
        } catch (AuthorizationException) {
            return ApiResponse::error('Forbidden.', 'FORBIDDEN', 403);
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function store(Request $request, string $business, string $role, string $candidate, MatchingInsightService $service): JsonResponse
    {
        try {
            [$insight, $created] = $service->generate($request->user(), Business::findOrFail($business), $role, (int) $candidate);

            return ApiResponse::success($this->data($insight, $request, $service), $created ? 'Matching insight created.' : 'Matching insight reused.', $created ? 201 : 200);
        } catch (AuthorizationException) {
            return ApiResponse::error('Forbidden.', 'FORBIDDEN', 403);
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    private function data($insight, Request $request, MatchingInsightService $service): array
    {
        return (new MatchingInsightResource($insight))->resolve($request)
            + ['freshness' => $service->freshness($insight, $request->user())];
    }
}