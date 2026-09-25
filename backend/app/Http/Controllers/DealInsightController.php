<?php

namespace App\Http\Controllers;

use App\Http\Resources\DealInsightResource;
use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\Deal\DealInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DealInsightController extends Controller
{
    public function current(Request $request, string $deal, DealInsightService $service): JsonResponse
    {
        try {
            $dealModel = Deal::findOrFail($deal);
            $role = $request->query('role');
            $insight = $service->currentForUser($dealModel, $request->user(), $role);

            return ApiResponse::success($insight ? $this->data($insight, $request, $service, $dealModel) : null);
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function history(Request $request, string $deal, DealInsightService $service): JsonResponse
    {
        try {
            $dealModel = Deal::findOrFail($deal);
            $role = $request->query('role');
            $items = $service->historyForUser($dealModel, $request->user(), $role);

            return ApiResponse::success($items->map(fn ($item) => $this->data($item, $request, $service, $dealModel))->all());
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function store(Request $request, string $deal, DealInsightService $service): JsonResponse
    {
        try {
            $dealModel = Deal::findOrFail($deal);
            $role = $request->query('role') ?? $request->input('role');
            [$insight, $created] = $service->generate($dealModel, $request->user(), $role);

            return ApiResponse::success(
                $this->data($insight, $request, $service, $dealModel),
                $created ? 'Deal insight generated.' : 'Deal insight reused.',
                $created ? 201 : 200
            );
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    private function data($insight, Request $request, DealInsightService $service, Deal $deal): array
    {
        return (new DealInsightResource($insight))->resolve($request)
            + ['freshness' => $service->freshness($insight, $deal)];
    }
}
