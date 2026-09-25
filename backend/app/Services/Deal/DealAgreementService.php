<?php

namespace App\Services\Deal;

use App\Enums\DealStage;
use App\Enums\ParticipantRole;
use App\Models\Deal;
use App\Models\DealAgreement;
use App\Models\DealStateHistory;
use App\Models\DealTermProposal;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class DealAgreementService
{
    /**
     * Retrieve agreement details for an authorized participant.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function getAgreement(Deal $deal, User $user, ?string $roleParam = null): ?DealAgreement
    {
        app(DealAccessService::class)->view($deal, $user, $roleParam);

        app(DealService::class)->reconcileAgreementStage($deal, $user);

        return $deal->agreement()
            ->with(['proposal', 'founderSigner', 'counterpartySigner'])
            ->first();
    }

    /**
     * Generate a prototype agreement draft from the accepted negotiation proposal.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function generateAgreement(Deal $deal, User $user, ?string $roleParam = null): DealAgreement
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        $acceptedProposal = DealTermProposal::where('deal_id', $deal->id)
            ->where('status', 'accepted')
            ->latest('id')
            ->first();

        if (! $acceptedProposal) {
            throw ValidationException::withMessages([
                'proposal' => ['Cannot generate agreement without an accepted negotiation proposal.'],
            ]);
        }

        $existingAgreement = $deal->agreement()->first();
        if ($existingAgreement && $existingAgreement->isFinalized()) {
            throw ValidationException::withMessages([
                'agreement' => ['Finalized agreement is immutable and cannot be regenerated.'],
            ]);
        }

        $business = $deal->business;
        $founder = $deal->founderUser;
        $counterparty = $deal->counterpartyUser;

        $agreementType = match ($acceptedProposal->investment_type) {
            'micro_profit_sharing' => 'profit_sharing_agreement',
            'standard_equity' => 'shareholders_agreement',
            'professional_collaboration' => 'collaboration_agreement',
            default => 'deal_agreement',
        };

        $title = match ($acceptedProposal->investment_type) {
            'micro_profit_sharing' => 'Micro Investment Profit-Loss Sharing Agreement',
            'standard_equity' => 'Standard Investment Shareholders Agreement',
            'professional_collaboration' => 'Professional Collaboration Agreement',
            default => 'Vault Ventures Deal Agreement',
        };

        $text = $this->buildAgreementText(
            $title,
            $agreementType,
            $business->name ?? 'Business Entity',
            $founder->email ?? 'Founder',
            $counterparty->email ?? 'Counterparty',
            $deal->counterparty_role->value,
            $acceptedProposal
        );

        $snapshot = [
            'proposal_id' => $acceptedProposal->id,
            'version' => $acceptedProposal->version,
            'investment_type' => $acceptedProposal->investment_type,
            'amount' => $acceptedProposal->amount !== null ? (float) $acceptedProposal->amount : null,
            'currency' => 'BDT',
            'equity_percentage' => $acceptedProposal->equity_percentage !== null ? (float) $acceptedProposal->equity_percentage : null,
            'profit_sharing_percentage' => $acceptedProposal->profit_sharing_percentage !== null ? (float) $acceptedProposal->profit_sharing_percentage : null,
            'loss_sharing_terms' => $acceptedProposal->loss_sharing_terms,
            'proposed_terms' => $acceptedProposal->proposed_terms,
            'generated_at' => now()->toISOString(),
        ];

        return DB::transaction(function () use ($deal, $acceptedProposal, $agreementType, $title, $text, $snapshot, $existingAgreement) {
            if ($existingAgreement) {
                $existingAgreement->proposal_id = $acceptedProposal->id;
                $existingAgreement->agreement_type = $agreementType;
                $existingAgreement->title = $title;
                $existingAgreement->agreement_text = $text;
                $existingAgreement->terms_snapshot = $snapshot;
                $existingAgreement->status = 'pending_signatures';
                $existingAgreement->founder_signed_at = null;
                $existingAgreement->founder_signed_user_id = null;
                $existingAgreement->counterparty_signed_at = null;
                $existingAgreement->counterparty_signed_user_id = null;
                $existingAgreement->finalized_at = null;
                $existingAgreement->save();

                return $existingAgreement;
            }

            return DealAgreement::create([
                'deal_id' => $deal->id,
                'proposal_id' => $acceptedProposal->id,
                'agreement_type' => $agreementType,
                'title' => $title,
                'agreement_text' => $text,
                'terms_snapshot' => $snapshot,
                'status' => 'pending_signatures',
            ]);
        });
    }

    /**
     * Confirm/sign the agreement on behalf of the authenticated participant.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    public function signAgreement(Deal $deal, User $user, ?string $roleParam = null): DealAgreement
    {
        $this->enforceDealParticipant($deal, $user, $roleParam);

        $agreement = $deal->agreement()->first();
        if (! $agreement) {
            throw ValidationException::withMessages([
                'agreement' => ['No agreement has been generated for this deal yet.'],
            ]);
        }

        if ($agreement->isFinalized()) {
            app(DealService::class)->reconcileAgreementStage($deal, $user);

            return $agreement->fresh(['proposal', 'founderSigner', 'counterpartySigner']) ?? $agreement;
        }

        if (in_array($agreement->status, ['declined', 'voided'], true)) {
            throw ValidationException::withMessages([
                'agreement' => ['Agreement has been '.$agreement->status.' and cannot be signed.'],
            ]);
        }

        $isFounder = $deal->founder_user_id === $user->id;
        $isCounterparty = $deal->counterparty_user_id === $user->id;

        return DB::transaction(function () use ($deal, $agreement, $user, $isFounder, $isCounterparty) {
            $locked = DealAgreement::where('id', $agreement->id)->lockForUpdate()->firstOrFail();

            if ($isFounder) {
                $locked->founder_signed_at = now();
                $locked->founder_signed_user_id = $user->id;
            }

            if ($isCounterparty) {
                $locked->counterparty_signed_at = now();
                $locked->counterparty_signed_user_id = $user->id;
            }

            if ($locked->founder_signed_at !== null && $locked->counterparty_signed_at !== null) {
                $locked->status = 'accepted';
                $locked->finalized_at = now();
            }

            $locked->save();

            if ($locked->isFinalized()) {
                app(DealService::class)->reconcileAgreementStage($deal, $user);
            }

            return $locked->fresh(['proposal', 'founderSigner', 'counterpartySigner']) ?? $locked;
        });
    }

    /**
     * Build deterministic prototype agreement text.
     */
    private function buildAgreementText(
        string $title,
        string $type,
        string $businessName,
        string $founderIdentifier,
        string $counterpartyIdentifier,
        string $counterpartyRole,
        DealTermProposal $proposal
    ): string {
        $amountStr = $proposal->amount !== null ? 'BDT '.number_format((float) $proposal->amount, 2) : 'N/A';
        $equityStr = $proposal->equity_percentage !== null ? $proposal->equity_percentage.'%' : 'N/A';
        $profitShareStr = $proposal->profit_sharing_percentage !== null ? $proposal->profit_sharing_percentage.'%' : 'N/A';
        $lossTermsStr = $proposal->loss_sharing_terms ?? 'Standard risk profile applies.';
        $termsStr = $proposal->proposed_terms ?? 'Standard collaboration expectations apply.';

        return <<<TEXT
{$title}

PARTIES:
- Founder / Business: {$businessName} (Represented by: {$founderIdentifier})
- Counterparty: {$counterpartyIdentifier} (Role: {$counterpartyRole})

INVESTMENT & TERMS SUMMARY:
- Investment Model: {$proposal->investment_type}
- Committed Amount: {$amountStr}
- Equity Ownership: {$equityStr}
- Distributable Profit Share: {$profitShareStr}
- Risk & Loss Sharing: {$lossTermsStr}
- Agreed Terms & Scope: {$termsStr}

ACADEMIC PROTOTYPE & SIMULATION DISCLAIMER:
This agreement is generated for academic demonstration and prototype simulation on the Vault Ventures platform.
No real financial custody, escrow, brokerage, fund movement, or legally binding equity issuance is executed.
Both parties confirm mutual understanding and simulated acceptance of the above recorded terms.
TEXT;
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
