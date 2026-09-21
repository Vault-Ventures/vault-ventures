<?php

namespace App\Services;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Models\User;
use App\Models\VerificationAuditLog;
use App\Models\VerificationRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VerificationRequestService
{
    public function createTier1Request(User $user): VerificationRequest
    {
        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Email verification is required before requesting identity verification.'],
            ]);
        }

        if (! $user->hasVerifiedPhone()) {
            throw ValidationException::withMessages([
                'phone' => ['Phone verification is required before requesting identity verification.'],
            ]);
        }

        if ($user->isIdentityVerified()) {
            throw ValidationException::withMessages([
                'verification_tier' => ['You are already identity verified.'],
            ]);
        }

        return DB::transaction(function () use ($user) {
            User::where('id', $user->id)->lockForUpdate()->first();

            $activeRequest = VerificationRequest::where('user_id', $user->id)
                ->whereIn('status', [
                    VerificationRequestStatus::Pending,
                    VerificationRequestStatus::UnderReview,
                    VerificationRequestStatus::NeedsInformation,
                ])
                ->lockForUpdate()
                ->first();

            if ($activeRequest !== null) {
                throw ValidationException::withMessages([
                    'request' => ['You already have an active verification request under review.'],
                ]);
            }

            return VerificationRequest::create([
                'user_id' => $user->id,
                'requested_tier' => VerificationTier::Tier1,
                'status' => VerificationRequestStatus::Pending,
                'submitted_at' => now(),
            ]);
        });
    }

    public function getLatestRequest(User $user): ?VerificationRequest
    {
        return VerificationRequest::where('user_id', $user->id)
            ->latest('id')
            ->first();
    }

    public function approveTier1Request(VerificationRequest $verificationRequest, User $admin, ?string $notes = null): VerificationRequest
    {
        return DB::transaction(function () use ($verificationRequest, $admin, $notes) {
            /** @var VerificationRequest $record */
            $record = VerificationRequest::lockForUpdate()->findOrFail($verificationRequest->id);

            if ($record->requested_tier !== VerificationTier::Tier1) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Only Tier 1 verification requests can be reviewed.'],
                ]);
            }

            if (! in_array($record->status, [
                VerificationRequestStatus::Pending,
                VerificationRequestStatus::UnderReview,
                VerificationRequestStatus::NeedsInformation,
            ], true)) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Verification request is already finalized and cannot be modified.'],
                ]);
            }

            $previousStatus = $record->status;
            $record->status = VerificationRequestStatus::Approved;
            $record->reviewed_at = now();
            $record->assigned_admin_id = $admin->id;
            if ($notes !== null) {
                $record->admin_notes = $notes;
            }
            $record->save();

            // Promote user to Tier 1
            $user = User::lockForUpdate()->findOrFail($record->user_id);
            $user->verification_tier = VerificationTier::from(max($user->verification_tier->value, VerificationTier::Tier1->value));
            $user->save();

            // Create audit log
            VerificationAuditLog::create([
                'verification_request_id' => $record->id,
                'actor_user_id' => $admin->id,
                'action' => 'approved',
                'previous_status' => $previousStatus->value,
                'new_status' => VerificationRequestStatus::Approved->value,
                'notes' => $notes,
                'occurred_at' => now(),
            ]);

            return $record->load(['user', 'evidence', 'assignedAdmin']);
        });
    }

    public function rejectTier1Request(VerificationRequest $verificationRequest, User $admin, ?string $rejectionReason = null, ?string $notes = null, ?string $participantMessage = null): VerificationRequest
    {
        return DB::transaction(function () use ($verificationRequest, $admin, $rejectionReason, $notes, $participantMessage) {
            /** @var VerificationRequest $record */
            $record = VerificationRequest::lockForUpdate()->findOrFail($verificationRequest->id);

            if ($record->requested_tier !== VerificationTier::Tier1) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Only Tier 1 verification requests can be reviewed.'],
                ]);
            }

            if (! in_array($record->status, [
                VerificationRequestStatus::Pending,
                VerificationRequestStatus::UnderReview,
                VerificationRequestStatus::NeedsInformation,
            ], true)) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Verification request is already finalized and cannot be modified.'],
                ]);
            }

            $previousStatus = $record->status;
            $record->status = VerificationRequestStatus::Rejected;
            $record->reviewed_at = now();
            $record->assigned_admin_id = $admin->id;
            $record->rejection_reason = $rejectionReason ?: $notes;
            $record->participant_message = $participantMessage;
            if ($notes !== null) {
                $record->admin_notes = $notes;
            }
            $record->save();

            // Create audit log
            VerificationAuditLog::create([
                'verification_request_id' => $record->id,
                'actor_user_id' => $admin->id,
                'action' => 'rejected',
                'previous_status' => $previousStatus->value,
                'new_status' => VerificationRequestStatus::Rejected->value,
                'notes' => $rejectionReason ?: $notes,
                'occurred_at' => now(),
            ]);

            return $record->load(['user', 'evidence', 'assignedAdmin']);
        });
    }

    public function requestInformationTier1Request(VerificationRequest $verificationRequest, User $admin, ?string $notes = null, ?string $participantMessage = null): VerificationRequest
    {
        return DB::transaction(function () use ($verificationRequest, $admin, $notes, $participantMessage) {
            /** @var VerificationRequest $record */
            $record = VerificationRequest::lockForUpdate()->findOrFail($verificationRequest->id);

            if ($record->requested_tier !== VerificationTier::Tier1) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Only Tier 1 verification requests can be reviewed.'],
                ]);
            }

            if (! in_array($record->status, [
                VerificationRequestStatus::Pending,
                VerificationRequestStatus::UnderReview,
                VerificationRequestStatus::NeedsInformation,
            ], true)) {
                throw ValidationException::withMessages([
                    'verification_request' => ['Verification request is already finalized and cannot be modified.'],
                ]);
            }

            $previousStatus = $record->status;
            $record->participant_message = $participantMessage;
            $record->status = VerificationRequestStatus::NeedsInformation;
            $record->reviewed_at = now();
            $record->assigned_admin_id = $admin->id;
            if ($notes !== null) {
                $record->admin_notes = $notes;
            }
            $record->save();

            // Create audit log
            VerificationAuditLog::create([
                'verification_request_id' => $record->id,
                'actor_user_id' => $admin->id,
                'action' => 'needs_information',
                'previous_status' => $previousStatus->value,
                'new_status' => VerificationRequestStatus::NeedsInformation->value,
                'notes' => $notes,
                'occurred_at' => now(),
            ]);

            return $record->load(['user', 'evidence', 'assignedAdmin']);
        });
    }
}
