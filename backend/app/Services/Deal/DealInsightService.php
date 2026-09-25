<?php

namespace App\Services\Deal;

use App\Enums\NdaStatus;
use App\Models\BusinessNda;
use App\Models\Deal;
use App\Models\DealInsight;
use App\Models\User;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class DealInsightService
{
    public const SOURCE_SCHEMA_VERSION = 'deal-insight-source-v1';

    public const OUTPUT_CONTRACT_VERSION = 'deal-insight-output-v1';

    /**
     * Build the canonical allowlisted source snapshot for a Deal.
     * Excludes messages, full NDA body, contract text, signatures, and private credentials.
     */
    public function snapshot(Deal $deal): array
    {
        $deal->loadMissing([
            'business',
            'founderUser',
            'counterpartyUser',
            'histories',
            'proposals',
            'agreement',
            'milestones',
        ]);

        $nda = BusinessNda::where('business_id', $deal->business_id)
            ->where('counterparty_user_id', $deal->counterparty_user_id)
            ->first();

        $acceptedProposal = $deal->proposals->firstWhere('status', 'accepted');
        $latestProposal = $deal->proposals->sortByDesc('version')->first();
        $agreement = $deal->agreement;

        return [
            'source_schema_version' => self::SOURCE_SCHEMA_VERSION,
            'deal' => [
                'id' => $deal->id,
                'stage' => $deal->stage->value,
                'stage_label' => $deal->stage->label(),
                'counterparty_role' => $deal->counterparty_role->value,
                'created_at' => $deal->created_at?->toISOString(),
            ],
            'business' => [
                'id' => $deal->business?->id,
                'name' => $deal->business?->name,
                'industry' => $deal->business?->industry,
                'business_stage' => $deal->business?->business_stage,
                'location' => $deal->business?->location,
            ],
            'nda' => [
                'status' => $nda?->status?->value,
                'is_signed' => $nda !== null && $nda->status === NdaStatus::Active,
                'is_active' => $nda?->status === NdaStatus::Active,
                'activated_at' => $nda?->activated_at?->toISOString(),
            ],
            'negotiation' => [
                'has_proposals' => $deal->proposals->isNotEmpty(),
                'accepted_proposal' => $acceptedProposal ? [
                    'version' => $acceptedProposal->version,
                    'investment_type' => $acceptedProposal->investment_type,
                    'amount' => $acceptedProposal->amount !== null ? (float) $acceptedProposal->amount : null,
                    'equity_percentage' => $acceptedProposal->equity_percentage !== null ? (float) $acceptedProposal->equity_percentage : null,
                    'profit_sharing_percentage' => $acceptedProposal->profit_sharing_percentage !== null ? (float) $acceptedProposal->profit_sharing_percentage : null,
                    'loss_sharing_terms' => $acceptedProposal->loss_sharing_terms,
                    'proposed_terms' => $acceptedProposal->proposed_terms,
                    'status' => $acceptedProposal->status,
                    'responded_at' => $acceptedProposal->responded_at?->toISOString(),
                ] : null,
                'latest_proposal' => $latestProposal ? [
                    'version' => $latestProposal->version,
                    'investment_type' => $latestProposal->investment_type,
                    'amount' => $latestProposal->amount !== null ? (float) $latestProposal->amount : null,
                    'equity_percentage' => $latestProposal->equity_percentage !== null ? (float) $latestProposal->equity_percentage : null,
                    'profit_sharing_percentage' => $latestProposal->profit_sharing_percentage !== null ? (float) $latestProposal->profit_sharing_percentage : null,
                    'proposed_by_role' => $latestProposal->proposed_by_role,
                    'status' => $latestProposal->status,
                    'note' => $latestProposal->note,
                ] : null,
            ],
            'agreement' => [
                'has_agreement' => $agreement !== null,
                'agreement_type' => $agreement?->agreement_type,
                'title' => $agreement?->title,
                'status' => $agreement?->status,
                'founder_signed' => $agreement?->founder_signed_at !== null,
                'counterparty_signed' => $agreement?->counterparty_signed_at !== null,
                'is_finalized' => $agreement?->isFinalized() ?? false,
                'finalized_at' => $agreement?->finalized_at?->toISOString(),
            ],
            'milestones' => $deal->milestones->map(fn ($m) => [
                'sequence_order' => $m->sequence_order,
                'title' => $m->title,
                'description' => $m->description,
                'target_amount' => $m->target_amount !== null ? (float) $m->target_amount : null,
                'target_date' => $m->target_date?->format('Y-m-d'),
                'status' => $m->status,
                'progress_percentage' => $m->progress_percentage,
            ])->values()->all(),
            'recent_transitions' => $deal->histories->map(fn ($h) => [
                'previous_state' => $h->previous_state?->value,
                'new_state' => $h->new_state->value,
                'changed_at' => $h->changed_at?->toISOString(),
            ])->values()->all(),
        ];
    }

    /**
     * Generate a deterministic SHA-256 fingerprint for the canonical Deal snapshot.
     */
    public function fingerprint(Deal $deal, ?array $snapshot = null): string
    {
        $snap = $snapshot ?? $this->snapshot($deal);

        return hash('sha256', json_encode($this->canonicalize($snap), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Retrieve the current persisted insight matching the current source fingerprint.
     */
    public function current(Deal $deal, ?array $snapshot = null): ?DealInsight
    {
        $fingerprint = $this->fingerprint($deal, $snapshot);

        return $deal->dealInsights()
            ->where('source_fingerprint', $fingerprint)
            ->first();
    }

    /**
     * Retrieve current insight for an authorized user (oversight/participant view).
     */
    public function currentForUser(Deal $deal, User $user, ?string $role = null): ?DealInsight
    {
        app(DealAccessService::class)->view($deal, $user, $role);

        return $this->current($deal);
    }

    /**
     * Retrieve the latest persisted insight for the Deal regardless of freshness.
     */
    public function latest(Deal $deal): ?DealInsight
    {
        return $deal->dealInsights()
            ->orderByDesc('version')
            ->first();
    }

    /**
     * Retrieve full version history for the Deal.
     */
    public function history(Deal $deal)
    {
        return $deal->dealInsights()
            ->orderByDesc('version')
            ->get();
    }

    /**
     * Retrieve full version history for an authorized user.
     */
    public function historyForUser(Deal $deal, User $user, ?string $role = null)
    {
        app(DealAccessService::class)->view($deal, $user, $role);

        return $this->history($deal);
    }

    /**
     * Assess freshness of a persisted insight against the current Deal state.
     */
    public function freshness(DealInsight $insight, ?Deal $deal = null): array
    {
        try {
            $targetDeal = $deal ?? $insight->deal;
            if (! $targetDeal) {
                return ['is_current' => false];
            }

            $currentFingerprint = $this->fingerprint($targetDeal);

            return ['is_current' => hash_equals($insight->source_fingerprint, $currentFingerprint)];
        } catch (Throwable) {
            return ['is_current' => false];
        }
    }

    /**
     * Generate or reuse an insight for an authorized participant.
     *
     * @return array{0: DealInsight, 1: bool} [Insight instance, wasCreated boolean]
     */
    public function generate(Deal $deal, User $user, ?string $role = null): array
    {
        app(DealAccessService::class)->participant($deal, $user, $role);

        $initialSnapshot = $this->snapshot($deal);
        $initialFingerprint = $this->fingerprint($deal, $initialSnapshot);

        if ($current = $this->current($deal, $initialSnapshot)) {
            return [$current, false];
        }

        $lock = Cache::store('database')->lock('deal-insight:generate:'.$deal->id, 60);
        if (! $lock->get()) {
            throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
        }

        try {
            if ($current = $this->current($deal, $initialSnapshot)) {
                return [$current, false];
            }

            $provider = app(BusinessAnalysisService::class)->provider();
            if (! $provider->enabled()) {
                throw new AnalysisFailure('PROVIDER_UNAVAILABLE', 503);
            }

            try {
                $raw = $provider->deal($initialSnapshot);
                $validated = DealInsightResult::fromJson($raw);
            } catch (AnalysisFailure $failure) {
                throw $failure;
            } catch (Throwable) {
                throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
            }

            app(DealAccessService::class)->participant($deal->fresh(), $user->fresh(), $role);
            $latestSnapshot = $this->snapshot($deal->fresh());
            $latestFingerprint = $this->fingerprint($deal->fresh(), $latestSnapshot);
            if (! hash_equals($initialFingerprint, $latestFingerprint)) {
                throw new AnalysisFailure('SOURCE_CHANGED', 409);
            }

            try {
                return $this->persist($deal->fresh(), $validated, $latestSnapshot);
            } catch (UniqueConstraintViolationException) {
                $current = $this->current($deal->fresh(), $latestSnapshot);
                if ($current !== null) {
                    return [$current, false];
                }

                throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Persist a new versioned DealInsight record immutably.
     *
     * @return array{0: DealInsight, 1: bool} [Insight instance, wasCreated boolean]
     */
    public function persist(Deal $deal, DealInsightResult $result, ?array $snapshot = null): array
    {
        $snap = $snapshot ?? $this->snapshot($deal);
        $fingerprint = $this->fingerprint($deal, $snap);

        return DB::transaction(function () use ($deal, $snap, $fingerprint, $result) {
            $current = $deal->dealInsights()
                ->where('source_fingerprint', $fingerprint)
                ->first();

            if ($current !== null) {
                return [$current, false];
            }

            $latestVersion = $deal->dealInsights()
                ->lockForUpdate()
                ->max('version');

            $insight = new DealInsight;
            $insight->forceFill([
                'deal_id' => $deal->id,
                'version' => ($latestVersion ?? 0) + 1,
                'source_schema_version' => $snap['source_schema_version'] ?? self::SOURCE_SCHEMA_VERSION,
                'output_contract_version' => self::OUTPUT_CONTRACT_VERSION,
                'source_snapshot' => $snap,
                'source_fingerprint' => $fingerprint,
                'summary' => $result->summary,
                'current_stage_summary' => $result->currentStageSummary,
                'key_points' => $result->keyPoints,
                'open_items' => $result->openItems,
                'discussion_points' => $result->discussionPoints,
                'cautions' => $result->cautions,
                'generated_at' => now(),
            ]);
            $insight->save();

            return [$insight, true];
        });
    }

    /**
     * Recursively sort array keys to guarantee canonical JSON serialization.
     */
    protected function canonicalize(array $value): array
    {
        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->canonicalize($item);
            }
        }
        ksort($value);

        return $value;
    }
}
