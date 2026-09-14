<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\BusinessConnection;
use App\Models\Deal;
use App\Models\DealStateHistory;
use App\Services\Deal\DealService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DealController extends Controller
{
    /**
     * Create a Deal from an existing accepted BusinessConnection.
     */
    public function createFromConnection(
        Request $request,
        string $connection,
        DealService $dealService
    ): JsonResponse {
        $connectionModel = BusinessConnection::findOrFail($connection);
        $user = $request->user();

        $roleParam = $request->input('role') ?? $request->query('role');
        $deal = $dealService->createDealFromConnection(
            $connectionModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatDealResponse($deal),
            'Deal created successfully.',
            201
        );
    }

    /**
     * Get safe Deal Room information for an authorized participant.
     */
    public function show(
        Request $request,
        string $deal,
        DealService $dealService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();

        $roleParam = $request->input('role') ?? $request->query('role');
        $deal = $dealService->getDealRoom(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatDealResponse($deal),
            'Deal retrieved successfully.'
        );
    }

    /**
     * Get Deal lifecycle state history for an authorized participant.
     */
    public function history(
        Request $request,
        string $deal,
        DealService $dealService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();

        $roleParam = $request->input('role') ?? $request->query('role');
        $histories = $dealService->getDealHistory(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $histories->map(fn (DealStateHistory $history) => [
                'id' => $history->id,
                'deal_id' => $history->deal_id,
                'previous_state' => $history->previous_state?->value,
                'previous_state_label' => $history->previous_state?->label(),
                'new_state' => $history->new_state->value,
                'new_state_label' => $history->new_state->label(),
                'changed_by_user_id' => $history->changed_by_user_id,
                'changed_at' => $history->changed_at?->toISOString(),
                'created_at' => $history->created_at?->toISOString(),
            ])->all(),
            'Deal history retrieved successfully.'
        );
    }

    /**
     * Transition the Deal to the next valid lifecycle state.
     */
    public function transition(
        Request $request,
        string $deal,
        DealService $dealService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();

        $targetState = $request->input('target_state') ?? $request->input('state') ?? $request->query('target_state');
        $roleParam = $request->input('role') ?? $request->query('role');

        $deal = $dealService->transitionDeal(
            $dealModel,
            $user,
            is_string($targetState) ? $targetState : null,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatDealResponse($deal),
            'Deal transitioned successfully.'
        );
    }

    /**
     * Get negotiation proposals and active proposal for the Deal.
     */
    public function getNegotiation(
        Request $request,
        string $deal,
        \App\Services\Deal\DealNegotiationService $negotiationService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $result = $negotiationService->getNegotiation(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success([
            'deal_id' => $result['deal_id'],
            'active_proposal' => $result['active_proposal'] ? $this->formatProposalResponse($result['active_proposal']) : null,
            'proposals' => $result['proposals']->map(fn ($p) => $this->formatProposalResponse($p))->all(),
        ], 'Negotiation details retrieved successfully.');
    }

    /**
     * Submit an initial proposal or counter-offer.
     */
    public function proposeNegotiation(
        Request $request,
        string $deal,
        \App\Services\Deal\DealNegotiationService $negotiationService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $proposal = $negotiationService->proposeTerms(
            $dealModel,
            $user,
            $request->all(),
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatProposalResponse($proposal),
            'Proposal submitted successfully.',
            201
        );
    }

    /**
     * Respond to an existing pending proposal.
     */
    public function respondNegotiation(
        Request $request,
        string $deal,
        string $proposal,
        \App\Services\Deal\DealNegotiationService $negotiationService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $proposalModel = \App\Models\DealTermProposal::findOrFail($proposal);
        $user = $request->user();

        $action = $request->input('action') ?? 'accept';
        $counterData = $request->input('counter_terms') ?? $request->input('terms') ?? $request->all();
        $roleParam = $request->input('role') ?? $request->query('role');

        $updatedProposal = $negotiationService->respondToProposal(
            $dealModel,
            $proposalModel,
            $user,
            is_string($action) ? $action : 'accept',
            is_array($counterData) ? $counterData : [],
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatProposalResponse($updatedProposal),
            'Proposal response recorded successfully.'
        );
    }

    /**
     * Get agreement details for the Deal.
     */
    public function getAgreement(
        Request $request,
        string $deal,
        \App\Services\Deal\DealAgreementService $agreementService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $agreement = $agreementService->getAgreement(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $agreement ? $this->formatAgreementResponse($agreement) : null,
            'Agreement details retrieved successfully.'
        );
    }

    /**
     * Generate an agreement from the accepted negotiation proposal.
     */
    public function generateAgreement(
        Request $request,
        string $deal,
        \App\Services\Deal\DealAgreementService $agreementService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $agreement = $agreementService->generateAgreement(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatAgreementResponse($agreement),
            'Agreement generated successfully.',
            201
        );
    }

    /**
     * Sign / confirm the agreement on behalf of the participant.
     */
    public function signAgreement(
        Request $request,
        string $deal,
        \App\Services\Deal\DealAgreementService $agreementService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $agreement = $agreementService->signAgreement(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $this->formatAgreementResponse($agreement),
            'Agreement signed successfully.'
        );
    }

    /**
     * Format deterministic and safe Deal response.
     */
    private function formatDealResponse(Deal $deal): array
    {
        return [
            'id' => $deal->id,
            'connection_id' => $deal->connection_id,
            'business_id' => $deal->business_id,
            'founder_user_id' => $deal->founder_user_id,
            'counterparty_user_id' => $deal->counterparty_user_id,
            'counterparty_role' => $deal->counterparty_role->value,
            'stage' => $deal->stage->value,
            'stage_label' => $deal->stage->label(),
            'stage_order' => $deal->stage->order(),
            'created_at' => $deal->created_at?->toISOString(),
            'updated_at' => $deal->updated_at?->toISOString(),
        ];
    }

    /**
     * Format proposal response.
     */
    private function formatProposalResponse(\App\Models\DealTermProposal $proposal): array
    {
        return [
            'id' => $proposal->id,
            'deal_id' => $proposal->deal_id,
            'version' => $proposal->version,
            'proposed_by_user_id' => $proposal->proposed_by_user_id,
            'proposed_by_role' => $proposal->proposed_by_role,
            'investment_type' => $proposal->investment_type,
            'amount' => $proposal->amount !== null ? (float) $proposal->amount : null,
            'currency' => 'BDT',
            'equity_percentage' => $proposal->equity_percentage !== null ? (float) $proposal->equity_percentage : null,
            'profit_sharing_percentage' => $proposal->profit_sharing_percentage !== null ? (float) $proposal->profit_sharing_percentage : null,
            'loss_sharing_terms' => $proposal->loss_sharing_terms,
            'proposed_terms' => $proposal->proposed_terms,
            'note' => $proposal->note,
            'status' => $proposal->status,
            'responded_by_user_id' => $proposal->responded_by_user_id,
            'responded_at' => $proposal->responded_at?->toISOString(),
            'created_at' => $proposal->created_at?->toISOString(),
            'updated_at' => $proposal->updated_at?->toISOString(),
        ];
    }

    /**
     * Format agreement response.
     */
    private function formatAgreementResponse(\App\Models\DealAgreement $agreement): array
    {
        return [
            'id' => $agreement->id,
            'deal_id' => $agreement->deal_id,
            'proposal_id' => $agreement->proposal_id,
            'agreement_type' => $agreement->agreement_type,
            'title' => $agreement->title,
            'agreement_text' => $agreement->agreement_text,
            'terms_snapshot' => $agreement->terms_snapshot,
            'status' => $agreement->status,
            'founder_signed_at' => $agreement->founder_signed_at?->toISOString(),
            'founder_signed_user_id' => $agreement->founder_signed_user_id,
            'counterparty_signed_at' => $agreement->counterparty_signed_at?->toISOString(),
            'counterparty_signed_user_id' => $agreement->counterparty_signed_user_id,
            'finalized_at' => $agreement->finalized_at?->toISOString(),
            'created_at' => $agreement->created_at?->toISOString(),
            'updated_at' => $agreement->updated_at?->toISOString(),
        ];
    }
}
