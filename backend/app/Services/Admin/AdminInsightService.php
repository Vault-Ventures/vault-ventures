<?php

namespace App\Services\Admin;

use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Enums\VerificationRequestStatus;
use App\Models\AdminInsight;
use App\Models\Business;
use App\Models\Deal;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\BusinessAnalysis\BusinessAnalysisService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class AdminInsightService
{
    public const SOURCE_SCHEMA_VERSION = 'admin-intelligence-source-v1';

    public const OUTPUT_CONTRACT_VERSION = 'admin-intelligence-output-v1';

    /**
     * Build the canonical sanitized aggregate snapshot of platform metrics.
     * Contains only counts, sums, and status aggregations.
     * Excludes individual user PII, documents, passwords, NID/photos, and raw messages.
     */
    public function snapshot(): array
    {
        // 1. Platform counts
        $totalUsers = User::count();
        $totalBusinesses = Business::count();
        $totalDeals = Deal::count();
        $activeDealsCount = Deal::where('stage', '!=', DealStage::Completed)->count();
        $completedDealsCount = Deal::where('stage', DealStage::Completed)->count();

        // 2. Verification operations (Aggregate counts only)
        $pendingVerifications = VerificationRequest::where('status', VerificationRequestStatus::Pending)->count();
        $underReviewVerifications = VerificationRequest::where('status', VerificationRequestStatus::UnderReview)->count();
        $needsInfoVerifications = VerificationRequest::where('status', VerificationRequestStatus::NeedsInformation)->count();
        $approvedVerifications = VerificationRequest::where('status', VerificationRequestStatus::Approved)->count();
        $rejectedVerifications = VerificationRequest::where('status', VerificationRequestStatus::Rejected)->count();

        // 3. Financial governance aggregates
        $totalFinancialReports = FinancialReport::count();
        $selfReportedFinancialReports = FinancialReport::where('status', FinancialVerificationStatus::SelfReported)->count();
        $evidenceSubmittedFinancialReports = FinancialReport::where('status', FinancialVerificationStatus::EvidenceSubmitted)->count();
        $underReviewFinancialReports = FinancialReport::where('status', FinancialVerificationStatus::UnderReview)->count();
        $verifiedFinancialReports = FinancialReport::where('status', FinancialVerificationStatus::Verified)->count();

        $openDiscrepancies = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::UnderReview)->count();
        $resolvedDiscrepancies = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::Resolved)->count();
        $disputedDiscrepancies = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::Disputed)->count();

        $totalReportedRevenue = (float) FinancialReport::sum('revenue');
        $totalReportedExpenses = (float) FinancialReport::sum('expenses');
        $totalCalculatedProfitLoss = (float) FinancialReport::sum('net_profit_loss');

        // 4. Deal governance aggregate stage distribution
        $stages = [];
        foreach (DealStage::cases() as $stage) {
            $stages[$stage->value] = Deal::where('stage', $stage)->count();
        }

        return [
            'source_schema_version' => self::SOURCE_SCHEMA_VERSION,
            'platform' => [
                'total_users' => $totalUsers,
                'total_businesses' => $totalBusinesses,
                'total_deals' => $totalDeals,
                'active_deals_count' => $activeDealsCount,
                'completed_deals_count' => $completedDealsCount,
            ],
            'verification_operations' => [
                'pending_count' => $pendingVerifications,
                'under_review_count' => $underReviewVerifications,
                'needs_information_count' => $needsInfoVerifications,
                'approved_count' => $approvedVerifications,
                'rejected_count' => $rejectedVerifications,
            ],
            'financial_governance' => [
                'total_reports' => $totalFinancialReports,
                'self_reported_count' => $selfReportedFinancialReports,
                'evidence_submitted_count' => $evidenceSubmittedFinancialReports,
                'under_review_count' => $underReviewFinancialReports,
                'verified_count' => $verifiedFinancialReports,
                'discrepancies_under_review' => $openDiscrepancies,
                'discrepancies_resolved' => $resolvedDiscrepancies,
                'discrepancies_disputed' => $disputedDiscrepancies,
                'total_reported_revenue_bdt' => round($totalReportedRevenue, 2),
                'total_reported_expenses_bdt' => round($totalReportedExpenses, 2),
                'total_calculated_profit_loss_bdt' => round($totalCalculatedProfitLoss, 2),
            ],
            'deal_governance' => [
                'stages' => $stages,
            ],
        ];
    }

    /**
     * Generate a deterministic SHA-256 fingerprint for the canonical aggregate snapshot.
     */
    public function fingerprint(?array $snapshot = null): string
    {
        $snap = $snapshot ?? $this->snapshot();

        return hash('sha256', json_encode($this->canonicalize($snap), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Retrieve the current persisted insight matching the current source fingerprint.
     */
    public function current(?array $snapshot = null): ?AdminInsight
    {
        $fingerprint = $this->fingerprint($snapshot);

        return AdminInsight::where('source_fingerprint', $fingerprint)->first();
    }

    /**
     * Retrieve the latest persisted insight regardless of freshness.
     */
    public function latest(): ?AdminInsight
    {
        return AdminInsight::orderByDesc('version')->first();
    }

    /**
     * Retrieve full version history.
     */
    public function history()
    {
        return AdminInsight::orderByDesc('version')->get();
    }

    /**
     * Assess freshness of a persisted insight against the current platform aggregate state.
     */
    public function freshness(AdminInsight $insight): array
    {
        try {
            $currentFingerprint = $this->fingerprint();

            return ['is_current' => hash_equals($insight->source_fingerprint, $currentFingerprint)];
        } catch (Throwable) {
            return ['is_current' => false];
        }
    }

    /**
     * Generate or reuse an insight for an authorized administrator.
     *
     * @return array{0: AdminInsight, 1: bool} [Insight instance, wasCreated boolean]
     */
    public function generate(User $admin): array
    {
        if (! $admin->hasAdminAccess()) {
            abort(403, 'Unauthorized. Admin access required.');
        }

        $initialSnapshot = $this->snapshot();
        $initialFingerprint = $this->fingerprint($initialSnapshot);

        if ($current = $this->current($initialSnapshot)) {
            return [$current, false];
        }

        $lock = Cache::store('database')->lock('admin-insight:generate', 60);
        if (! $lock->get()) {
            throw new AnalysisFailure('GENERATION_IN_PROGRESS', 409);
        }

        try {
            if ($current = $this->current($initialSnapshot)) {
                return [$current, false];
            }

            $provider = app(BusinessAnalysisService::class)->provider();
            if (! $provider->enabled()) {
                throw new AnalysisFailure('PROVIDER_UNAVAILABLE', 503);
            }

            try {
                $raw = $provider->admin($initialSnapshot);
                $validated = AdminInsightResult::fromJson($raw);
            } catch (AnalysisFailure $failure) {
                throw $failure;
            } catch (Throwable) {
                throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
            }

            abort_unless($admin->fresh()?->hasAdminAccess(), 403, 'Unauthorized. Admin access required.');
            $latestSnapshot = $this->snapshot();
            $latestFingerprint = $this->fingerprint($latestSnapshot);
            if (! hash_equals($initialFingerprint, $latestFingerprint)) {
                throw new AnalysisFailure('SOURCE_CHANGED', 409);
            }

            try {
                return $this->persist($validated, $latestSnapshot);
            } catch (UniqueConstraintViolationException) {
                $current = $this->current($latestSnapshot);
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
     * Persist a new versioned AdminInsight record immutably.
     *
     * @return array{0: AdminInsight, 1: bool} [Insight instance, wasCreated boolean]
     */
    public function persist(AdminInsightResult $result, ?array $snapshot = null): array
    {
        $snap = $snapshot ?? $this->snapshot();
        $fingerprint = $this->fingerprint($snap);

        return DB::transaction(function () use ($snap, $fingerprint, $result) {
            $current = AdminInsight::where('source_fingerprint', $fingerprint)->first();

            if ($current !== null) {
                return [$current, false];
            }

            $latestVersion = AdminInsight::lockForUpdate()->max('version');

            $insight = new AdminInsight;
            $insight->forceFill([
                'version' => ($latestVersion ?? 0) + 1,
                'source_schema_version' => $snap['source_schema_version'] ?? self::SOURCE_SCHEMA_VERSION,
                'output_contract_version' => self::OUTPUT_CONTRACT_VERSION,
                'source_snapshot' => $snap,
                'source_fingerprint' => $fingerprint,
                'summary' => $result->summary,
                'governance_observations' => $result->governanceObservations,
                'operational_highlights' => $result->operationalHighlights,
                'attention_areas' => $result->attentionAreas,
                'suggested_review_points' => $result->suggestedReviewPoints,
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
