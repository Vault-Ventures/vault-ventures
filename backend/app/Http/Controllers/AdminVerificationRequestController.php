<?php

namespace App\Http\Controllers;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Http\Requests\Verification\ApproveVerificationRequestRequest;
use App\Http\Requests\Verification\RejectVerificationRequestRequest;
use App\Http\Requests\Verification\RequestInformationVerificationRequestRequest;
use App\Http\Resources\AdminVerificationRequestResource;
use App\Http\Responses\ApiResponse;
use App\Models\VerificationRequest;
use App\Services\VerificationRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class AdminVerificationRequestController extends Controller
{
    public function __construct(
        private readonly VerificationRequestService $verificationRequestService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);

        $status = $request->query('status');
        $query = VerificationRequest::where('requested_tier', VerificationTier::Tier1)
            ->with(['user', 'evidence']);

        if ($status && in_array($status, [
            VerificationRequestStatus::Pending->value,
            VerificationRequestStatus::UnderReview->value,
            VerificationRequestStatus::NeedsInformation->value,
            VerificationRequestStatus::Approved->value,
            VerificationRequestStatus::Rejected->value,
            VerificationRequestStatus::Cancelled->value,
        ], true)) {
            $query->where('status', $status);
        } else {
            // Default queue: Tier 1 requests requiring review
            $query->whereIn('status', [
                VerificationRequestStatus::Pending,
                VerificationRequestStatus::UnderReview,
                VerificationRequestStatus::NeedsInformation,
            ]);
        }

        $requests = $query->orderBy('submitted_at', 'asc')->orderBy('id', 'asc')->get();

        return ApiResponse::success(
            AdminVerificationRequestResource::collection($requests)->resolve($request)
        );
    }

    public function show(Request $request, string $verification_request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);

        $record = VerificationRequest::with(['user', 'evidence', 'assignedAdmin'])
            ->findOrFail($verification_request);

        if ($record->requested_tier !== VerificationTier::Tier1) {
            abort(404);
        }

        return ApiResponse::success(
            (new AdminVerificationRequestResource($record))->resolve($request)
        );
    }

    public function approve(ApproveVerificationRequestRequest $request, string $verification_request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);

        $record = VerificationRequest::findOrFail($verification_request);
        $notes = $request->validated('admin_notes') ?? $request->validated('notes');

        $approved = $this->verificationRequestService->approveTier1Request($record, $request->user(), $notes);

        return ApiResponse::success(
            (new AdminVerificationRequestResource($approved))->resolve($request),
            'Verification request approved successfully.'
        );
    }

    public function reject(RejectVerificationRequestRequest $request, string $verification_request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);

        $record = VerificationRequest::findOrFail($verification_request);
        $rejectionReason = $request->validated('rejection_reason') ?? $request->validated('reason') ?? $request->validated('notes') ?? $request->validated('admin_notes');
        $notes = $request->validated('admin_notes') ?? $request->validated('notes');

        $rejected = $this->verificationRequestService->rejectTier1Request($record, $request->user(), $rejectionReason, $notes);

        return ApiResponse::success(
            (new AdminVerificationRequestResource($rejected))->resolve($request),
            'Verification request rejected.'
        );
    }

    public function requestInformation(RequestInformationVerificationRequestRequest $request, string $verification_request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);

        $record = VerificationRequest::findOrFail($verification_request);
        $notes = $request->validated('admin_notes') ?? $request->validated('notes');

        $updated = $this->verificationRequestService->requestInformationTier1Request($record, $request->user(), $notes);

        return ApiResponse::success(
            (new AdminVerificationRequestResource($updated))->resolve($request),
            'Additional information requested.'
        );
    }
}
