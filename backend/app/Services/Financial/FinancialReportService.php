<?php

namespace App\Services\Financial;

use App\Enums\DealStage;
use App\Enums\FinancialDiscrepancyStatus;
use App\Enums\FinancialVerificationStatus;
use App\Enums\ParticipantRole;
use App\Models\Deal;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialEvidenceAccessLog;
use App\Models\FinancialReport;
use App\Models\FinancialReportAuditLog;
use App\Models\FinancialReportEvidence;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class FinancialReportService
{
    public function __construct(
        protected FinancialEvidenceStorage $evidenceStorage
    ) {}

    /**
     * Assert deal access and return contextual role ('founder', 'investor', or 'admin').
     *
     * @throws HttpException
     */
    public function assertDealAccess(Deal $deal, User $user, ?string $explicitRole = null, bool $forManagement = false): string
    {
        if ($user->hasAdminAccess()) {
            if ($forManagement) {
                abort(403, 'Admin cannot manage founder financial report submissions.');
            }

            return 'admin';
        }

        app(\App\Services\Deal\DealAccessService::class)->participant($deal, $user, $explicitRole);

        // Check if user is Founder participant
        if ($deal->founder_user_id === $user->id) {
            return 'founder';
        }

        // If action is management (create/edit report, upload evidence), only Founder can do it
        if ($forManagement) {
            abort(403, 'Only the deal founder can manage financial reports.');
        }

        // Check if user is Counterparty
        if ($deal->counterparty_user_id === $user->id) {
            // Professionals must NEVER receive Investor financial-report access
            if ($deal->counterparty_role === ParticipantRole::Professional) {
                abort(403, 'Professionals are not permitted to access financial reports.');
            }

            // Investor access is allowed ONLY when deal stage is MilestoneFundingActive or Completed
            if ($deal->counterparty_role === ParticipantRole::Investor) {
                $allowedStages = [
                    DealStage::MilestoneFundingActive,
                    DealStage::Completed,
                ];

                if (! in_array($deal->stage, $allowedStages, true)) {
                    abort(403, 'Investor financial report access requires MilestoneFundingActive or Completed deal stage.');
                }

                return 'investor';
            }
        }

        abort(403, 'You are not authorized to access financial reports for this deal.');
    }

    /**
     * Assert report access.
     */
    public function assertReportAccess(FinancialReport $report, User $user, ?string $explicitRole = null, bool $forManagement = false): string
    {
        return $this->assertDealAccess($report->deal, $user, $explicitRole, $forManagement);
    }

    /**
     * Validate reporting period start and end dates.
     */
    public function validateReportingPeriod(Deal $deal, string $start, string $end, ?int $ignoreReportId = null): void
    {
        if ($start > $end) {
            throw ValidationException::withMessages([
                'reporting_period_start' => ['The reporting period start date must be before or equal to the end date.'],
            ]);
        }

        $overlapExists = FinancialReport::query()
            ->where('deal_id', $deal->id)
            ->when($ignoreReportId, fn ($q) => $q->where('id', '!=', $ignoreReportId))
            ->where('reporting_period_start', '<=', $end)
            ->where('reporting_period_end', '>=', $start)
            ->exists();

        if ($overlapExists) {
            throw ValidationException::withMessages([
                'reporting_period' => ['Reporting period overlaps with an existing financial report for this deal.'],
            ]);
        }
    }

    /**
     * Create a new deal-scoped financial report.
     */
    public function createReport(Deal $deal, User $user, array $data, ?string $ip = null): FinancialReport
    {
        $role = $this->assertDealAccess($deal, $user, null, true);

        $start = $data['reporting_period_start'] ?? null;
        $end = $data['reporting_period_end'] ?? null;

        if (! $start || ! $end) {
            throw ValidationException::withMessages([
                'reporting_period' => ['Reporting period start and end dates are required.'],
            ]);
        }

        $this->validateReportingPeriod($deal, $start, $end);

        $revenue = round((float) ($data['revenue'] ?? 0), 2);
        $expenses = round((float) ($data['expenses'] ?? 0), 2);
        $netProfitLoss = round($revenue - $expenses, 2);
        $cashPosition = isset($data['cash_position']) && $data['cash_position'] !== null && $data['cash_position'] !== ''
            ? round((float) $data['cash_position'], 2)
            : null;

        return DB::transaction(function () use ($deal, $user, $role, $start, $end, $revenue, $expenses, $netProfitLoss, $cashPosition, $data, $ip) {
            $report = FinancialReport::create([
                'deal_id' => $deal->id,
                'business_id' => $deal->business_id,
                'submitted_by_user_id' => $user->id,
                'reporting_period_start' => $start,
                'reporting_period_end' => $end,
                'revenue' => $revenue,
                'expenses' => $expenses,
                'net_profit_loss' => $netProfitLoss,
                'cash_position' => $cashPosition,
                'notes' => $data['notes'] ?? null,
                'status' => FinancialVerificationStatus::SelfReported,
            ]);

            $this->logAudit(
                $report,
                $user,
                $role,
                'report_created',
                null,
                [
                    'revenue' => $report->revenue,
                    'expenses' => $report->expenses,
                    'net_profit_loss' => $report->net_profit_loss,
                    'cash_position' => $report->cash_position,
                    'status' => $report->status->value,
                    'reporting_period_start' => $report->reporting_period_start?->toDateString(),
                    'reporting_period_end' => $report->reporting_period_end?->toDateString(),
                ],
                $ip
            );

            return $report;
        });
    }

    /**
     * List all financial reports for a deal.
     */
    public function getDealReports(Deal $deal, User $user, ?string $explicitRole = null): Collection
    {
        $this->assertDealAccess($deal, $user, $explicitRole);

        return FinancialReport::query()
            ->where('deal_id', $deal->id)
            ->with(['evidences', 'discrepancies'])
            ->orderBy('reporting_period_start', 'desc')
            ->get();
    }

    /**
     * Get a specific financial report.
     */
    public function getReport(FinancialReport $report, User $user, ?string $explicitRole = null): FinancialReport
    {
        $this->assertReportAccess($report, $user, $explicitRole);

        $report->load(['deal', 'business', 'submittedByUser', 'reviewedByUser', 'evidences', 'discrepancies.reportedByUser', 'discrepancies.resolvedByUser']);

        return $report;
    }

    /**
     * Upload supporting evidence file to a financial report.
     */
    public function uploadEvidence(
        FinancialReport $report,
        User $user,
        UploadedFile $file,
        ?string $evidenceType = 'other',
        ?string $ip = null
    ): FinancialReportEvidence {
        $role = $this->assertReportAccess($report, $user, null, true);

        if ($report->status === FinancialVerificationStatus::Verified) {
            throw ValidationException::withMessages([
                'evidence' => ['Cannot attach evidence to a verified financial report.'],
            ]);
        }

        if ($report->evidences()->count() >= FinancialEvidenceStorage::MAX_FILES_PER_REPORT) {
            throw ValidationException::withMessages([
                'evidence' => ['Maximum of 10 evidence files per financial report reached.'],
            ]);
        }

        $this->evidenceStorage->validateFile($file);

        $path = $this->evidenceStorage->newPath($report->deal_id);
        $this->evidenceStorage->put($path, $file);

        return DB::transaction(function () use ($report, $user, $role, $file, $path, $evidenceType, $ip) {
            $evidence = FinancialReportEvidence::create([
                'financial_report_id' => $report->id,
                'uploaded_by_user_id' => $user->id,
                'original_filename' => $file->getClientOriginalName(),
                'disk' => FinancialEvidenceStorage::DISK,
                'path' => $path,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'evidence_type' => $evidenceType ?: 'other',
            ]);

            $oldStatus = $report->status->value;
            if ($report->status === FinancialVerificationStatus::SelfReported) {
                $report->status = FinancialVerificationStatus::EvidenceSubmitted;
                $report->save();
            }

            $this->logAudit(
                $report,
                $user,
                $role,
                'evidence_uploaded',
                ['status' => $oldStatus],
                [
                    'evidence_id' => $evidence->id,
                    'filename' => $evidence->original_filename,
                    'status' => $report->status->value,
                ],
                $ip
            );

            return $evidence;
        });
    }

    /**
     * Download / stream decrypted evidence content.
     *
     * @return array{content: string, mime_type: string, filename: string, size: int}
     */
    public function downloadEvidence(FinancialReportEvidence $evidence, User $user, ?string $ip = null, ?string $explicitRole = null): array
    {
        $report = $evidence->financialReport;
        $role = $this->assertReportAccess($report, $user, $explicitRole);

        $content = $this->evidenceStorage->read($evidence);

        FinancialEvidenceAccessLog::create([
            'financial_report_evidence_id' => $evidence->id,
            'financial_report_id' => $report->id,
            'actor_user_id' => $user->id,
            'actor_role' => $role,
            'action' => 'downloaded',
            'ip_address' => $ip,
            'created_at' => now(),
        ]);

        return [
            'content' => $content,
            'mime_type' => $evidence->mime_type,
            'filename' => $evidence->original_filename,
            'size' => $evidence->file_size,
        ];
    }

    /**
     * Flag a discrepancy against a financial report (Investor only).
     */
    public function flagDiscrepancy(FinancialReport $report, User $user, string $reason, ?string $ip = null, ?string $explicitRole = null): FinancialDiscrepancyReport
    {
        $role = $this->assertReportAccess($report, $user, $explicitRole);

        if ($role !== 'investor') {
            abort(403, 'Only authorized investors can flag financial discrepancies.');
        }

        if (trim($reason) === '') {
            throw ValidationException::withMessages([
                'reason' => ['Discrepancy reason is required.'],
            ]);
        }

        return DB::transaction(function () use ($report, $user, $role, $reason, $ip) {
            $discrepancy = FinancialDiscrepancyReport::create([
                'deal_id' => $report->deal_id,
                'financial_report_id' => $report->id,
                'reported_by_user_id' => $user->id,
                'reason' => $reason,
                'status' => FinancialDiscrepancyStatus::UnderReview,
            ]);

            $oldStatus = $report->status->value;
            $report->status = FinancialVerificationStatus::UnderReview;
            $report->save();

            $this->logAudit(
                $report,
                $user,
                $role,
                'discrepancy_flagged',
                ['status' => $oldStatus],
                [
                    'discrepancy_id' => $discrepancy->id,
                    'reason' => $reason,
                    'status' => $report->status->value,
                ],
                $ip
            );

            return $discrepancy;
        });
    }

    /**
     * List discrepancies for a financial report.
     */
    public function getDiscrepancies(FinancialReport $report, User $user, ?string $explicitRole = null): Collection
    {
        $this->assertReportAccess($report, $user, $explicitRole);

        return $report->discrepancies()
            ->with(['reportedByUser', 'resolvedByUser'])
            ->get();
    }

    /**
     * List audit logs for a financial report.
     */
    public function getAuditLogs(FinancialReport $report, User $user, ?string $explicitRole = null): Collection
    {
        $this->assertReportAccess($report, $user, $explicitRole);

        return $report->auditLogs()
            ->with('actorUser')
            ->get();
    }

    /**
     * Record an audit log entry.
     */
    public function logAudit(
        FinancialReport $report,
        User $actor,
        ?string $role,
        string $action,
        ?array $oldState,
        ?array $newState,
        ?string $ip = null
    ): FinancialReportAuditLog {
        return FinancialReportAuditLog::create([
            'financial_report_id' => $report->id,
            'actor_user_id' => $actor->id,
            'actor_role' => $role,
            'action' => $action,
            'old_state' => $oldState,
            'new_state' => $newState,
            'ip_address' => $ip,
            'created_at' => now(),
        ]);
    }
}
