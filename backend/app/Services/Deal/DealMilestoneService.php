<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Models\Deal;
use App\Models\DealMilestone;
use App\Models\DealStateHistory;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealMilestoneService
{
    /**
     * Retrieve all milestones and funding summary for a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getMilestones(Deal $deal, User $user, ?string $roleParam = null): array
    {
        $this->enforceDealAccess($deal, $user, $roleParam);

        $milestones = $deal->milestones()
            ->with(['submittedByUser', 'confirmedByUser'])
            ->orderBy('sequence_order')
            ->get();

        $summary = $this->calculateFundingSummary($deal);

        return [
            'deal_id' => $deal->id,
            'summary' => $summary,
            'milestones' => $milestones,
        ];
    }

    /**
     * Retrieve the funding simulation summary for a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getFundingSummary(Deal $deal, User $user, ?string $roleParam = null): array
    {
        $this->enforceDealAccess($deal, $user, $roleParam);

        return $this->calculateFundingSummary($deal);
    }

    /**
     * Create a new milestone for a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function createMilestone(Deal $deal, User $user, array $data, ?string $roleParam = null): DealMilestone
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        if (in_array($deal->stage, [DealStage::Completed], true)) {
            throw ValidationException::withMessages([
                'deal' => ['Cannot add milestones to a completed deal.'],
            ]);
        }

        $sequenceOrder = isset($data['sequence_order']) ? (int) $data['sequence_order'] : null;
        if ($sequenceOrder === null || $sequenceOrder < 1) {
            $maxSeq = $deal->milestones()->max('sequence_order') ?? 0;
            $sequenceOrder = $maxSeq + 1;
        } else {
            $exists = $deal->milestones()->where('sequence_order', $sequenceOrder)->exists();
            if ($exists) {
                throw ValidationException::withMessages([
                    'sequence_order' => ['A milestone with sequence order '.$sequenceOrder.' already exists for this deal.'],
                ]);
            }
        }

        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => ['Milestone title is required.'],
            ]);
        }

        $targetAmount = isset($data['target_amount']) ? (float) $data['target_amount'] : 0.00;
        if ($targetAmount < 0) {
            throw ValidationException::withMessages([
                'target_amount' => ['Target funding amount cannot be negative.'],
            ]);
        }

        $agreement = $deal->agreement()->first();

        return DB::transaction(function () use ($deal, $agreement, $sequenceOrder, $title, $data, $targetAmount) {
            return DealMilestone::create([
                'deal_id' => $deal->id,
                'agreement_id' => $agreement?->id,
                'sequence_order' => $sequenceOrder,
                'title' => $title,
                'description' => isset($data['description']) ? trim((string) $data['description']) : null,
                'target_amount' => $targetAmount,
                'target_date' => $data['target_date'] ?? null,
                'status' => 'pending',
                'progress_percentage' => 0,
            ]);
        });
    }

    /**
     * Update an existing milestone's details.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function updateMilestone(
        Deal $deal,
        DealMilestone $milestone,
        User $user,
        array $data,
        ?string $roleParam = null
    ): DealMilestone {
        $this->enforceDealParticipant($deal, $user, $roleParam);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        if (in_array($milestone->status, ['confirmed', 'funded'], true)) {
            throw ValidationException::withMessages([
                'milestone' => ['Confirmed or funded milestones are immutable and cannot be modified.'],
            ]);
        }

        if (isset($data['sequence_order'])) {
            $newSeq = (int) $data['sequence_order'];
            if ($newSeq < 1) {
                throw ValidationException::withMessages([
                    'sequence_order' => ['Sequence order must be a positive integer.'],
                ]);
            }
            if ($newSeq !== $milestone->sequence_order) {
                $exists = $deal->milestones()
                    ->where('sequence_order', $newSeq)
                    ->where('id', '!=', $milestone->id)
                    ->exists();
                if ($exists) {
                    throw ValidationException::withMessages([
                        'sequence_order' => ['A milestone with sequence order '.$newSeq.' already exists for this deal.'],
                    ]);
                }
                $milestone->sequence_order = $newSeq;
            }
        }

        if (isset($data['title'])) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                throw ValidationException::withMessages([
                    'title' => ['Milestone title cannot be empty.'],
                ]);
            }
            $milestone->title = $title;
        }

        if (array_key_exists('description', $data)) {
            $milestone->description = $data['description'] !== null ? trim((string) $data['description']) : null;
        }

        if (isset($data['target_amount'])) {
            $targetAmount = (float) $data['target_amount'];
            if ($targetAmount < 0) {
                throw ValidationException::withMessages([
                    'target_amount' => ['Target funding amount cannot be negative.'],
                ]);
            }
            $milestone->target_amount = $targetAmount;
        }

        if (array_key_exists('target_date', $data)) {
            $milestone->target_date = $data['target_date'];
        }

        $milestone->save();

        return $milestone;
    }

    /**
     * Update milestone execution progress (Founder only).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function updateProgress(
        Deal $deal,
        DealMilestone $milestone,
        User $user,
        array $data,
        ?string $roleParam = null
    ): DealMilestone {
        $this->enforceFounderOnly($deal, $user);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        if ($milestone->status !== 'active') {
            throw ValidationException::withMessages([
                'milestone' => ['Progress can only be recorded on currently active milestones. Milestone status is: '.$milestone->status.'.'],
            ]);
        }

        if (! isset($data['progress_percentage'])) {
            throw ValidationException::withMessages([
                'progress_percentage' => ['Progress percentage is required.'],
            ]);
        }

        $progress = (int) $data['progress_percentage'];
        if ($progress < 0 || $progress > 100) {
            throw ValidationException::withMessages([
                'progress_percentage' => ['Progress percentage must be between 0 and 100.'],
            ]);
        }

        $milestone->progress_percentage = $progress;

        if (isset($data['notes']) || isset($data['evidence_notes'])) {
            $milestone->evidence_notes = trim((string) ($data['evidence_notes'] ?? $data['notes']));
        }

        if (isset($data['evidence_urls']) && is_array($data['evidence_urls'])) {
            $milestone->evidence_urls = $data['evidence_urls'];
        }

        $milestone->save();

        return $milestone;
    }

    /**
     * Submit milestone completion with evidence (Founder only).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function submitMilestone(
        Deal $deal,
        DealMilestone $milestone,
        User $user,
        array $data,
        ?string $roleParam = null
    ): DealMilestone {
        $this->enforceFounderOnly($deal, $user);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        if ($milestone->status !== 'active') {
            throw ValidationException::withMessages([
                'milestone' => ['Only active milestones can be submitted for verification. Current status: '.$milestone->status.'.'],
            ]);
        }

        $progress = isset($data['progress_percentage']) ? (int) $data['progress_percentage'] : $milestone->progress_percentage;
        if ($progress !== 100) {
            throw ValidationException::withMessages([
                'progress_percentage' => ['Milestone progress must reach 100% before submission.'],
            ]);
        }

        $evidenceNotes = trim((string) ($data['evidence_notes'] ?? $data['notes'] ?? $milestone->evidence_notes ?? ''));
        $evidenceUrls = $data['evidence_urls'] ?? $milestone->evidence_urls ?? [];

        if ($evidenceNotes === '' && empty($evidenceUrls)) {
            throw ValidationException::withMessages([
                'evidence' => ['Evidence notes or documentation links are required to submit milestone completion.'],
            ]);
        }

        return DB::transaction(function () use ($milestone, $user, $progress, $evidenceNotes, $evidenceUrls) {
            $locked = DealMilestone::where('id', $milestone->id)->lockForUpdate()->firstOrFail();

            $locked->status = 'submitted';
            $locked->progress_percentage = $progress;
            $locked->evidence_notes = $evidenceNotes !== '' ? $evidenceNotes : null;
            $locked->evidence_urls = ! empty($evidenceUrls) ? (array) $evidenceUrls : null;
            $locked->submitted_at = now();
            $locked->submitted_by_user_id = $user->id;
            $locked->dispute_reason = null;
            $locked->save();

            return $locked;
        });
    }

    /**
     * Confirm milestone completion and trigger simulated tranche release (Counterparty only).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function confirmMilestone(
        Deal $deal,
        DealMilestone $milestone,
        User $user,
        array $data = [],
        ?string $roleParam = null
    ): DealMilestone {
        $this->enforceCounterpartyOnly($deal, $user, $roleParam);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        if ($milestone->status !== 'submitted') {
            throw ValidationException::withMessages([
                'milestone' => ['Only submitted milestones can be confirmed. Current status: '.$milestone->status.'.'],
            ]);
        }

        return DB::transaction(function () use ($deal, $milestone, $user, $data) {
            $locked = DealMilestone::where('id', $milestone->id)->lockForUpdate()->firstOrFail();

            $locked->confirmed_at = now();
            $locked->confirmed_by_user_id = $user->id;
            $locked->confirmation_notes = isset($data['notes']) || isset($data['confirmation_notes'])
                ? trim((string) ($data['confirmation_notes'] ?? $data['notes']))
                : null;
            $locked->funded_at = now();
            $locked->status = 'funded';
            $locked->save();

            // Sequentially activate the next pending milestone if one exists
            $nextMilestone = DealMilestone::where('deal_id', $deal->id)
                ->where('sequence_order', '>', $locked->sequence_order)
                ->orderBy('sequence_order')
                ->lockForUpdate()
                ->first();

            if ($nextMilestone && $nextMilestone->status === 'pending') {
                $nextMilestone->status = 'active';
                $nextMilestone->save();
            }

            return $locked;
        });
    }

    /**
     * Dispute/return a submitted milestone for revision (Counterparty only).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function disputeMilestone(
        Deal $deal,
        DealMilestone $milestone,
        User $user,
        array $data,
        ?string $roleParam = null
    ): DealMilestone {
        $this->enforceCounterpartyOnly($deal, $user, $roleParam);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        if ($milestone->status !== 'submitted') {
            throw ValidationException::withMessages([
                'milestone' => ['Only submitted milestones can be returned for revision. Current status: '.$milestone->status.'.'],
            ]);
        }

        $reason = trim((string) ($data['dispute_reason'] ?? $data['reason'] ?? ''));
        if ($reason === '') {
            throw ValidationException::withMessages([
                'dispute_reason' => ['A dispute or revision reason is required.'],
            ]);
        }

        return DB::transaction(function () use ($milestone, $reason) {
            $locked = DealMilestone::where('id', $milestone->id)->lockForUpdate()->firstOrFail();

            $locked->status = 'active';
            $locked->dispute_reason = $reason;
            $locked->save();

            return $locked;
        });
    }

    /**
     * Validate agreement & milestones, and transition Deal stage from agreement to milestone_funding_active.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function activateMilestones(Deal $deal, User $user, ?string $roleParam = null): Deal
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        if ($deal->stage !== DealStage::Agreement) {
            throw ValidationException::withMessages([
                'deal' => ['Milestone funding can only be activated when deal is in agreement stage. Current stage: '.$deal->stage->label().'.'],
            ]);
        }

        $agreement = $deal->agreement()->first();
        if (! $agreement || ! $agreement->isFinalized()) {
            throw ValidationException::withMessages([
                'agreement' => ['An accepted and finalized agreement is required before activating milestone funding.'],
            ]);
        }

        $milestones = $deal->milestones()->orderBy('sequence_order')->get();
        if ($milestones->isEmpty()) {
            throw ValidationException::withMessages([
                'milestones' => ['At least one milestone must be defined before activating milestone funding.'],
            ]);
        }

        // Validate funding allocation integrity if agreement has an investment amount
        $committedAmount = isset($agreement->terms_snapshot['amount']) && $agreement->terms_snapshot['amount'] !== null
            ? (float) $agreement->terms_snapshot['amount']
            : 0.00;

        if ($committedAmount > 0) {
            $allocatedSum = 0.00;
            foreach ($milestones as $m) {
                $allocatedSum += (float) $m->target_amount;
            }

            // Exact decimal comparison (BDT 2 decimal places)
            $allocatedFormatted = sprintf('%.2f', $allocatedSum);
            $committedFormatted = sprintf('%.2f', $committedAmount);

            if ($allocatedFormatted !== $committedFormatted) {
                throw ValidationException::withMessages([
                    'milestones' => ['Total allocated milestone funding (BDT '.$allocatedFormatted.') must equal the accepted agreement investment amount (BDT '.$committedFormatted.').'],
                ]);
            }
        }

        return DB::transaction(function () use ($deal, $user, $milestones) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();
            $previousState = $lockedDeal->stage;

            $lockedDeal->stage = DealStage::MilestoneFundingActive;
            $lockedDeal->save();

            // Activate the first milestone in sequence
            $firstMilestone = $milestones->first();
            if ($firstMilestone && $firstMilestone->status === 'pending') {
                $firstMilestone->status = 'active';
                $firstMilestone->save();
            }

            DealStateHistory::create([
                'deal_id' => $lockedDeal->id,
                'previous_state' => $previousState,
                'new_state' => DealStage::MilestoneFundingActive,
                'changed_by_user_id' => $user->id,
                'changed_at' => now(),
            ]);

            return $lockedDeal;
        });
    }

    /**
     * Explicitly complete the Deal once all milestones are funded.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function completeDeal(Deal $deal, User $user, ?string $roleParam = null): Deal
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        if ($deal->stage !== DealStage::MilestoneFundingActive) {
            throw ValidationException::withMessages([
                'deal' => ['Deal can only be completed from milestone_funding_active stage. Current stage: '.$deal->stage->label().'.'],
            ]);
        }

        $milestones = $deal->milestones()->get();
        if ($milestones->isEmpty()) {
            throw ValidationException::withMessages([
                'milestones' => ['Cannot complete a deal with no configured milestones.'],
            ]);
        }

        $unfunded = $milestones->filter(fn (DealMilestone $m) => $m->status !== 'funded');
        if ($unfunded->isNotEmpty()) {
            throw ValidationException::withMessages([
                'milestones' => ['All milestones must be funded before completing the deal. Unfunded milestone count: '.$unfunded->count().'.'],
            ]);
        }

        $summary = $this->calculateFundingSummary($deal);
        if ($summary['total_committed_bdt'] > 0) {
            $releasedFormatted = sprintf('%.2f', $summary['total_released_bdt']);
            $committedFormatted = sprintf('%.2f', $summary['total_committed_bdt']);

            if ($releasedFormatted !== $committedFormatted) {
                throw ValidationException::withMessages([
                    'funding' => ['Total released funding (BDT '.$releasedFormatted.') must equal committed funding (BDT '.$committedFormatted.') before completion.'],
                ]);
            }
        }

        return DB::transaction(function () use ($deal, $user) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();
            $previousState = $lockedDeal->stage;

            $lockedDeal->stage = DealStage::Completed;
            $lockedDeal->save();

            DealStateHistory::create([
                'deal_id' => $lockedDeal->id,
                'previous_state' => $previousState,
                'new_state' => DealStage::Completed,
                'changed_by_user_id' => $user->id,
                'changed_at' => now(),
            ]);

            return $lockedDeal;
        });
    }

    /**
     * Calculate deterministic funding summary for a deal.
     */
    public function calculateFundingSummary(Deal $deal): array
    {
        $agreement = $deal->agreement()->first();
        $totalCommitted = 0.00;
        if ($agreement && isset($agreement->terms_snapshot['amount']) && $agreement->terms_snapshot['amount'] !== null) {
            $totalCommitted = (float) $agreement->terms_snapshot['amount'];
        }

        $milestones = $deal->milestones()->get();

        $totalAllocated = 0.00;
        $totalReleased = 0.00;

        foreach ($milestones as $milestone) {
            $amount = (float) $milestone->target_amount;
            $totalAllocated += $amount;
            if ($milestone->status === 'funded') {
                $totalReleased += $amount;
            }
        }

        $remainingLocked = max(0.00, $totalCommitted - $totalReleased);
        $progressPct = $totalCommitted > 0
            ? round(($totalReleased / $totalCommitted) * 100, 2)
            : 0.00;

        return [
            'currency' => 'BDT',
            'total_committed_bdt' => round($totalCommitted, 2),
            'total_allocated_bdt' => round($totalAllocated, 2),
            'total_released_bdt' => round($totalReleased, 2),
            'remaining_locked_bdt' => round($remainingLocked, 2),
            'funding_progress_percentage' => $progressPct,
        ];
    }

    /**
     * Enforce that a milestone belongs to the given deal.
     *
     * @throws HttpException
     */
    private function enforceMilestoneBelongsToDeal(Deal $deal, DealMilestone $milestone): void
    {
        if ($milestone->deal_id !== $deal->id) {
            throw new HttpException(404, 'Milestone not found for this deal.');
        }
    }

    /**
     * Enforce deal access for viewing/auditing (Participants + Admin).
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealAccess(Deal $deal, User $user, ?string $roleParam): void
    {
        if ($user->hasAdminAccess()) {
            return;
        }

        $this->enforceDealParticipant($deal, $user, $roleParam);
    }

    /**
     * Enforce participant authorization on a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealParticipant(Deal $deal, User $user, ?string $roleParam): void
    {
        $isFounder = $deal->founder_user_id === $user->id;
        $isCounterparty = $deal->counterparty_user_id === $user->id;

        if (! $isFounder && ! $isCounterparty) {
            throw new HttpException(403, 'Only deal participants may access milestone data.');
        }

        if ($isCounterparty) {
            $this->validateCounterpartyRole($user, $deal->counterparty_role, $roleParam);
        }
    }

    /**
     * Enforce founder-only actions.
     *
     * @throws HttpException
     */
    private function enforceFounderOnly(Deal $deal, User $user): void
    {
        if ($deal->founder_user_id !== $user->id) {
            throw new HttpException(403, 'Only the deal founder may perform this action.');
        }
    }

    /**
     * Enforce counterparty-only actions.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceCounterpartyOnly(Deal $deal, User $user, ?string $roleParam): void
    {
        if ($deal->counterparty_user_id !== $user->id) {
            throw new HttpException(403, 'Only the deal counterparty may perform this action.');
        }

        $this->validateCounterpartyRole($user, $deal->counterparty_role, $roleParam);
    }

    /**
     * Validate counterparty role and multi-role parameters.
     *
     * @throws ValidationException
     * @throws HttpException
     */
    private function validateCounterpartyRole(User $user, ParticipantRole $expectedRole, ?string $roleParam): void
    {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'User does not possess the required participant role.');
        }

        if ($hasInvestor && $hasProfessional) {
            if ($roleParam === null || trim($roleParam) === '') {
                throw ValidationException::withMessages([
                    'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
                ]);
            }

            $normalized = strtolower(trim($roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            if ($normalized !== $expectedRole->value) {
                throw new HttpException(403, 'User role does not match deal counterparty role.');
            }

            return;
        }

        if ($roleParam !== null && trim($roleParam) !== '') {
            $normalized = strtolower(trim($roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }

            if ($normalized !== $expectedRole->value) {
                throw new HttpException(403, 'User role does not match deal counterparty role.');
            }
        }

        if (! $user->hasRole($expectedRole)) {
            throw new HttpException(403, 'User does not possess the required role for this deal.');
        }
    }
}
