<?php

namespace App\Services\Disclosure;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessNda;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class StageFourService
{
    /**
     * Confirm Stage 4 (Full Proposal) access for a relationship.
     *
     * @throws HttpException
     * @throws ModelNotFoundException
     */
    public function confirmStageFour(
        Business $business,
        User $user,
        User $counterparty
    ): BusinessDisclosureRelationship {
        $this->validateBusinessVisibility($business, $user);

        if (! $this->isBusinessOwner($business, $user)) {
            throw new HttpException(403, 'Only the business founder can confirm Stage 4 access.');
        }

        if ($counterparty->id === $user->id) {
            throw new HttpException(422, 'Cannot confirm Stage 4 for oneself.');
        }

        if (! $user->isIdentityVerified()) {
            throw new HttpException(403, 'Founder must possess Tier 1 identity verification to confirm Stage 4.');
        }

        if (! $counterparty->isIdentityVerified()) {
            throw new HttpException(403, 'Counterparty must possess Tier 1 identity verification before Stage 4 can be confirmed.');
        }

        return DB::transaction(function () use ($business, $counterparty) {
            $relationship = BusinessDisclosureRelationship::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->lockForUpdate()
                ->first();

            if ($relationship === null) {
                throw new HttpException(404, 'No disclosure relationship found for this counterparty.');
            }

            if ($relationship->stage === DisclosureStage::FullProposal || $relationship->stage_4_confirmed_at !== null) {
                throw new HttpException(409, 'Stage 4 has already been confirmed for this relationship.');
            }

            if ($relationship->stage !== DisclosureStage::Nda) {
                throw new HttpException(403, 'Stage 4 confirmation requires relationship to be currently at Stage 3 (NDA Protected).');
            }

            $nda = BusinessNda::where('business_id', $business->id)
                ->where('counterparty_user_id', $counterparty->id)
                ->lockForUpdate()
                ->first();

            if ($nda === null || $nda->status !== NdaStatus::Active) {
                throw new HttpException(403, 'An active bilateral NDA is required before Stage 4 can be confirmed.');
            }

            $relationship->stage = DisclosureStage::FullProposal;
            $relationship->stage_4_confirmed_at = now();
            $relationship->save();

            return $relationship;
        });
    }

    /**
     * Ensure business visibility adheres to the draft isolation boundary.
     *
     * @throws ModelNotFoundException
     */
    private function validateBusinessVisibility(Business $business, User $user): void
    {
        $isOwner = $this->isBusinessOwner($business, $user);

        if (! $isOwner && ! in_array($business->status, [BusinessStatus::Published, BusinessStatus::Submitted], true)) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }
    }

    /**
     * Determine if a user is the founder owner of a business.
     */
    private function isBusinessOwner(Business $business, User $user): bool
    {
        return $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
    }
}
