<?php

namespace App\Services\Financial;

use App\Enums\FinancialVerificationStatus;
use App\Models\Deal;
use App\Models\DealMilestone;
use App\Models\FinancialReport;
use App\Models\User;

class DealFinancialSummaryService
{
    public function __construct(
        protected FinancialReportService $reportService
    ) {}

    /**
     * Get the consolidated financial overview for a deal combining agreed terms,
     * milestone funding progress, and operational periodic financial reports.
     *
     * @return array<string, mixed>
     */
    public function getDealFinancialOverview(Deal $deal, User $user, ?string $roleParam = null): array
    {
        // Enforces strict participant / stage gating:
        // Investor counterparty is allowed ONLY in MilestoneFundingActive or Completed stages.
        // Professionals are denied.
        $this->reportService->assertDealAccess($deal, $user, $roleParam);

        // 1. Agreed Investment Terms
        $agreement = $deal->agreement()->first();
        $proposal = $deal->proposals()->where('status', 'accepted')->latest('version')->first();

        $investmentType = $proposal?->investment_type
            ?? $agreement?->terms_snapshot['investment_type']
            ?? 'micro';

        $totalCommitted = 0.00;
        if ($agreement && isset($agreement->terms_snapshot['amount']) && $agreement->terms_snapshot['amount'] !== null) {
            $totalCommitted = (float) $agreement->terms_snapshot['amount'];
        } elseif ($proposal && $proposal->amount !== null) {
            $totalCommitted = (float) $proposal->amount;
        }

        $equityPct = $proposal?->equity_percentage ?? $agreement?->terms_snapshot['equity_percentage'] ?? null;
        $profitSharingPct = $proposal?->profit_sharing_percentage ?? $agreement?->terms_snapshot['profit_sharing_percentage'] ?? null;

        $agreedTerms = [
            'investment_type' => $investmentType,
            'committed_amount_bdt' => round($totalCommitted, 2),
            'equity_percentage' => $equityPct !== null ? (float) $equityPct : null,
            'profit_sharing_percentage' => $profitSharingPct !== null ? (float) $profitSharingPct : null,
            'loss_sharing_terms' => $proposal?->loss_sharing_terms ?? $agreement?->terms_snapshot['loss_sharing_terms'] ?? null,
        ];

        // 2. Milestone Funding Progress (Derived from existing DealMilestone statuses)
        $milestones = $deal->milestones()->get();
        $totalReleased = 0.00;
        $fundedCount = 0;
        $pendingCount = 0;

        foreach ($milestones as $milestone) {
            $targetAmount = (float) $milestone->target_amount;

            if ($milestone->status === 'funded') {
                $totalReleased += $targetAmount;
                $fundedCount++;
            } else {
                $pendingCount++;
            }
        }

        $remainingLocked = max(0.00, $totalCommitted - $totalReleased);
        $fundingProgressPct = $totalCommitted > 0
            ? min(100.00, max(0.00, round(($totalReleased / $totalCommitted) * 100, 2)))
            : 0.00;

        $milestoneFunding = [
            'currency' => 'BDT',
            'total_committed_bdt' => round($totalCommitted, 2),
            'total_released_bdt' => round($totalReleased, 2),
            'remaining_locked_bdt' => round($remainingLocked, 2),
            'funding_progress_percentage' => $fundingProgressPct,
            'funded_milestones_count' => $fundedCount,
            'pending_tranches_count' => $pendingCount,
        ];

        // 3. Operational Periodic Financial Reporting Aggregates
        $reports = FinancialReport::query()
            ->where('deal_id', $deal->id)
            ->withCount(['evidences', 'discrepancies'])
            ->orderBy('reporting_period_start', 'asc')
            ->get();

        $cumulativeRevenue = 0.00;
        $cumulativeExpenses = 0.00;
        $cumulativeNetProfit = 0.00;
        $statusCounts = [
            'self_reported' => 0,
            'evidence_submitted' => 0,
            'under_review' => 0,
            'verified' => 0,
        ];
        $totalEvidences = 0;
        $totalDiscrepancies = 0;

        foreach ($reports as $report) {
            $cumulativeRevenue += (float) $report->revenue;
            $cumulativeExpenses += (float) $report->expenses;
            $cumulativeNetProfit += (float) $report->net_profit_loss;

            $statusKey = $report->status instanceof FinancialVerificationStatus
                ? $report->status->value
                : (string) $report->status;

            if (isset($statusCounts[$statusKey])) {
                $statusCounts[$statusKey]++;
            }

            $totalEvidences += $report->evidences_count;
            $totalDiscrepancies += $report->discrepancies_count;
        }

        $latestReport = $reports->last();

        $operationalPerformance = [
            'currency' => 'BDT',
            'reports_count' => $reports->count(),
            'cumulative_revenue_bdt' => round($cumulativeRevenue, 2),
            'cumulative_expenses_bdt' => round($cumulativeExpenses, 2),
            'cumulative_net_profit_loss_bdt' => round($cumulativeNetProfit, 2),
            'latest_cash_position_bdt' => $latestReport?->cash_position !== null ? (float) $latestReport->cash_position : null,
            'verification_breakdown' => $statusCounts,
            'total_evidence_files_count' => $totalEvidences,
            'total_discrepancies_count' => $totalDiscrepancies,
        ];

        // 4. Historical Reporting Periods Summary List
        $historicalPeriods = $reports->map(fn (FinancialReport $r) => [
            'id' => $r->id,
            'reporting_period_start' => $r->reporting_period_start?->toDateString(),
            'reporting_period_end' => $r->reporting_period_end?->toDateString(),
            'revenue' => (float) $r->revenue,
            'expenses' => (float) $r->expenses,
            'net_profit_loss' => (float) $r->net_profit_loss,
            'cash_position' => $r->cash_position !== null ? (float) $r->cash_position : null,
            'status' => $r->status->value,
            'evidence_count' => $r->evidences_count,
            'discrepancy_count' => $r->discrepancies_count,
            'created_at' => $r->created_at?->toIso8601String(),
        ])->values()->all();

        return [
            'deal_id' => $deal->id,
            'business_id' => $deal->business_id,
            'deal_stage' => $deal->stage->value,
            'agreed_terms' => $agreedTerms,
            'milestone_funding' => $milestoneFunding,
            'operational_performance' => $operationalPerformance,
            'historical_periods' => $historicalPeriods,
            'simulation_disclaimer' => 'All figures are simulated in Bangladeshi Taka (BDT / ৳) for prototype purposes.',
        ];
    }
}
