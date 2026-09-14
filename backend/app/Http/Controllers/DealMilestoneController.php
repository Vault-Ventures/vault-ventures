<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Models\DealMilestone;
use App\Services\Deal\DealMilestoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DealMilestoneController extends Controller
{
    /**
     * List all milestones and funding summary for a deal.
     */
    public function index(
        Request $request,
        string $deal,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $result = $service->getMilestones(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success([
            'deal_id' => $result['deal_id'],
            'summary' => $result['summary'],
            'milestones' => $result['milestones']->map(fn (DealMilestone $m) => $this->formatMilestoneResponse($m))->all(),
        ], 'Milestones retrieved successfully.');
    }

    /**
     * Retrieve the funding simulation summary for a deal.
     */
    public function fundingSummary(
        Request $request,
        string $deal,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $summary = $service->getFundingSummary(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success($summary, 'Funding summary retrieved successfully.');
    }

    /**
     * Define / create a new milestone.
     */
    public function store(
        Request $request,
        string $deal,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $milestone = $service->createMilestone(
            $dealModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($milestone),
            'Milestone created successfully.',
            201
        );
    }

    /**
     * Update milestone details.
     */
    public function update(
        Request $request,
        string $deal,
        string $milestone,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $milestoneModel = DealMilestone::findOrFail($milestone);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->updateMilestone(
            $dealModel,
            $milestoneModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($updated),
            'Milestone updated successfully.'
        );
    }

    /**
     * Update milestone progress percentage (Founder only).
     */
    public function progress(
        Request $request,
        string $deal,
        string $milestone,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $milestoneModel = DealMilestone::findOrFail($milestone);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->updateProgress(
            $dealModel,
            $milestoneModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($updated),
            'Milestone progress updated successfully.'
        );
    }

    /**
     * Submit milestone completion with evidence (Founder only).
     */
    public function submit(
        Request $request,
        string $deal,
        string $milestone,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $milestoneModel = DealMilestone::findOrFail($milestone);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->submitMilestone(
            $dealModel,
            $milestoneModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($updated),
            'Milestone submitted for verification successfully.'
        );
    }

    /**
     * Confirm milestone completion and trigger simulated tranche release (Counterparty only).
     */
    public function confirm(
        Request $request,
        string $deal,
        string $milestone,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $milestoneModel = DealMilestone::findOrFail($milestone);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->confirmMilestone(
            $dealModel,
            $milestoneModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($updated),
            'Milestone confirmed and funding tranche simulated successfully.'
        );
    }

    /**
     * Dispute milestone submission and request revision (Counterparty only).
     */
    public function dispute(
        Request $request,
        string $deal,
        string $milestone,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $milestoneModel = DealMilestone::findOrFail($milestone);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updated = $service->disputeMilestone(
            $dealModel,
            $milestoneModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatMilestoneResponse($updated),
            'Milestone returned for revision successfully.'
        );
    }

    /**
     * Activate milestones and transition Deal stage to milestone_funding_active.
     */
    public function activateMilestones(
        Request $request,
        string $deal,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updatedDeal = $service->activateMilestones(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success([
            'id' => $updatedDeal->id,
            'stage' => $updatedDeal->stage->value,
            'stage_label' => $updatedDeal->stage->label(),
        ], 'Milestone funding activated successfully.');
    }

    /**
     * Explicitly complete the Deal once all milestones are funded.
     */
    public function complete(
        Request $request,
        string $deal,
        DealMilestoneService $service
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updatedDeal = $service->completeDeal(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success([
            'id' => $updatedDeal->id,
            'stage' => $updatedDeal->stage->value,
            'stage_label' => $updatedDeal->stage->label(),
        ], 'Deal completed successfully.');
    }

    /**
     * Format deterministic milestone response.
     */
    private function formatMilestoneResponse(DealMilestone $milestone): array
    {
        return [
            'id' => $milestone->id,
            'deal_id' => $milestone->deal_id,
            'agreement_id' => $milestone->agreement_id,
            'sequence_order' => $milestone->sequence_order,
            'title' => $milestone->title,
            'description' => $milestone->description,
            'target_amount' => (float) $milestone->target_amount,
            'currency' => 'BDT',
            'target_date' => $milestone->target_date?->format('Y-m-d'),
            'status' => $milestone->status,
            'progress_percentage' => $milestone->progress_percentage,
            'evidence_notes' => $milestone->evidence_notes,
            'evidence_urls' => $milestone->evidence_urls,
            'submitted_at' => $milestone->submitted_at?->toISOString(),
            'submitted_by_user_id' => $milestone->submitted_by_user_id,
            'confirmed_at' => $milestone->confirmed_at?->toISOString(),
            'confirmed_by_user_id' => $milestone->confirmed_by_user_id,
            'confirmation_notes' => $milestone->confirmation_notes,
            'funded_at' => $milestone->funded_at?->toISOString(),
            'dispute_reason' => $milestone->dispute_reason,
            'created_at' => $milestone->created_at?->toISOString(),
            'updated_at' => $milestone->updated_at?->toISOString(),
        ];
    }
}
