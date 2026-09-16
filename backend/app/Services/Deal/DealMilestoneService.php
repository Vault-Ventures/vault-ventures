<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Models\Deal;
use App\Models\DealMilestone;
use App\Models\DealStateHistory;
use App\Models\User;
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
     * Prevents milestone creation once funding is active or the deal is completed.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function createMilestone(Deal $deal, User $user, array $data, ?string $roleParam = null): DealMilestone
    {
        $this->enforceFounderOnly($deal, $user);

        $sequenceOrder = isset($data['sequence_order']) ? (int) $data['sequence_order'] : null;
        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => ['Milestone title is required.'],
            ]);
        }
        if (mb_strlen($title) > 255) {
            throw ValidationException::withMessages([
                'title' => ['Milestone title cannot exceed 255 characters.'],
            ]);
        }

        if (array_key_exists('target_amount', $data) && ! is_numeric($data['target_amount'])) {
            throw ValidationException::withMessages([
                'target_amount' => ['Target funding amount must be a valid numeric value.'],
            ]);
        }

        $targetAmount = isset($data['target_amount']) ? (float) $data['target_amount'] : 0.00;
        if ($targetAmount < 0) {
            throw ValidationException::withMessages([
                'target_amount' => ['Target funding amount cannot be negative.'],
            ]);
        }
        if ($targetAmount > 999999999999.99 || ! is_finite($targetAmount)) {
            throw ValidationException::withMessages([
                'target_amount' => ['Target funding amount exceeds maximum allowed value (BDT 999,999,999,999.99).'],
            ]);
        }

        $targetDate = $this->validateTargetDate($data['target_date'] ?? null);

        return DB::transaction(function () use ($deal, $sequenceOrder, $title, $data, $targetAmount, $targetDate) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            if (in_array($lockedDeal->stage, [DealStage::MilestoneFundingActive, DealStage::Completed], true)) {
                throw ValidationException::withMessages([
                    'deal' => ['Cannot add milestones after milestone funding has been activated or the deal is completed.'],
                ]);
            }

            if ($sequenceOrder === null || $sequenceOrder < 1) {
                $maxSeq = $lockedDeal->milestones()->lockForUpdate()->max('sequence_order') ?? 0;
                $sequenceOrder = $maxSeq + 1;
            } else {
                $exists = $lockedDeal->milestones()->where('sequence_order', $sequenceOrder)->lockForUpdate()->exists();
                if ($exists) {
                    throw ValidationException::withMessages([
                        'sequence_order' => ['A milestone with sequence order '.$sequenceOrder.' already exists for this deal.'],
                    ]);
                }
            }

            $agreement = $lockedDeal->agreement()->first();

            return DealMilestone::create([
                'deal_id' => $lockedDeal->id,
                'agreement_id' => $agreement?->id,
                'sequence_order' => $sequenceOrder,
                'title' => $title,
                'description' => isset($data['description']) ? trim((string) $data['description']) : null,
                'target_amount' => $targetAmount,
                'target_date' => $targetDate,
                'status' => 'pending',
                'progress_percentage' => 0,
            ]);
        });
    }

    /**
     * Update an existing milestone's details.
     * Prevents modifying financial target amount or sequence once funding is activated or milestone is funded/submitted.
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
        $this->enforceFounderOnly($deal, $user);
        $this->enforceMilestoneBelongsToDeal($deal, $milestone);

        return DB::transaction(function () use ($deal, $milestone, $data) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();
            $lockedMilestone = DealMilestone::where('id', $milestone->id)->lockForUpdate()->firstOrFail();

            if (in_array($lockedMilestone->status, ['submitted', 'funded'], true) || $lockedMilestone->confirmed_at !== null) {
                throw ValidationException::withMessages([
                    'milestone' => ['Submitted or funded milestones are locked and cannot be modified.'],
                ]);
            }

            $isFundingLocked = in_array($lockedDeal->stage, [DealStage::MilestoneFundingActive, DealStage::Completed], true);

            if (array_key_exists('target_amount', $data)) {
                if (! is_numeric($data['target_amount'])) {
                    throw ValidationException::withMessages([
                        'target_amount' => ['Target funding amount must be a valid numeric value.'],
                    ]);
                }

                $targetAmount = (float) $data['target_amount'];
                if ($targetAmount < 0) {
                    throw ValidationException::withMessages([
                        'target_amount' => ['Target funding amount cannot be negative.'],
                    ]);
                }
                if ($targetAmount > 999999999999.99 || ! is_finite($targetAmount)) {
                    throw ValidationException::withMessages([
                        'target_amount' => ['Target funding amount exceeds maximum allowed value (BDT 999,999,999,999.99).'],
                    ]);
                }

                if ($isFundingLocked && sprintf('%.2f', $targetAmount) !== sprintf('%.2f', (float) $lockedMilestone->target_amount)) {
                    throw ValidationException::withMessages([
                        'target_amount' => ['Milestone target amount cannot be modified after milestone funding has been activated.'],
                    ]);
                }

                $lockedMilestone->target_amount = $targetAmount;
            }

            if (isset($data['sequence_order'])) {
                $newSeq = (int) $data['sequence_order'];
                if ($newSeq < 1) {
                    throw ValidationException::withMessages([
                        'sequence_order' => ['Sequence order must be a positive integer.'],
                    ]);
                }
                if ($newSeq !== $lockedMilestone->sequence_order) {
                    if ($isFundingLocked) {
                        throw ValidationException::withMessages([
                            'sequence_order' => ['Milestone sequence order cannot be modified after milestone funding has been activated.'],
                        ]);
                    }

                    $exists = $lockedDeal->milestones()
                        ->where('sequence_order', $newSeq)
                        ->where('id', '!=', $lockedMilestone->id)
                        ->lockForUpdate()
                        ->exists();
                    if ($exists) {
                        throw ValidationException::withMessages([
                            'sequence_order' => ['A milestone with sequence order '.$newSeq.' already exists for this deal.'],
                        ]);
                    }
                    $lockedMilestone->sequence_order = $newSeq;
                }
            }

            if (isset($data['title'])) {
                $title = trim((string) $data['title']);
                if ($title === '') {
                    throw ValidationException::withMessages([
                        'title' => ['Milestone title cannot be empty.'],
                    ]);
                }
                if (mb_strlen($title) > 255) {
                    throw ValidationException::withMessages([
                        'title' => ['Milestone title cannot exceed 255 characters.'],
                    ]);
                }
                $lockedMilestone->title = $title;
            }

            if (array_key_exists('description', $data)) {
                $lockedMilestone->description = $data['description'] !== null ? trim((string) $data['description']) : null;
            }

            if (array_key_exists('target_date', $data)) {
                $lockedMilestone->target_date = $this->validateTargetDate(
                    $data['target_date'], $lockedMilestone->target_date?->format('Y-m-d')
                );
            }

            $lockedMilestone->save();

            return $lockedMilestone;
        });
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

        $hasDispute = $milestone->dispute_reason !== null && trim($milestone->dispute_reason) !== '';

        $newNotes = isset($data['evidence_notes']) || isset($data['notes'])
            ? trim((string) ($data['evidence_notes'] ?? $data['notes']))
            : null;
        $newUrls = isset($data['evidence_urls']) && is_array($data['evidence_urls'])
            ? $data['evidence_urls']
            : null;

        if ($hasDispute) {
            if ($newNotes === null && $newUrls === null) {
                throw ValidationException::withMessages([
                    'evidence' => ['Revised evidence notes or updated documentation links are required to address the dispute reason before resubmitting.'],
                ]);
            }

            $currentNotes = trim((string) ($milestone->evidence_notes ?? ''));
            $currentUrls = (array) ($milestone->evidence_urls ?? []);

            $effectiveNotes = $newNotes ?? $currentNotes;
            $effectiveUrls = $newUrls ?? $currentUrls;

            if ($effectiveNotes === '' && empty($effectiveUrls)) {
                throw ValidationException::withMessages([
                    'evidence' => ['Revised evidence notes or updated documentation links are required to address the dispute reason before resubmitting.'],
                ]);
            }

            $notesUnchanged = ($newNotes === null || $newNotes === $currentNotes);
            $urlsUnchanged = ($newUrls === null || $newUrls === $currentUrls);

            if ($notesUnchanged && $urlsUnchanged) {
                throw ValidationException::withMessages([
                    'evidence' => ['Revised evidence notes or updated documentation links must be provided to address the dispute reason: "'.$milestone->dispute_reason.'".'],
                ]);
            }

            $evidenceNotes = $effectiveNotes;
            $evidenceUrls = $effectiveUrls;
        } else {
            $evidenceNotes = $newNotes ?? trim((string) ($milestone->evidence_notes ?? ''));
            $evidenceUrls = $newUrls ?? ($milestone->evidence_urls ?? []);

            if ($evidenceNotes === '' && empty($evidenceUrls)) {
                throw ValidationException::withMessages([
                    'evidence' => ['Evidence notes or documentation links are required to submit milestone completion.'],
                ]);
            }
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

        return DB::transaction(function () use ($deal, $user) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            if ($lockedDeal->stage !== DealStage::Agreement) {
                throw ValidationException::withMessages([
                    'deal' => ['Milestone funding can only be activated when deal is in agreement stage. Current stage: '.$lockedDeal->stage->label().'.'],
                ]);
            }

            $agreement = $lockedDeal->agreement()->first();
            if (! $agreement || ! $agreement->isFinalized()) {
                throw ValidationException::withMessages([
                    'agreement' => ['An accepted and finalized agreement is required before activating milestone funding.'],
                ]);
            }

            $milestones = $lockedDeal->milestones()->orderBy('sequence_order')->lockForUpdate()->get();
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
     * Safely distinguishes under-funded from over-allocated states inside row locks.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function completeDeal(Deal $deal, User $user, ?string $roleParam = null): Deal
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        return DB::transaction(function () use ($deal, $user) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            if ($lockedDeal->stage !== DealStage::MilestoneFundingActive) {
                throw ValidationException::withMessages([
                    'deal' => ['Deal can only be completed from milestone_funding_active stage. Current stage: '.$lockedDeal->stage->label().'.'],
                ]);
            }

            $milestones = $lockedDeal->milestones()->lockForUpdate()->get();
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

            $summary = $this->calculateFundingSummary($lockedDeal);
            if ($summary['total_committed_bdt'] > 0) {
                $released = (float) $summary['total_released_bdt'];
                $committed = (float) $summary['total_committed_bdt'];
                $releasedFormatted = sprintf('%.2f', $released);
                $committedFormatted = sprintf('%.2f', $committed);

                if ($released < $committed) {
                    throw ValidationException::withMessages([
                        'funding' => ['Deal is underfunded. Total released funding (BDT '.$releasedFormatted.') is less than committed funding (BDT '.$committedFormatted.').'],
                    ]);
                }

                if ($released > $committed) {
                    throw ValidationException::withMessages([
                        'funding' => ['Deal is over-allocated and in an invalid state. Total released funding (BDT '.$releasedFormatted.') exceeds committed funding (BDT '.$committedFormatted.'). Admin reconciliation required.'],
                    ]);
                }
            }

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
            ? min(100.00, max(0.00, round(($totalReleased / $totalCommitted) * 100, 2)))
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
        app(DealAccessService::class)->view($deal, $user, $roleParam);
    }

    /**
     * Enforce participant authorization on a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealParticipant(Deal $deal, User $user, ?string $roleParam): void
    {
        app(DealAccessService::class)->participant($deal, $user, $roleParam);
    }

    /**
     * Enforce founder-only actions.
     *
     * @throws HttpException
     */
    private function enforceFounderOnly(Deal $deal, User $user): void
    {
        app(DealAccessService::class)->founder($deal, $user);
    }

    /**
     * Enforce counterparty-only actions.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceCounterpartyOnly(Deal $deal, User $user, ?string $roleParam): void
    {
        app(DealAccessService::class)->counterparty($deal, $user, $roleParam);
    }

    private function validateTargetDate(mixed $value, ?string $existing = null): ?string
    {
        if ($value === null) {
            return null;
        }
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
            throw ValidationException::withMessages(['target_date' => ['Target date must be a valid YYYY-MM-DD calendar date.']]);
        }
        [$year, $month, $day] = array_map('intval', explode('-', $value));
        if (! checkdate($month, $day, $year)) {
            throw ValidationException::withMessages(['target_date' => ['Target date must be a valid YYYY-MM-DD calendar date.']]);
        }
        if ($value !== $existing && $value < today(config('app.timezone'))->toDateString()) {
            throw ValidationException::withMessages(['target_date' => ['Target date cannot be before today.']]);
        }
        return $value;
    }

}
