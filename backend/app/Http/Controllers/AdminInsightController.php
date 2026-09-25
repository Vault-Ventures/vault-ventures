<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminInsightResource;
use App\Http\Responses\ApiResponse;
use App\Models\AdminInsight;
use App\Services\Admin\AdminInsightService;
use App\Services\BusinessAnalysis\AnalysisFailure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AdminInsightController extends Controller
{
    public function current(Request $request, AdminInsightService $service): JsonResponse
    {
        try {
            $user = $request->user();
            if (! $user || ! $user->hasAdminAccess()) {
                return ApiResponse::error('Unauthorized. Admin access required.', 'HTTP_403', 403);
            }

            $insight = $service->current();

            return ApiResponse::success($insight ? (new AdminInsightResource($insight))->resolve($request) : null);
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function history(Request $request, AdminInsightService $service): JsonResponse
    {
        try {
            $user = $request->user();
            if (! $user || ! $user->hasAdminAccess()) {
                return ApiResponse::error('Unauthorized. Admin access required.', 'HTTP_403', 403);
            }

            $items = $service->history();

            return ApiResponse::success(AdminInsightResource::collection($items)->resolve($request));
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }

    public function store(Request $request, AdminInsightService $service): JsonResponse
    {
        try {
            $user = $request->user();
            if (! $user || ! $user->hasAdminAccess()) {
                return ApiResponse::error('Unauthorized. Admin access required.', 'HTTP_403', 403);
            }

            [$insight, $created] = $service->generate($user);

            return ApiResponse::success(
                (new AdminInsightResource($insight))->resolve($request),
                $created ? 'Platform insight generated.' : 'Platform insight reused.',
                $created ? 201 : 200
            );
        } catch (HttpException $e) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 'FORBIDDEN', $e->getStatusCode());
        } catch (AnalysisFailure $failure) {
            return ApiResponse::error($failure->getMessage(), $failure->reason, $failure->status);
        }
    }
}
