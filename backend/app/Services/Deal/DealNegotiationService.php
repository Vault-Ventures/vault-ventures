<?php

namespace App\Services\Deal;

use App\Enums\ParticipantRole;
use App\Models\Deal;
use App\Models\DealTermProposal;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealNegotiationService
{
    /**
     * Retrieve negotiation status and proposal history for an authorized participant.
     *
     * @return array{deal_id: int, active_proposal: ?DealTermProposal, proposals: Collection<int, DealTermProposal>}
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getNegotiation(Deal $deal, User $user, ?string $roleParam = null): array
    {
        app(DealAccessService::class)->view($deal, $user, $roleParam);

        $proposals = $deal->proposals()->with(['proposedBy', 'respondedBy'])->orderBy('version')->get();
        $activeProposal = $proposals->whereIn('status', ['proposed', 'accepted'])->last();

        return [
            'deal_id' => $deal->id,
            'active_proposal' => $activeProposal,
            'proposals' => $proposals,
        ];
    }

    /**
     * Submit an initial term proposal or counter-offer.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function proposeTerms(
        Deal $deal,
        User $user,
        array $data,
        ?string $roleParam = null
    ): DealTermProposal {
        $this->enforceDealParticipant($deal, $user, $roleParam);
        $this->validateProposalData($deal, $data);

        $isFounder = $deal->founder_user_id === $user->id;
        $proposerRole = $isFounder ? 'founder' : $deal->counterparty_role->value;

        return DB::transaction(function () use ($deal, $user, $data, $proposerRole) {
            $lockedDeal = Deal::where('id', $deal->id)->lockForUpdate()->firstOrFail();

            // Supersede any existing pending proposal
            $existingPending = DealTermProposal::where('deal_id', $lockedDeal->id)
                ->where('status', 'proposed')
                ->lockForUpdate()
                ->get();

            foreach ($existingPending as $pending) {
                $pending->status = 'countered';
                $pending->responded_by_user_id = $user->id;
                $pending->responded_at = now();
                $pending->save();
            }

            $currentMaxVersion = (int) DealTermProposal::where('deal_id', $lockedDeal->id)->max('version');
            $newVersion = $currentMaxVersion + 1;

            return DealTermProposal::create([
                'deal_id' => $lockedDeal->id,
                'version' => $newVersion,
                'proposed_by_user_id' => $user->id,
                'proposed_by_role' => $proposerRole,
                'investment_type' => $data['investment_type'],
                'amount' => isset($data['amount']) && $data['amount'] !== '' ? (float) $data['amount'] : null,
                'equity_percentage' => isset($data['equity_percentage']) && $data['equity_percentage'] !== '' ? (float) $data['equity_percentage'] : null,
                'profit_sharing_percentage' => isset($data['profit_sharing_percentage']) && $data['profit_sharing_percentage'] !== '' ? (float) $data['profit_sharing_percentage'] : null,
                'loss_sharing_terms' => $data['loss_sharing_terms'] ?? null,
                'proposed_terms' => $data['proposed_terms'] ?? null,
                'note' => $data['note'] ?? null,
                'status' => 'proposed',
            ]);
        });
    }

    /**
     * Respond to a pending proposal (accept, counter, or decline).
     *
     * @param  array<string, mixed>  $counterData
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function respondToProposal(
        Deal $deal,
        DealTermProposal $proposal,
        User $user,
        string $action,
        array $counterData = [],
        ?string $roleParam = null
    ): DealTermProposal {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        if ($proposal->deal_id !== $deal->id) {
            throw new HttpException(404, 'Proposal does not belong to this deal.');
        }

        if ($proposal->proposed_by_user_id === $user->id) {
            throw ValidationException::withMessages([
                'action' => ['Proposer cannot accept, decline, or counter their own proposal.'],
            ]);
        }

        if ($proposal->status !== 'proposed') {
            throw ValidationException::withMessages([
                'proposal' => ['Only pending proposals in proposed status can be responded to.'],
            ]);
        }

        $normalizedAction = strtolower(trim($action));
        if (! in_array($normalizedAction, ['accept', 'decline', 'counter'], true)) {
            throw ValidationException::withMessages([
                'action' => ['Invalid action. Must be accept, decline, or counter.'],
            ]);
        }

        if ($normalizedAction === 'counter') {
            if (empty($counterData)) {
                throw ValidationException::withMessages([
                    'terms' => ['Counter proposal terms are required.'],
                ]);
            }

            return $this->proposeTerms($deal, $user, $counterData, $roleParam);
        }

        return DB::transaction(function () use ($proposal, $user, $normalizedAction) {
            $lockedProposal = DealTermProposal::where('id', $proposal->id)->lockForUpdate()->firstOrFail();

            if ($lockedProposal->status !== 'proposed') {
                throw ValidationException::withMessages([
                    'proposal' => ['Proposal is no longer pending.'],
                ]);
            }

            $lockedProposal->status = $normalizedAction === 'accept' ? 'accepted' : 'declined';
            $lockedProposal->responded_by_user_id = $user->id;
            $lockedProposal->responded_at = now();
            $lockedProposal->save();

            return $lockedProposal;
        });
    }

    /**
     * Validate proposal data against investment mode rules.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    private function validateProposalData(Deal $deal, array $data): void
    {
        $allowedTypes = ['micro_profit_sharing', 'standard_equity', 'professional_collaboration'];
        $type = $data['investment_type'] ?? null;

        if (! in_array($type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'investment_type' => ['Invalid investment type. Must be micro_profit_sharing, standard_equity, or professional_collaboration.'],
            ]);
        }

        if (isset($data['amount']) && $data['amount'] !== null && $data['amount'] !== '') {
            if (! is_numeric($data['amount']) || (float) $data['amount'] <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Financial amount must be a positive number in BDT.'],
                ]);
            }
        }

        if (isset($data['equity_percentage']) && $data['equity_percentage'] !== null && $data['equity_percentage'] !== '') {
            if (! is_numeric($data['equity_percentage']) || (float) $data['equity_percentage'] < 0.01 || (float) $data['equity_percentage'] > 100.00) {
                throw ValidationException::withMessages([
                    'equity_percentage' => ['Equity percentage must be between 0.01 and 100.00.'],
                ]);
            }
        }

        if (isset($data['profit_sharing_percentage']) && $data['profit_sharing_percentage'] !== null && $data['profit_sharing_percentage'] !== '') {
            if (! is_numeric($data['profit_sharing_percentage']) || (float) $data['profit_sharing_percentage'] < 0.01 || (float) $data['profit_sharing_percentage'] > 100.00) {
                throw ValidationException::withMessages([
                    'profit_sharing_percentage' => ['Profit sharing percentage must be between 0.01 and 100.00.'],
                ]);
            }
        }

        if ($type === 'micro_profit_sharing') {
            if (! isset($data['profit_sharing_percentage']) || $data['profit_sharing_percentage'] === null || $data['profit_sharing_percentage'] === '') {
                throw ValidationException::withMessages([
                    'profit_sharing_percentage' => ['Profit sharing percentage is required for Micro Investment.'],
                ]);
            }
            if (isset($data['equity_percentage']) && (float) $data['equity_percentage'] > 0) {
                throw ValidationException::withMessages([
                    'equity_percentage' => ['Micro Investment does not include direct equity ownership.'],
                ]);
            }
        } elseif ($type === 'standard_equity') {
            if (! isset($data['equity_percentage']) || $data['equity_percentage'] === null || $data['equity_percentage'] === '') {
                throw ValidationException::withMessages([
                    'equity_percentage' => ['Equity percentage is required for Standard Investment.'],
                ]);
            }
            if (isset($data['profit_sharing_percentage']) && (float) $data['profit_sharing_percentage'] > 0) {
                throw ValidationException::withMessages([
                    'profit_sharing_percentage' => ['Standard Investment uses equity rather than profit-sharing.'],
                ]);
            }
        } elseif ($type === 'professional_collaboration') {
            $hasAmount = isset($data['amount']) && (float) $data['amount'] > 0;
            $hasEquity = isset($data['equity_percentage']) && (float) $data['equity_percentage'] > 0;
            $hasTerms = isset($data['proposed_terms']) && trim((string) $data['proposed_terms']) !== '';

            if (! $hasAmount && ! $hasEquity && ! $hasTerms) {
                throw ValidationException::withMessages([
                    'proposed_terms' => ['Professional collaboration proposal must include compensation amount, equity percentage, or terms description.'],
                ]);
            }
        }
    }

    /**
     * Enforce participant authorization on a deal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function enforceDealParticipant(Deal $deal, User $user, ?string $roleParam): void
    {
        app(DealAccessService::class)->participant($deal, $user, $roleParam);
    }

}
