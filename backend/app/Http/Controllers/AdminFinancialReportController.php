<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\FinancialDiscrepancyReport;
use App\Models\FinancialReport;
use App\Models\FinancialReportEvidence;
use App\Services\Financial\AdminFinancialGovernanceService;
use App\Services\Financial\AdminFinancialReportService;
use App\Services\Financial\FinancialReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminFinancialReportController extends Controller
{
    /**
     * Retrieve platform-wide financial governance metrics.
     */
    public function governanceOverview(
        Request $request,
        AdminFinancialGovernanceService $governanceService
    ): JsonResponse {
        $user = $request->user();
        $metrics = $governanceService->getGovernanceOverview($user);

        return ApiResponse::success($metrics, 'Financial governance metrics retrieved successfully.');
    }

    /**
     * List all financial reports with administrative filters.
     */
    public function index(Request $request, AdminFinancialReportService $service): JsonResponse
    {
        $user = $request->user();

        $paginator = $service->listReports($user, $request->only([
            'status',
            'deal_id',
            'business_id',
            'per_page',
        ]));

        return ApiResponse::success([
            'reports' => collect($paginator->items())->map(fn (FinancialReport $r) => [
                'id' => $r->id,
                'deal_id' => $r->deal_id,
                'business_id' => $r->business_id,
                'business_name' => $r->business?->name,
                'submitted_by' => [
                    'id' => $r->submittedByUser?->id,
                    'name' => $r->submittedByUser?->name,
                ],
                'reporting_period_start' => $r->reporting_period_start?->toDateString(),
                'reporting_period_end' => $r->reporting_period_end?->toDateString(),
                'revenue' => (float) $r->revenue,
                'expenses' => (float) $r->expenses,
                'net_profit_loss' => (float) $r->net_profit_loss,
                'cash_position' => $r->cash_position !== null ? (float) $r->cash_position : null,
                'status' => $r->status->value,
                'status_label' => $r->status->label(),
                'evidence_count' => $r->evidences_count ?? $r->evidences->count(),
                'discrepancy_count' => $r->discrepancies_count ?? $r->discrepancies->count(),
                'reviewed_at' => $r->reviewed_at?->toIso8601String(),
                'reviewed_by' => $r->reviewedByUser ? [
                    'id' => $r->reviewedByUser->id,
                    'name' => $r->reviewedByUser->name,
                ] : null,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Financial reports retrieved successfully.');
    }

    /**
     * Retrieve full details of a financial report for admin review.
     */
    public function show(Request $request, string $report, AdminFinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $report = $service->getReport($reportModel, $user);

        return ApiResponse::success([
            'id' => $report->id,
            'deal_id' => $report->deal_id,
            'business' => [
                'id' => $report->business?->id,
                'name' => $report->business?->name,
            ],
            'deal' => [
                'id' => $report->deal?->id,
                'stage' => $report->deal?->stage->value,
                'founder' => [
                    'id' => $report->deal?->founderUser?->id,
                    'name' => $report->deal?->founderUser?->name,
                ],
                'counterparty' => [
                    'id' => $report->deal?->counterpartyUser?->id,
                    'name' => $report->deal?->counterpartyUser?->name,
                    'role' => $report->deal?->counterparty_role->value,
                ],
            ],
            'submitted_by' => [
                'id' => $report->submittedByUser?->id,
                'name' => $report->submittedByUser?->name,
            ],
            'reporting_period_start' => $report->reporting_period_start?->toDateString(),
            'reporting_period_end' => $report->reporting_period_end?->toDateString(),
            'revenue' => (float) $report->revenue,
            'expenses' => (float) $report->expenses,
            'net_profit_loss' => (float) $report->net_profit_loss,
            'cash_position' => $report->cash_position !== null ? (float) $report->cash_position : null,
            'notes' => $report->notes,
            'status' => $report->status->value,
            'status_label' => $report->status->label(),
            'reviewed_at' => $report->reviewed_at?->toIso8601String(),
            'reviewed_by' => $report->reviewedByUser ? [
                'id' => $report->reviewedByUser->id,
                'name' => $report->reviewedByUser->name,
            ] : null,
            'admin_review_notes' => $report->admin_review_notes,
            'evidences' => $report->evidences->map(fn ($e) => [
                'id' => $e->id,
                'original_filename' => $e->original_filename,
                'file_size' => $e->file_size,
                'mime_type' => $e->mime_type,
                'evidence_type' => $e->evidence_type,
                'uploaded_by' => [
                    'id' => $e->uploadedByUser?->id,
                    'name' => $e->uploadedByUser?->name,
                ],
                'created_at' => $e->created_at?->toIso8601String(),
            ])->all(),
            'discrepancies' => $report->discrepancies->map(fn ($d) => [
                'id' => $d->id,
                'reason' => $d->reason,
                'status' => $d->status->value,
                'admin_resolution_notes' => $d->admin_resolution_notes,
                'reported_by' => [
                    'id' => $d->reportedByUser?->id,
                    'name' => $d->reportedByUser?->name,
                ],
                'resolved_by' => $d->resolvedByUser ? [
                    'id' => $d->resolvedByUser->id,
                    'name' => $d->resolvedByUser->name,
                ] : null,
                'resolved_at' => $d->resolved_at?->toIso8601String(),
                'created_at' => $d->created_at?->toIso8601String(),
            ])->all(),
            'audit_logs' => $report->auditLogs->map(fn ($log) => [
                'id' => $log->id,
                'actor_role' => $log->actor_role,
                'action' => $log->action,
                'old_state' => $log->old_state,
                'new_state' => $log->new_state,
                'created_at' => $log->created_at?->toIso8601String(),
                'actor' => [
                    'id' => $log->actorUser?->id,
                    'name' => $log->actorUser?->name,
                ],
            ])->all(),
        ], 'Financial report details retrieved successfully.');
    }

    /**
     * Admin review and status update (e.g. verify report).
     */
    public function review(Request $request, string $report, AdminFinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:verified,under_review'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $report = $service->reviewReport(
            $reportModel,
            $user,
            $validated['status'],
            $validated['notes'] ?? null,
            $request->ip()
        );

        return ApiResponse::success([
            'id' => $report->id,
            'status' => $report->status->value,
            'status_label' => $report->status->label(),
            'reviewed_at' => $report->reviewed_at?->toIso8601String(),
            'admin_review_notes' => $report->admin_review_notes,
        ], 'Financial report review updated successfully.');
    }

    /**
     * Admin resolve discrepancy.
     */
    public function resolveDiscrepancy(
        Request $request,
        string $discrepancy,
        AdminFinancialReportService $service
    ): JsonResponse {
        $discrepancyModel = FinancialDiscrepancyReport::findOrFail($discrepancy);
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:resolved,disputed,under_review'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $resolved = $service->resolveDiscrepancy(
            $discrepancyModel,
            $user,
            $validated['status'],
            $validated['notes'] ?? null,
            $request->ip()
        );

        return ApiResponse::success([
            'id' => $resolved->id,
            'financial_report_id' => $resolved->financial_report_id,
            'status' => $resolved->status->value,
            'admin_resolution_notes' => $resolved->admin_resolution_notes,
            'resolved_at' => $resolved->resolved_at?->toIso8601String(),
        ], 'Financial discrepancy resolved successfully.');
    }

    /**
     * Admin download evidence.
     */
    public function downloadEvidence(
        Request $request,
        string $report,
        string $evidence,
        FinancialReportService $service
    ): StreamedResponse {
        $reportModel = FinancialReport::findOrFail($report);
        $evidenceModel = FinancialReportEvidence::where('financial_report_id', $reportModel->id)->findOrFail($evidence);
        $user = $request->user();

        $result = $service->downloadEvidence($evidenceModel, $user, $request->ip());

        return response()->stream(function () use ($result) {
            echo $result['content'];
        }, 200, [
            'Content-Type' => $result['mime_type'],
            'Content-Disposition' => 'inline; filename="'.$result['filename'].'"',
            'Content-Length' => $result['size'],
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * Admin view audit logs.
     */
    public function auditLogs(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $logs = $service->getAuditLogs($reportModel, $user);

        return ApiResponse::success([
            'financial_report_id' => $reportModel->id,
            'audit_logs' => $logs->map(fn ($log) => [
                'id' => $log->id,
                'actor_role' => $log->actor_role,
                'action' => $log->action,
                'old_state' => $log->old_state,
                'new_state' => $log->new_state,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
                'actor' => [
                    'id' => $log->actorUser?->id,
                    'name' => $log->actorUser?->name,
                ],
            ])->all(),
        ], 'Audit logs retrieved successfully.');
    }
}
