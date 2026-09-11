<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Http\Requests\Businesses\SubmitBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Responses\ApiResponse;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BusinessSubmissionController extends Controller
{
    public function store(SubmitBusinessRequest $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('submit', $owned);
            if ($owned->status === BusinessStatus::Draft) {
                $request->assertSubmittable($owned);
                $owned->status = BusinessStatus::Submitted;
                $owned->submitted_at = now();
                $owned->save();
                DB::afterCommit(fn () => app(ReadinessAssessmentService::class)->recalculateSafely($owned->id));
            }

            return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request), 'Business submitted.');
        }, 3);
    }
}
