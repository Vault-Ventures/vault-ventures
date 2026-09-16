<?php

namespace App\Services\Financial;

use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminFinancialReportService
{
    public function __construct(
        protected FinancialReportService $reportService
    ) {}

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
     * List financial reports with administrative filters and pagination.
     */
    public function listReports(User $admin, array $filters = []): LengthAwarePaginator
    {
        $this->assertAdmin($admin);

        $query = FinancialReport::query()
            ->with(['deal', 'business', 'submittedByUser', 'reviewedByUser'])
            ->withCount(['evidences', 'discrepancies']);

        if (! empty($filters['status'])) {
            $statusEnum = FinancialVerificationStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $query->where('status', $statusEnum);
            }
        }

        if (! empty($filters['deal_id'])) {
            $query->where('deal_id', $filters['deal_id']);
        }

        if (! empty($filters['business_id'])) {
            $query->where('business_id', $filters['business_id']);
        }

        return $query->orderBy('id', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get detailed administrative view of a financial report.
     */
    public function getReport(FinancialReport $report, User $admin): FinancialReport
    {
        $this->assertAdmin($admin);

        $report->load([
            'deal.founderUser',
            'deal.counterpartyUser',
            'business',
            'submittedByUser',
            'reviewedByUser',
            'evidences.uploadedByUser',
            'discrepancies.reportedByUser',
            'discrepancies.resolvedByUser',
            'auditLogs.actorUser',
            'evidenceAccessLogs.actorUser',
        ]);

        return $report;
    }

    /**
     * Admin review and status update for a financial report.
     */
    public function reviewReport(
        FinancialReport $report,
        User $admin,
        string $targetStatus,
        ?string $notes = null,
        ?string $ip = null
    ): FinancialReport {
        $this->assertAdmin($admin);

        $statusEnum = FinancialVerificationStatus::tryFrom($targetStatus);
        if (! in_array($statusEnum, [FinancialVerificationStatus::Verified, FinancialVerificationStatus::UnderReview], true)) {
            throw ValidationException::withMessages([
                'status' => ['Target verification status must be either "verified" or "under_review".'],
            ]);
        }

        return DB::transaction(function () use ($report, $admin, $statusEnum, $notes, $ip) {
            $oldStatus = $report->status->value;

            $report->status = $statusEnum;
            $report->reviewed_by_user_id = $admin->id;
            $report->reviewed_at = now();
            $report->admin_review_notes = $notes;
            $report->save();

            $this->reportService->logAudit(
                $report,
                $admin,
                'admin',
                $statusEnum === FinancialVerificationStatus::Verified ? 'report_verified' : 'report_under_review',
                [
                    'status' => $oldStatus,
                    'reviewed_at' => null,
                ],
                [
                    'status' => $report->status->value,
                    'reviewed_at' => $report->reviewed_at?->toIso8601String(),
                    'admin_review_notes' => $notes,
                ],
                $ip
            );

            return $report;
        });
    }

    /**
     * Admin resolution of a flagged financial discrepancy.
     */
    public function resolveDiscrepancy(
        FinancialDiscrepancyReport $discrepancy,
        User $admin,
        string $resolutionStatus,
        ?string $notes = null,
        ?string $ip = null
    ): FinancialDiscrepancyReport {
        $this->assertAdmin($admin);

        $statusEnum = FinancialDiscrepancyStatus::tryFrom($resolutionStatus);
        if (! $statusEnum) {
            throw ValidationException::withMessages([
                'status' => ['Invalid discrepancy resolution status. Allowed values: under_review, resolved, disputed.'],
            ]);
        }

        return DB::transaction(function () use ($discrepancy, $admin, $statusEnum, $notes, $ip) {
            $report = $discrepancy->financialReport;
            $oldStatus = $discrepancy->status->value;

            $discrepancy->status = $statusEnum;
            $discrepancy->admin_resolution_notes = $notes;
            $discrepancy->resolved_by_user_id = $admin->id;
            $discrepancy->resolved_at = now();
            $discrepancy->save();

            $this->reportService->logAudit(
                $report,
                $admin,
                'admin',
                'discrepancy_resolved',
                [
                    'discrepancy_id' => $discrepancy->id,
                    'status' => $oldStatus,
                ],
                [
                    'discrepancy_id' => $discrepancy->id,
                    'status' => $discrepancy->status->value,
                    'admin_resolution_notes' => $notes,
                    'resolved_at' => $discrepancy->resolved_at?->toIso8601String(),
                ],
                $ip
            );

            return $discrepancy;
        });
    }
}
