<?php

namespace App\Services\Financial;

use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;

class AdminFinancialGovernanceService
{
    /**
     * Ensure user has admin privileges.
     */
    public function assertAdmin(User $user): void
    {
        if (! $user->hasAdminAccess()) {
            abort(403, 'Unauthorized. Admin access is required.');
        }
    }

    /**
     * Get platform-wide financial governance metrics.
     *
     * @return array<string, mixed>
     */
    public function getGovernanceOverview(User $admin): array
    {
        $this->assertAdmin($admin);

        // 1. Report counts by verification status
        $totalReports = FinancialReport::count();

        $selfReportedCount = FinancialReport::where('status', FinancialVerificationStatus::SelfReported)->count();
        $evidenceSubmittedCount = FinancialReport::where('status', FinancialVerificationStatus::EvidenceSubmitted)->count();
        $underReviewCount = FinancialReport::where('status', FinancialVerificationStatus::UnderReview)->count();
        $verifiedCount = FinancialReport::where('status', FinancialVerificationStatus::Verified)->count();

        // 2. Discrepancy queue metrics
        $totalDiscrepancies = FinancialDiscrepancyReport::count();
        $openDiscrepanciesCount = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::UnderReview)->count();
        $resolvedDiscrepanciesCount = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::Resolved)->count();
        $disputedDiscrepanciesCount = FinancialDiscrepancyReport::where('status', FinancialDiscrepancyStatus::Disputed)->count();

        // 3. Platform-wide financial reporting volume (BDT)
        $totalReportedRevenue = (float) FinancialReport::sum('revenue');
        $totalReportedExpenses = (float) FinancialReport::sum('expenses');
        $totalCalculatedProfitLoss = (float) FinancialReport::sum('net_profit_loss');

        // Compare only explicitly persisted periods; never fill gaps or extrapolate.
        $reportingPeriods = FinancialReport::query()
            ->select(['reporting_period_start', 'reporting_period_end'])
            ->selectRaw('COUNT(*) as reports_count, SUM(revenue) as period_revenue, SUM(expenses) as period_expenses, SUM(net_profit_loss) as period_net')
            ->groupBy('reporting_period_start', 'reporting_period_end')
            ->orderBy('reporting_period_start')->orderBy('reporting_period_end')->get()
            ->map(fn ($period) => [
                'start' => $period->reporting_period_start?->toDateString(),
                'end' => $period->reporting_period_end?->toDateString(),
                'reports_count' => (int) $period->reports_count,
                'revenue' => round((float) $period->period_revenue, 2),
                'expenses' => round((float) $period->period_expenses, 2),
                'net_profit_loss' => round((float) $period->period_net, 2),
            ])->all();

        // 4. Deal reporting activity
        $distinctDealsWithReports = FinancialReport::distinct('deal_id')->count('deal_id');
        $activeReportingDeals = FinancialReport::whereHas('deal', fn ($query) =>
            $query->where('stage', DealStage::MilestoneFundingActive)
        )->distinct()->count('deal_id');

        return [
            'reporting_periods' => $reportingPeriods,
            'overview' => [
                'total_financial_reports_count' => $totalReports,
                'total_deals_with_reporting' => $distinctDealsWithReports,
                'active_reporting_deals_count' => $activeReportingDeals,
                'total_discrepancies_count' => $totalDiscrepancies,
            ],
            'verification_pipeline' => [
                'self_reported_count' => $selfReportedCount,
                'evidence_submitted_count' => $evidenceSubmittedCount,
                'under_review_count' => $underReviewCount,
                'verified_count' => $verifiedCount,
            ],
            'discrepancy_queue' => [
                'pending_under_review_count' => $openDiscrepanciesCount,
                'resolved_count' => $resolvedDiscrepanciesCount,
                'disputed_count' => $disputedDiscrepanciesCount,
            ],
            'financial_totals_bdt' => [
                'currency' => 'BDT',
                'total_reported_revenue' => round($totalReportedRevenue, 2),
                'total_reported_expenses' => round($totalReportedExpenses, 2),
                'total_calculated_profit_loss' => round($totalCalculatedProfitLoss, 2),
            ],
            'disclaimer' => 'All figures are simulated in Bangladeshi Taka (BDT / ৳) for platform governance prototype purposes.',
        ];
    }

    /**
     * Identify and report any over-allocated deals across the platform for admin audit.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getOverAllocatedDeals(User $admin, \App\Services\Deal\DealMilestoneService $milestoneService): array
    {
        $this->assertAdmin($admin);

        $deals = \App\Models\Deal::with(['milestones', 'agreement'])->get();
        $overAllocated = [];

        foreach ($deals as $deal) {
            $summary = $milestoneService->calculateFundingSummary($deal);
            $committed = (float) $summary['total_committed_bdt'];
            $allocated = (float) $summary['total_allocated_bdt'];
            $released = (float) $summary['total_released_bdt'];

            if ($committed > 0 && ($allocated > $committed || $released > $committed)) {
                $overAllocated[] = [
                    'deal_id' => $deal->id,
                    'stage' => $deal->stage->value,
                    'committed_amount' => $committed,
                    'allocated_amount' => $allocated,
                    'released_amount' => $released,
                    'excess_amount' => max($allocated - $committed, $released - $committed),
                    'milestone_count' => $deal->milestones->count(),
                ];
            }
        }

        return $overAllocated;
    }
}
