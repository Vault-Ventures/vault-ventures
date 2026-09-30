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
    public function downloadEvidence(Request $request, string $verification_request, string $evidence, \App\Services\VerificationEvidenceStorage $storage): \Symfony\Component\HttpFoundation\Response
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);
        $record = VerificationRequest::findOrFail($verification_request);
        abort_unless($record->requested_tier === VerificationTier::Tier1, 404);
        $document = $record->evidence()->findOrFail($evidence);
        abort_unless(in_array($document->mime_type, $storage::ALLOWED_MIME_TYPES, true), 422);

        try {
            $bytes = $storage->read($document);
        } catch (\Illuminate\Contracts\Encryption\DecryptException|\RuntimeException $exception) {
            // Do not expose paths, ciphertext, or decryption internals.
            abort(422, 'Evidence could not be read.');
        }
        $filename = basename(str_replace('\\', '/', $document->original_filename));
        $filename = preg_replace('/[\x00-\x1F\x7F]/u', '', $filename) ?: 'evidence';
        $disposition = \Symfony\Component\HttpFoundation\HeaderUtils::makeDisposition('attachment', $filename, 'evidence');

        // Fail closed if audit persistence fails. This records retrieval initiation,
        // not proof that a browser received every byte.
        \App\Models\VerificationEvidenceAccessLog::create([
            'actor_user_id' => $request->user()->id,
            'verification_request_id' => $record->id,
            'verification_evidence_id' => $document->id,
            'action' => 'download_initiated',
            'occurred_at' => now(),
        ]);
        return response($bytes, 200, [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => $disposition,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

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
        } elseif ($status !== 'all') {
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

    public function auditLogs(Request $request, string $verification_request): JsonResponse
    {
        Gate::authorize('viewAnyAdmin', VerificationRequest::class);
        $record = VerificationRequest::findOrFail($verification_request);
        abort_unless($record->requested_tier === VerificationTier::Tier1, 404);

        $logs = $record->auditLogs()->with('actor:id,name')
            ->orderBy('occurred_at')->orderBy('id')->get();
        $accessLogs = \App\Models\VerificationEvidenceAccessLog::query()
            ->where('verification_request_id', $record->id)
            ->orderBy('occurred_at')->orderBy('id')->get();
        $actors = \App\Models\User::whereIn('id', $accessLogs->pluck('actor_user_id'))
            ->get(['id', 'name'])->keyBy('id');

        return ApiResponse::success([
            'verification_request_id' => $record->id,
            'audit_logs' => $logs->map(fn ($log) => [
                'id' => $log->id,
                'verification_request_id' => $log->verification_request_id,
                'actor' => $log->actor ? ['id' => $log->actor->id, 'name' => $log->actor->name] : null,
                'action' => $log->action,
                'previous_status' => $log->previous_status,
                'new_status' => $log->new_status,
                'notes' => $log->notes,
                'occurred_at' => $log->occurred_at?->toIso8601String(),
            ])->all(),
            'evidence_access_logs' => $accessLogs->map(function ($log) use ($actors) {
                $actor = $actors->get($log->actor_user_id);
                return [
                    'id' => $log->id,
                    'verification_request_id' => $log->verification_request_id,
                    'verification_evidence_id' => $log->verification_evidence_id,
                    'actor' => $actor ? ['id' => $actor->id, 'name' => $actor->name] : null,
                    'action' => $log->action,
                    'occurred_at' => $log->occurred_at?->toIso8601String(),
                ];
            })->all(),
        ]);
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

        $rejected = $this->verificationRequestService->rejectTier1Request($record, $request->user(), $rejectionReason, $notes, $request->validated('participant_message'));

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

        $updated = $this->verificationRequestService->requestInformationTier1Request($record, $request->user(), $notes, $request->validated('participant_message'));

        return ApiResponse::success(
            (new AdminVerificationRequestResource($updated))->resolve($request),
            'Additional information requested.'
        );
    }
}
