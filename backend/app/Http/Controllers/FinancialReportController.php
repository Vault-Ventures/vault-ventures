<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Models\FinancialReport;
use App\Models\FinancialReportEvidence;
use App\Services\Financial\DealFinancialSummaryService;
use App\Services\Financial\FinancialReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancialReportController extends Controller
{
    private function participantRole(Request $request): ?string
    {
        $data = $request->validate(['role' => ['sometimes', 'nullable', 'string']]);
        return $data['role'] ?? null;
    }

    /**
     * Retrieve the consolidated financial overview for a deal combining agreed terms,
     * milestone funding progress, and periodic operational reports.
     */
    public function financialOverview(
        Request $request,
        string $deal,
        DealFinancialSummaryService $summaryService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $this->participantRole($request);

        $overview = $summaryService->getDealFinancialOverview(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success($overview, 'Deal financial overview retrieved successfully.');
    }

    /**
     * List all financial reports for a deal.
     */
    public function index(Request $request, string $deal, FinancialReportService $service): JsonResponse
    {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();

        $reports = $service->getDealReports($dealModel, $user, $this->participantRole($request));

        return ApiResponse::success([
            'deal_id' => $dealModel->id,
            'reports' => $reports->map(fn (FinancialReport $r) => $this->formatReport($r))->all(),
        ], 'Financial reports retrieved successfully.');
    }

    /**
     * Store a new financial report for a deal (Founder only).
     */
    public function store(Request $request, string $deal, FinancialReportService $service): JsonResponse
    {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();

        $validated = $request->validate([
            'reporting_period_start' => ['required', 'date_format:Y-m-d'],
            'reporting_period_end' => ['required', 'date_format:Y-m-d'],
            'revenue' => ['required', 'numeric', 'min:0'],
            'expenses' => ['required', 'numeric', 'min:0'],
            'cash_position' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $report = $service->createReport($dealModel, $user, $validated, $request->ip());

        return ApiResponse::success(
            $this->formatReport($report),
            'Financial report submitted successfully.',
            201
        );
    }

    /**
     * Retrieve a specific financial report.
     */
    public function show(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $report = $service->getReport($reportModel, $user, $this->participantRole($request));

        return ApiResponse::success(
            $this->formatReport($report, true),
            'Financial report retrieved successfully.'
        );
    }

    /**
     * Upload supporting evidence file to a report (Founder only).
     */
    public function uploadEvidence(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'evidence_type' => ['nullable', 'string', 'max:64'],
        ]);

        $evidence = $service->uploadEvidence(
            $reportModel,
            $user,
            $request->file('file'),
            $request->input('evidence_type'),
            $request->ip()
        );

        return ApiResponse::success([
            'id' => $evidence->id,
            'original_filename' => $evidence->original_filename,
            'file_size' => $evidence->file_size,
            'mime_type' => $evidence->mime_type,
            'evidence_type' => $evidence->evidence_type,
            'created_at' => $evidence->created_at?->toIso8601String(),
        ], 'Financial evidence uploaded successfully.', 201);
    }

    /**
     * Download / stream decrypted supporting evidence.
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

        $result = $service->downloadEvidence($evidenceModel, $user, $request->ip(), $this->participantRole($request));

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
     * Flag a discrepancy against a financial report (Investor only).
     */
    public function flagDiscrepancy(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:5000'],
        ]);

        $discrepancy = $service->flagDiscrepancy($reportModel, $user, $validated['reason'], $request->ip(), $this->participantRole($request));

        return ApiResponse::success([
            'id' => $discrepancy->id,
            'financial_report_id' => $discrepancy->financial_report_id,
            'deal_id' => $discrepancy->deal_id,
            'reason' => $discrepancy->reason,
            'status' => $discrepancy->status->value,
            'created_at' => $discrepancy->created_at?->toIso8601String(),
        ], 'Financial discrepancy flagged successfully.', 201);
    }

    /**
     * List discrepancies for a financial report.
     */
    public function discrepancies(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $discrepancies = $service->getDiscrepancies($reportModel, $user, $this->participantRole($request));

        return ApiResponse::success([
            'financial_report_id' => $reportModel->id,
            'discrepancies' => $discrepancies->map(fn ($d) => [
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
        ], 'Discrepancies retrieved successfully.');
    }

    /**
     * List audit logs for a financial report.
     */
    public function auditLogs(Request $request, string $report, FinancialReportService $service): JsonResponse
    {
        $reportModel = FinancialReport::findOrFail($report);
        $user = $request->user();

        $logs = $service->getAuditLogs($reportModel, $user, $this->participantRole($request));

        return ApiResponse::success([
            'financial_report_id' => $reportModel->id,
            'audit_logs' => $logs->map(fn ($log) => [
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
        ], 'Audit logs retrieved successfully.');
    }

    /**
     * Format financial report for API responses.
     */
    protected function formatReport(FinancialReport $report, bool $detailed = false): array
    {
        $formatted = [
            'id' => $report->id,
            'deal_id' => $report->deal_id,
            'business_id' => $report->business_id,
            'submitted_by_user_id' => $report->submitted_by_user_id,
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
            'admin_review_notes' => $report->admin_review_notes,
            'evidence_count' => $report->evidences->count(),
            'discrepancy_count' => $report->discrepancies->count(),
            'created_at' => $report->created_at?->toIso8601String(),
        ];

        if ($detailed) {
            $formatted['evidences'] = $report->evidences->map(fn ($e) => [
                'id' => $e->id,
                'original_filename' => $e->original_filename,
                'file_size' => $e->file_size,
                'mime_type' => $e->mime_type,
                'evidence_type' => $e->evidence_type,
                'created_at' => $e->created_at?->toIso8601String(),
            ])->all();

            $formatted['discrepancies'] = $report->discrepancies->map(fn ($d) => [
                'id' => $d->id,
                'reason' => $d->reason,
                'status' => $d->status->value,
                'admin_resolution_notes' => $d->admin_resolution_notes,
                'reported_by_user_id' => $d->reported_by_user_id,
                'resolved_at' => $d->resolved_at?->toIso8601String(),
                'created_at' => $d->created_at?->toIso8601String(),
            ])->all();
        }

        return $formatted;
    }
}
