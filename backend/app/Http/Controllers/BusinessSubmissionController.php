<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Http\Requests\Businesses\SubmitBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Responses\ApiResponse;
use App\Services\Readiness\ReadinessAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BusinessSubmissionController extends Controller
{
    public function store(SubmitBusinessRequest $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            if ($owned->status === BusinessStatus::Draft || $owned->status === BusinessStatus::Rejected) {
                $request->assertSubmittable($owned);
                $owned->status = BusinessStatus::PendingApproval;
                $owned->submitted_at = now();
                $owned->rejection_reason = null;
                $owned->rejected_at = null;
                $owned->rejected_by_user_id = null;
                $owned->save();
                DB::afterCommit(fn () => app(ReadinessAssessmentService::class)->recalculateSafely($owned->id));
            }

            return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request), 'Business submitted for Admin approval.');
        }, 3);
    }

    public function publish(Request $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('submit', $owned);

            if ($owned->status === BusinessStatus::Published) {
                return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request), 'Business is already published.');
            }

            if ($owned->status === BusinessStatus::PendingApproval) {
                return ApiResponse::error('Business is pending Admin approval and cannot be published yet.', 'VALIDATION_ERROR', 422);
            }

            if ($owned->status === BusinessStatus::Draft) {
                return ApiResponse::error('Business must be submitted and approved by an Admin before publishing.', 'VALIDATION_ERROR', 422);
            }

            if ($owned->status === BusinessStatus::Rejected) {
                return ApiResponse::error('Rejected business cannot be published. Please update and resubmit for approval.', 'VALIDATION_ERROR', 422);
            }

            // Status is Approved (or legacy Submitted)
            $owned->status = BusinessStatus::Published;
            $owned->published_at = now();
            $owned->save();
            DB::afterCommit(fn () => app(ReadinessAssessmentService::class)->recalculateSafely($owned->id));

            return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request), 'Business published successfully.');
        }, 3);
    }
}
